import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageSquare, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import FreelancerCard, { type FreelancerCardProps, type FreelancerConversationState } from "@/components/FreelancerCard";
import { canUseClientFeatures, getStoredUser } from "@/components/professionals-session";
import { useProfessionalFavorites } from "@/components/useProfessionalFavorites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { fetchConversations, getCurrentUserId, type ConversationSummary } from "@/lib/chat";

import { apiFetch } from "@/lib/apiClient";
import { API_URL } from "@/lib/api";

const BASE_URL = `${API_URL}/professionals/freelancers/`;
const PAGE_SIZE = 8;

interface FreelancersResponse {
  freelancers: FreelancerCardProps[];
}

const normalizeFreelancer = (freelancer: FreelancerCardProps): FreelancerCardProps => ({
  ...freelancer,
  bio: freelancer.bio || `${freelancer.name} ofrece servicios como ${freelancer.title} y trabaja con enfoque en calidad, buena comunicacion y resultados claros para cada cliente.`,
  experience: freelancer.experience || "3+ anos de experiencia profesional",
  completedProjects: freelancer.completedProjects ?? Math.max(12, freelancer.reviews),
  responseTime: freelancer.responseTime || "Responde en menos de 2 horas",
  availability: freelancer.availability || "Disponible esta semana",
  category: freelancer.category || "General",
});

