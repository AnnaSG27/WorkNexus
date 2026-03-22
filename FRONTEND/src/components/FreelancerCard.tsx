import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export interface FreelancerCardProps {
  id?: string | number;
  avatar: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  skills: string[];
  hourlyRate: number;
  isVerified?: boolean;
  index?: number;
  bio?: string;
  experience?: string;
  completedProjects?: number;
  responseTime?: string;
  availability?: string;
  category?: string;
  featuredLabel?: string;
}

interface FreelancerCardComponentProps extends FreelancerCardProps {
  isSaved?: boolean;
  onToggleSave?: (id: string | number | undefined) => void;
  isProfileDialogOpen?: boolean;
  onProfileDialogOpenChange?: (isOpen: boolean) => void;
  isChatDialogOpen?: boolean;
  onChatDialogOpenChange?: (isOpen: boolean) => void;
  canUseChat?: boolean;
  onRequireClientLogin?: () => void;
}

const FreelancerCard = ({
  id,
  avatar,
  name,
  title,
  location,
  rating,
  reviews,
  skills,
  hourlyRate,
  isVerified = false,
  index = 0,
  bio,
  experience,
  completedProjects,
  responseTime,
  availability,
  category,
  featuredLabel,
  isSaved = false,
  onToggleSave,
  isProfileDialogOpen,
  onProfileDialogOpenChange,
  isChatDialogOpen,
  onChatDialogOpenChange,
  canUseChat = false,
  onRequireClientLogin,
}: FreelancerCardComponentProps) => {
  const [internalProfileOpen, setInternalProfileOpen] = useState(false);
  const [internalChatOpen, setInternalChatOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      author: "profesional" as const,
      text: `Hola, soy ${name}. Cuentame un poco sobre tu proyecto y con gusto revisamos como puedo ayudarte.`,
      timeLabel: new Date().toLocaleTimeString("es-CO", {
        hour: "numeric",
        minute: "2-digit",
      }),
    },
  ]);
  const profileInitials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");

  const profileBio =
    bio ||
    `${name} trabaja como ${title} y se especializa en proyectos orientados a resultados, comunicacion clara y entregas bien cuidadas.`;

  const profileExperience = experience || "3+ anos de experiencia trabajando con clientes remotos";
  const projectsDone = completedProjects ?? Math.max(12, reviews);
  const profileResponseTime = responseTime || "Responde en menos de 2 horas";
  const profileAvailability = availability || "Disponible esta semana";
  const proposalPrompt = `Hola ${name}, me interesa solicitar una propuesta para un proyecto relacionado con ${category || title}.`;
  const profileDialogOpen = isProfileDialogOpen ?? internalProfileOpen;
  const setProfileDialogOpen = onProfileDialogOpenChange ?? setInternalProfileOpen;
  const chatDialogOpen = isChatDialogOpen ?? internalChatOpen;
  const setChatDialogOpen = onChatDialogOpenChange ?? setInternalChatOpen;

  const trustBadges = useMemo(() => {
    const badges: string[] = [];
    if (featuredLabel) badges.push(featuredLabel);
    if (rating >= 4.9) badges.push("Top Rated");
    if (profileResponseTime.toLowerCase().includes("30") || profileResponseTime.toLowerCase().includes("45")) {
      badges.push("Respuesta rapida");
    }
    if (projectsDone >= 100) badges.push("Mas contratado");
    if (isVerified) badges.push("Verificado");
    return badges.slice(0, 3);
  }, [featuredLabel, isVerified, profileResponseTime, projectsDone, rating]);

  const profileMetrics = [
    { label: "Tarifa", value: hourlyRate > 0 ? `$${hourlyRate}/hr` : "A convenir" },
    { label: "Experiencia", value: profileExperience },
    { label: "Disponibilidad", value: profileAvailability },
    { label: "Proyectos", value: `${projectsDone} completados` },
    { label: "Categoria", value: category || "General" },
    { label: "Tiempo de respuesta", value: profileResponseTime },
  ];

  const handleSendMessage = (customMessage?: string) => {
    if (!canUseChat) {
      onRequireClientLogin?.();
      return;
    }

    const nextMessage = (customMessage ?? draftMessage).trim();
    if (!nextMessage) return;

    const timeLabel = new Date().toLocaleTimeString("es-CO", {
      hour: "numeric",
      minute: "2-digit",
    });

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `client-${Date.now()}`,
        author: "cliente",
        text: nextMessage,
        timeLabel,
      },
    ]);
    setDraftMessage("");

    window.setTimeout(() => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `pro-${Date.now()}`,
          author: "profesional",
          text: "Gracias por escribirme. Ya revise tu mensaje y podemos seguir conversando desde aqui cuando quieras.",
          timeLabel: new Date().toLocaleTimeString("es-CO", {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ]);
    }, 700);
  };

  const handleOpenChat = () => {
    if (!canUseChat) {
      onRequireClientLogin?.();
      return;
    }

    setChatDialogOpen(true);
  };

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -8 }}
        onClick={() => setProfileDialogOpen(true)}
        className="group w-full overflow-hidden rounded-[28px] border border-border bg-card p-6 text-left shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-muted/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="h-16 w-16 rounded-2xl object-cover ring-4 ring-background shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-foreground ring-4 ring-background shadow-sm">
                  {profileInitials || "WN"}
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary ring-2 ring-background">
                  <CheckCircle className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
              </div>
              <p className="truncate text-sm font-medium text-primary">{title}</p>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isSaved ? "Quitar de favoritos" : "Guardar profesional"}
            className={isSaved ? "rounded-full bg-secondary text-secondary-foreground" : "rounded-full text-muted-foreground"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave?.(id);
            }}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {category && <Badge variant="outline">{category}</Badge>}
          {trustBadges.map((badge) => (
            <Badge key={badge} className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
              {badge}
            </Badge>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-semibold text-foreground">{rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({reviews} resenas)</span>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="border-transparent text-xs font-medium">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{skills.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/80 pt-4">
          <div>
            <span className="text-xs text-muted-foreground">Tarifa</span>
            <p className="text-lg font-bold text-foreground">
              {hourlyRate > 0 ? `$${hourlyRate}/hr` : "A convenir"}
            </p>
          </div>
          <Button
            type="button"
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            onClick={(event) => {
              event.stopPropagation();
              handleOpenChat();
            }}
          >
            Contactar
          </Button>
        </div>
      </motion.button>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl overflow-y-auto rounded-[28px] border border-border bg-background p-0">
          <div className="sticky top-0 z-10 border-b border-border/80 bg-background/95 px-6 py-5 backdrop-blur md:px-8">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl md:text-3xl">{name}</DialogTitle>
              <DialogDescription className="max-w-2xl text-sm leading-6 md:text-base">
                Perfil profesional con informacion clave y detalles para evaluar si encaja con tu proyecto.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-6 p-6 md:p-8">
            <section className="rounded-[28px] border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="h-28 w-28 rounded-[28px] object-cover ring-4 ring-muted shadow-sm"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-[28px] bg-muted text-3xl font-semibold text-foreground ring-4 ring-muted shadow-sm">
                      {profileInitials || "WN"}
                    </div>
                  )}
                  {isVerified && (
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary ring-4 ring-background">
                      <CheckCircle className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-semibold text-foreground md:text-[1.7rem]">{title}</h3>
                    {category && <Badge variant="outline">{category}</Badge>}
                    {trustBadges.map((badge) => (
                      <Badge key={badge} className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {rating} con {reviews} resenas
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {projectsDone} proyectos completados
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4" />
                      {profileResponseTime}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                    {profileMetrics.map((metric) => (
                      <div key={metric.label} className="border-b border-border/60 pb-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                        <p className="mt-1 text-sm font-medium leading-6 text-foreground">{metric.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        setProfileDialogOpen(false);
                        handleOpenChat();
                      }}
                    >
                      Contactar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full bg-background"
                      onClick={() => onToggleSave?.(id)}
                    >
                      <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current text-primary" : ""}`} />
                      {isSaved ? "Quitar de favoritos" : "Guardar en favoritos"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumen del perfil</h4>
              <p className="text-sm leading-7 text-foreground">{profileBio}</p>
            </section>

            <section className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Habilidades principales</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl flex-col overflow-hidden rounded-[28px] border border-border bg-background p-0">
          <div className="border-b border-border bg-gradient-to-r from-card via-card to-muted/20 px-6 py-5 md:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative">
                  {avatar ? (
                    <img src={avatar} alt={name} className="h-14 w-14 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-foreground shadow-sm">
                      {profileInitials || "WN"}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-lg font-semibold text-foreground">Chat con {name}</h4>
                  <p className="truncate text-sm text-muted-foreground">
                    {title} · {location}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-emerald-600">Disponible para conversar</span>
                    {isSaved && (
                      <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
                        En favoritos
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.08),_transparent_35%),linear-gradient(to_bottom,_hsl(var(--background)),_hsl(var(--muted)/0.45))]">
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <span className="rounded-full border border-border bg-background/90 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground shadow-sm">
                    Conversacion activa
                  </span>
                </div>

                {messages.map((message) => {
                  const isClientMessage = message.author === "cliente";

                  return (
                    <div key={message.id} className={`flex ${isClientMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ${
                        isClientMessage
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border bg-background text-foreground"
                      }`}>
                        <p className="text-sm leading-6">{message.text}</p>
                        <div className={`mt-2 flex items-center gap-2 text-[11px] ${
                          isClientMessage ? "justify-end text-primary-foreground/80" : "text-muted-foreground"
                        }`}>
                          {!isClientMessage && <span>{name}</span>}
                          <span>{message.timeLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border bg-background/95 px-4 py-4 backdrop-blur md:px-6">
              <div className="mb-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleSendMessage(proposalPrompt)}
                  disabled={!canUseChat}
                >
                  Solicitar propuesta
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full bg-background"
                  onClick={() => onToggleSave?.(id)}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current text-primary" : ""}`} />
                  {isSaved ? "Quitar de favoritos" : "Guardar"}
                </Button>
              </div>

              {!canUseChat && (
                <div className="mb-3 rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  Inicia sesion como cliente para escribir en el chat y continuar la conversacion.
                </div>
              )}

              <div className="rounded-[26px] border border-border bg-muted/30 p-3 shadow-sm">
                <Textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje sobre tu proyecto, presupuesto o tiempos..."
                  className="min-h-24 resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0"
                  disabled={!canUseChat}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Enter para enviar, Shift + Enter para salto de linea
                  </p>
                  <Button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                    disabled={!canUseChat || !draftMessage.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FreelancerCard;
