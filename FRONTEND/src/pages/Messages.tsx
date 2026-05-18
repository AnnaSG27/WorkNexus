import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { es } from "date-fns/locale";
import { CheckCheck, Inbox, MessageSquare, SendHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStoredUser } from "@/components/professionals-session";
import { Language, useI18n } from "@/i18n";
import { fetchConversationMessages, fetchConversations, fetchMessagingStats, getCurrentUserId, sendMessage, startConversation } from "@/lib/chat";

const REFRESH_INTERVAL_MS = 2500;

const formatRelativeDate = (value: string | null | undefined, language: Language) => {
  if (!value) return "Sin actividad";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true, locale: language === "es" ? es : enUS });
  } catch {
    return "Fecha invalida";
  }
};

const Messages = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const user = getStoredUser();
  const currentUserId = getCurrentUserId();
  const contactUserId = Number(searchParams.get("contact") || 0) || null;
  const requestedConversationId = Number(searchParams.get("conversation") || 0) || null;

  const conversationsQuery = useQuery({
    queryKey: ["messaging", "conversations", currentUserId],
    queryFn: () => fetchConversations(currentUserId as number),
    enabled: Boolean(currentUserId),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const statsQuery = useQuery({
    queryKey: ["messaging", "stats", currentUserId],
    queryFn: () => fetchMessagingStats(currentUserId as number),
    enabled: Boolean(currentUserId),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const messagesQuery = useQuery({
    queryKey: ["messaging", "conversation", selectedConversationId, currentUserId],
    queryFn: () => fetchConversationMessages(selectedConversationId as number, currentUserId as number),
    enabled: Boolean(currentUserId && selectedConversationId),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const startConversationMutation = useMutation({
    mutationFn: ({ currentId, otherId }: { currentId: number; otherId: number }) => startConversation(currentId, otherId),
    onSuccess: ({ conversation }) => {
      setSelectedConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["messaging", "conversations", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["messaging", "stats", currentUserId] });
      const next = new URLSearchParams(searchParams);
      next.delete("contact");
      setSearchParams(next);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, senderId, content }: { conversationId: number; senderId: number; content: string }) =>
      sendMessage(conversationId, senderId, content),
    onSuccess: async () => {
      setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messaging", "conversation", selectedConversationId, currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["messaging", "conversations", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["messaging", "stats", currentUserId] }),
      ]);
    },
  });

  const conversations = conversationsQuery.data?.conversations ?? [];
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ??
    messagesQuery.data?.conversation ??
    null;

  useEffect(() => {
    if (!currentUserId || !contactUserId || currentUserId === contactUserId) return;
    startConversationMutation.mutate({ currentId: currentUserId, otherId: contactUserId });
  }, [contactUserId, currentUserId]);

  useEffect(() => {
    if (!requestedConversationId) return;
    setSelectedConversationId(requestedConversationId);
  }, [requestedConversationId]);

  useEffect(() => {
    if (selectedConversationId || conversations.length === 0) return;
    setSelectedConversationId(conversations[0].id);
  }, [conversations, selectedConversationId]);

  const statCards = useMemo(() => {
    const stats = statsQuery.data?.stats;
    return [
      { label: "Conversaciones", value: stats?.conversationCount ?? 0 },
      { label: "Sin leer", value: stats?.unreadCount ?? 0 },
    ];
  }, [statsQuery.data?.stats]);

  if (!user || !currentUserId) {
    return (
      <div className="container mx-auto px-4 pb-20 pt-28">
        <Card className="mx-auto max-w-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>Debes iniciar sesion para usar mensajes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">El panel de mensajes muestra tus conversaciones activas, mensajes enviados, recibidos y respuestas en tiempo real.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login"><Button>Iniciar sesion</Button></Link>
              <Link to="/freelancers"><Button variant="outline">Explorar freelancers</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-16 pt-24">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">Mensajeria</Badge>
          <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">Centro de conversaciones</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">Revisa tu bandeja, responde en tiempo real y mantén visible tanto lo enviado como lo recibido.</p>
        </div>
        <Button variant="outline" className="w-fit rounded-full" onClick={() => navigate("/freelancers")}>Buscar profesionales</Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="grid min-h-[70vh] grid-cols-1 gap-0 p-0 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="border-b border-border lg:border-b-0 lg:border-r">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Bandeja de entrada</p>
                  <p className="text-sm text-muted-foreground">{conversations.length} conversaciones</p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[320px] lg:h-[calc(70vh-73px)]">
              <div className="space-y-2 p-3">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === selectedConversationId;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/30 hover:bg-muted/40"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{conversation.otherUser.displayName}</p>
                          <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage?.content || "Aun no hay mensajes"}</p>
                          {conversation.lastResponseAt && <p className="mt-1 text-[11px] text-muted-foreground">Ultima respuesta {formatRelativeDate(conversation.lastResponseAt, language)}</p>}
                        </div>
                        {conversation.unreadCount > 0 && <Badge className="border-transparent bg-primary text-primary-foreground hover:bg-primary">{conversation.unreadCount}</Badge>}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{conversation.otherUser.userType || "usuario"}</span>
                        <span>{formatRelativeDate(conversation.updatedAt, language)}</span>
                      </div>
                    </button>
                  );
                })}

                {!conversationsQuery.isLoading && conversations.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                    Todavia no tienes conversaciones activas. Desde los perfiles de freelancers puedes iniciar una nueva.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-h-[420px] flex-col">
            <div className="border-b border-border p-5">
              {selectedConversation ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src="" alt={selectedConversation.otherUser.displayName} />
                      <AvatarFallback>
                        {selectedConversation.otherUser.displayName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase() ?? "")
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{selectedConversation.otherUser.displayName}</p>
                      <p className="text-sm text-muted-foreground">Conversacion activa con {selectedConversation.otherUser.userType || "usuario"}</p>
                      {selectedConversation.lastResponseAt && <p className="mt-1 text-xs text-muted-foreground">Ultima respuesta {formatRelativeDate(selectedConversation.lastResponseAt, language)}</p>}
                    </div>
                  </div>
                  <Badge variant="outline">{selectedConversation.messageCount} mensajes</Badge>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-foreground">Selecciona una conversacion</p>
                  <p className="text-sm text-muted-foreground">Tu historial aparecera aqui.</p>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 bg-muted/20">
              <div className="space-y-4 p-5">
                {messagesQuery.data?.messages.map((message) => (
                  <div key={message.id} className={`flex items-end gap-3 ${message.isMine ? "justify-end" : "justify-start"}`}>
                    {!message.isMine && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={message.senderDisplayName} />
                        <AvatarFallback>
                          {message.senderDisplayName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() ?? "")
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.isMine ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
                    >
                      {!message.isMine && <p className="mb-1 text-[11px] font-semibold text-muted-foreground">{message.senderDisplayName}</p>}
                      <p>{message.content}</p>
                      <p className={`mt-2 text-[11px] ${message.isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{formatRelativeDate(message.createdAt, language)}</p>
                      {message.isMine && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-primary-foreground/80">
                          <CheckCheck className="h-3 w-3" />
                          {message.readAt ? "Leido" : "Enviado"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {selectedConversation && !messagesQuery.isLoading && (messagesQuery.data?.messages.length ?? 0) === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
                    Esta conversacion aun no tiene mensajes. Puedes enviar el primero ahora mismo.
                  </div>
                )}

                {!selectedConversation && (
                  <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-border bg-background p-6 text-center">
                    <div>
                      <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-4 font-medium text-foreground">Tu panel de mensajes esta listo</p>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">Abre una conversacion existente o visita la seccion de freelancers para iniciar una nueva.</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Ultima actividad: {formatRelativeDate(statsQuery.data?.stats.lastActivity, language)}</span>
                {sendMessageMutation.isPending && <span>Enviando...</span>}
              </div>
              <div className="flex gap-3">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={!selectedConversation || sendMessageMutation.isPending}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!selectedConversationId || !draft.trim()) return;
                      sendMessageMutation.mutate({ conversationId: selectedConversationId, senderId: currentUserId, content: draft.trim() });
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={!selectedConversation || !draft.trim() || sendMessageMutation.isPending}
                  onClick={() => {
                    if (!selectedConversationId || !draft.trim()) return;
                    sendMessageMutation.mutate({ conversationId: selectedConversationId, senderId: currentUserId, content: draft.trim() });
                  }}
                >
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;