const formatSavedAt = (savedAt?: string) =>
  savedAt
    ? new Date(savedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
    : "Sin fecha";

const getConversationState = (freelancer: FreelancerCardProps, conversation?: ConversationSummary): FreelancerConversationState => {
  if (!freelancer.userId || !conversation) return { label: "Enviar mensaje", hasConversation: false, hasUnread: false };
  if (conversation.unreadCount > 0) return { label: "Nuevo mensaje", hasConversation: true, hasUnread: true, conversationId: conversation.id, lastResponseAt: conversation.lastResponseAt };
  return { label: "Ver chat", hasConversation: true, hasUnread: false, conversationId: conversation.id, lastResponseAt: conversation.lastResponseAt };
};

const SavedProfiles = () => {
  const navigate = useNavigate();
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | number | null>(null);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("recentes");
  const [showOnlyChatActive, setShowOnlyChatActive] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const user = getStoredUser();
  const currentUserId = getCurrentUserId();
  const canSaveFavorites = canUseClientFeatures(user);
  const { savedFavorites, savedFreelancerIds, toggleFavorite, getFavoriteEntry } = useProfessionalFavorites(user, canSaveFavorites);

  const { data, isLoading } = useQuery({
    queryKey: ["saved-profiles", "freelancers"],
    queryFn: async (): Promise<FreelancersResponse> => {
      const response = await apiFetch(BASE_URL, {
        method: "GET",
      });
      if (!response.ok) throw new Error("No se pudieron cargar los profesionales");
      return response.json();
    },
    retry: 1,
  });

  const conversationsQuery = useQuery({
    queryKey: ["saved-profiles", "conversations", currentUserId],
    queryFn: () => fetchConversations(currentUserId as number),
    enabled: Boolean(currentUserId && canSaveFavorites),
    refetchInterval: 2500,
  });

  const conversationsByUserId = new Map((conversationsQuery.data?.conversations ?? []).map((conversation) => [conversation.otherUser.id, conversation]));

  const savedFreelancers = useMemo(() => {
    return (data?.freelancers ?? [])
      .map(normalizeFreelancer)
      .filter((freelancer) => freelancer.id !== undefined && savedFreelancerIds.includes(freelancer.id))
      .map((freelancer) => ({
        ...freelancer,
        favoriteEntry: freelancer.id !== undefined ? getFavoriteEntry(freelancer.id) : undefined,
        conversation: freelancer.userId ? conversationsByUserId.get(freelancer.userId) : undefined,
      }));
  }, [data?.freelancers, savedFreelancerIds, getFavoriteEntry, conversationsByUserId]);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(savedFreelancers.map((freelancer) => freelancer.category || "General")))],
    [savedFreelancers],
  );

  const filteredFreelancers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const items = savedFreelancers.filter((freelancer) => {
      const matchesCategory = selectedCategory === "Todas" || freelancer.category === selectedCategory;
      const matchesChat = !showOnlyChatActive || Boolean(freelancer.conversation?.hasMessages);
      if (!matchesCategory || !matchesChat) return false;
      if (!normalizedSearch) return true;

      const content = [
        freelancer.name,
        freelancer.title,
        freelancer.location,
        freelancer.category,
        freelancer.availability,
        freelancer.conversation?.hasMessages ? "chat activo" : "sin chat",
        ...freelancer.skills,
      ].join(" ").toLowerCase();

      return content.includes(normalizedSearch);
    });

    const sorted = [...items].sort((a, b) => {
      if (sortBy === "recentes") {
        return new Date(b.favoriteEntry?.savedAt || 0).getTime() - new Date(a.favoriteEntry?.savedAt || 0).getTime();
      }
      if (sortBy === "verificados") {
        return Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified));
      }
      if (sortBy === "chat") {
        return Number(Boolean(b.conversation?.hasMessages)) - Number(Boolean(a.conversation?.hasMessages));
      }
      return (a.category || "").localeCompare(b.category || "");
    });

    return sorted;
  }, [savedFreelancers, searchTerm, selectedCategory, showOnlyChatActive, sortBy]);

  const visibleFreelancers = filteredFreelancers.slice(0, visibleCount);
  const hasMore = filteredFreelancers.length > visibleCount;

  const handleRequireClientLogin = () => setIsLoginPromptOpen(true);

  const handleToggleSave = (id: string | number | undefined) => {
    if (id === undefined) return;
    if (!canSaveFavorites) return handleRequireClientLogin();

    const { saved } = toggleFavorite(id);
    const selectedFreelancer = savedFreelancers.find((freelancer) => freelancer.id === id);

    toast({
      title: saved ? "Perfil guardado" : "Perfil quitado",
      description: selectedFreelancer
        ? `${selectedFreelancer.name} fue ${saved ? "agregado" : "removido"} de tus favoritos.`
        : `El perfil fue ${saved ? "agregado" : "removido"} de tus favoritos.`,
    });
  };

  if (!user || !canSaveFavorites) {
    return (
      <div className="container mx-auto px-4 pb-20 pt-28">
        <Card className="mx-auto max-w-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>Perfiles guardados solo para clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Inicia sesion con una cuenta cliente para guardar profesionales y revisarlos despues desde esta pagina.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login"><Button>Iniciar sesion</Button></Link>
              <Link to="/freelancers"><Button variant="outline">Ver profesionales</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 pb-16 pt-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">Favoritos</Badge>
            <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">Perfiles guardados</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">Revisa tus likes con contexto real: fecha guardada, estado del chat, categoria y disponibilidad.</p>
          </div>
          <Button variant="outline" className="w-fit rounded-full" onClick={() => navigate("/freelancers")}>Explorar mas profesionales</Button>
        </div>

        <div className="mb-6 grid gap-4 rounded-[28px] border border-border bg-card/95 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Busca por nombre, skill, categoria o disponibilidad..."
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="recentes">Mas recientes</option>
            <option value="verificados">Verificados</option>
            <option value="chat">Con chat activo</option>
            <option value="categoria">Por categoria</option>
          </select>
          <Button
            type="button"
            variant={showOnlyChatActive ? "default" : "outline"}
            onClick={() => {
              setShowOnlyChatActive((current) => !current);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            Solo con chat activo
          </Button>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Badge className="border-transparent bg-primary text-primary-foreground hover:bg-primary">{savedFavorites.length} guardados</Badge>
          <Badge variant="outline">{savedFreelancers.filter((freelancer) => freelancer.conversation?.hasMessages).length} con chat</Badge>
          <Badge variant="outline">{savedFreelancers.filter((freelancer) => freelancer.isVerified).length} verificados</Badge>
        </div>

        {!isLoading && savedFreelancers.length === 0 ? (
          <Card className="overflow-hidden border-border shadow-sm">
            <CardContent className="relative flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/8 to-background" />
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-foreground">Tu shortlist todavia esta vacia</h2>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                  Guarda perfiles para compararlos con calma, revisar si ya tienes chat con ellos y volver rapido a los profesionales que mas te interesan.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => navigate("/freelancers")}>Explorar profesionales</Button>
                  <Button variant="outline" onClick={() => navigate("/messages")}>Abrir mensajes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredFreelancers.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20 shadow-sm">
            <CardContent className="px-6 py-14 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">Ningun favorito coincide con esos filtros</h2>
              <p className="mt-2 text-sm text-muted-foreground">Prueba con otra categoria, cambia el orden o desactiva el filtro de chat activo.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {visibleFreelancers.map((freelancer, index) => (
                <FreelancerCard
                  key={freelancer.id ?? `${freelancer.name}-${index}`}
                  {...freelancer}
                  index={index}
                  isSaved={freelancer.id !== undefined && savedFreelancerIds.includes(freelancer.id)}
                  onToggleSave={handleToggleSave}
                  canUseChat={canSaveFavorites}
                  onRequireClientLogin={handleRequireClientLogin}
                  conversationState={getConversationState(freelancer, freelancer.conversation)}
                  savedAtLabel={formatSavedAt(freelancer.favoriteEntry?.savedAt)}
                  showSavedContext
                  isDialogOpen={freelancer.id !== undefined && selectedFreelancerId === freelancer.id}
                  onDialogOpenChange={(isOpen) => {
                    if (isOpen) {
                      setSelectedFreelancerId(freelancer.id ?? null);
                      return;
                    }
                    setSelectedFreelancerId((current) => (current === freelancer.id ? null : current));
                  }}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" className="rounded-full" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
                  Cargar mas perfiles guardados
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
        <DialogContent className="max-w-md rounded-[28px] border border-border bg-background p-0 shadow-2xl">
          <div className="overflow-hidden rounded-[28px]">
            <div className="bg-gradient-to-r from-primary/15 via-secondary/10 to-background px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl text-foreground">Inicia sesion como cliente</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">Para guardar profesionales en favoritos y escribir por chat necesitas entrar con una cuenta de cliente.</DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 py-5">
              <DialogFooter className="gap-3 sm:justify-start">
                <Button type="button" className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90" onClick={() => { setIsLoginPromptOpen(false); navigate("/login"); }}>
                  Ir a iniciar sesion
                </Button>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsLoginPromptOpen(false)}>
                  Ahora no
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SavedProfiles;
