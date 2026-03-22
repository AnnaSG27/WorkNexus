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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface ChatMessage {
  id: string;
  author: "cliente" | "profesional";
  text: string;
  timeLabel: string;
}

interface FreelancerCardComponentProps extends FreelancerCardProps {
  isSaved?: boolean;
  onToggleSave?: (id: string | number | undefined) => void;
  isDialogOpen?: boolean;
  onDialogOpenChange?: (isOpen: boolean) => void;
  canUseChat?: boolean;
  onRequireClientLogin?: () => void;
}

const getTimeLabel = (date = new Date()) =>
  date.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  });

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
  isDialogOpen,
  onDialogOpenChange,
  canUseChat = false,
  onRequireClientLogin,
}: FreelancerCardComponentProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      author: "profesional",
      text: `Hola, soy ${name}. Cuentame un poco sobre tu proyecto y con gusto revisamos como puedo ayudarte.`,
      timeLabel: getTimeLabel(),
    },
  ]);

  const profileBio =
    bio ||
    `${name} trabaja como ${title} y se especializa en proyectos orientados a resultados, comunicacion clara y entregas bien cuidadas.`;

  const profileExperience = experience || "3+ anos de experiencia trabajando con clientes remotos";
  const projectsDone = completedProjects ?? Math.max(12, reviews);
  const profileResponseTime = responseTime || "Responde en menos de 2 horas";
  const profileAvailability = availability || "Disponible esta semana";
  const proposalPrompt = `Hola ${name}, me interesa solicitar una propuesta para un proyecto relacionado con ${category || title}.`;
  const dialogOpen = isDialogOpen ?? internalIsOpen;
  const setDialogOpen = onDialogOpenChange ?? setInternalIsOpen;

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

  const placeholderReply = useMemo(
    () => "Gracias por escribirme. Ya revise tu mensaje y puedo ayudarte con una propuesta para este proyecto.",
    [],
  );

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

    const now = Date.now();
    const timeLabel = getTimeLabel();

    setMessages((current) => [
      ...current,
      { id: `${now}-user`, author: "cliente", text: nextMessage, timeLabel },
      { id: `${now + 1}-pro`, author: "profesional", text: placeholderReply, timeLabel: getTimeLabel() },
    ]);
    setDraftMessage("");

    toast({
      title: "Mensaje enviado",
      description: `Tu mensaje para ${name} quedo registrado en este chat.`,
    });
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
        onClick={() => setDialogOpen(true)}
        className="group w-full overflow-hidden rounded-[28px] border border-border bg-card p-6 text-left shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-muted/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative">
              <img
                src={avatar}
                alt={name}
                className="h-16 w-16 rounded-2xl object-cover ring-4 ring-background shadow-sm"
              />
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
              setDialogOpen(true);
            }}
          >
            Contactar
          </Button>
        </div>
      </motion.button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-6xl overflow-hidden p-0">
          <div className="grid max-h-[90vh] grid-cols-1 bg-background md:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <div className="min-h-0 overflow-y-auto bg-background">
              <div className="sticky top-0 z-10 border-b border-border/80 bg-background/95 px-6 py-5 backdrop-blur md:px-8">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl md:text-3xl">{name}</DialogTitle>
                  <DialogDescription className="max-w-2xl text-sm leading-6 md:text-base">
                    Perfil profesional con informacion clave, acciones rapidas y acceso a conversacion directa.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <section className="rounded-[28px] border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <div className="relative">
                      <img
                        src={avatar}
                        alt={name}
                        className="h-28 w-28 rounded-[28px] object-cover ring-4 ring-muted shadow-sm"
                      />
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
                          onClick={() => handleSendMessage(proposalPrompt)}
                        >
                          Solicitar propuesta
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full bg-background"
                          onClick={() => {
                            const chatContainer = document.querySelector("[data-chat-panel='true']");
                            chatContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          Abrir chat
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
            </div>

            <div data-chat-panel="true" className="min-h-0 overflow-y-auto border-t border-border bg-muted/20 md:border-l md:border-t-0">
              <div className="sticky top-0 z-10 border-b border-border/70 bg-background/90 px-6 py-5 backdrop-blur md:px-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">Chat con {name}</h4>
                      <p className="text-sm text-muted-foreground">Conversacion directa sobre tu proyecto</p>
                    </div>
                  </div>
                  {isSaved && (
                    <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
                      En favoritos
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex min-h-full flex-col p-6 md:p-8">
                <div className="mb-4 flex justify-center">
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Hoy
                  </span>
                </div>

                <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-border bg-background p-4 shadow-sm">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        message.author === "cliente"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p
                        className={`mt-2 text-[11px] ${
                          message.author === "cliente" ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {message.timeLabel}
                      </p>
                    </div>
                  ))}

                  {messages.length === 1 && canUseChat && (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                      Todavia no has iniciado la conversacion. Puedes enviar un mensaje directo o pedir una propuesta para empezar.
                    </div>
                  )}
                </div>

                <div className="mt-4 shrink-0 space-y-3 pb-1">
                  {!canUseChat && (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Inicia sesion como cliente para escribir en el chat, pedir una propuesta y continuar la conversacion.
                    </div>
                  )}
                  <Textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Escribe aqui los detalles de tu proyecto..."
                    className="min-h-24 rounded-2xl border-border bg-background resize-none shadow-sm"
                    disabled={!canUseChat}
                  />
                  <Button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!canUseChat}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar mensaje
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
