import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Briefcase,
  CheckCircle,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
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
}

interface FreelancerCardComponentProps extends FreelancerCardProps {
  isSaved?: boolean;
  onToggleSave?: (id: string | number | undefined) => void;
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
}: FreelancerCardComponentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      author: "profesional",
      text: `Hola, soy ${name}. Cuentame un poco sobre tu proyecto y con gusto revisamos como puedo ayudarte.`,
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

  const handleSendMessage = (customMessage?: string) => {
    const nextMessage = (customMessage ?? draftMessage).trim();
    if (!nextMessage) return;

    const now = Date.now();
    setMessages((current) => [
      ...current,
      { id: `${now}-user`, author: "cliente", text: nextMessage },
      { id: `${now + 1}-pro`, author: "profesional", text: placeholderReply },
    ]);
    setDraftMessage("");
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
        onClick={() => setIsOpen(true)}
        className="group w-full overflow-hidden rounded-[28px] border border-border bg-card p-6 text-left shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-muted/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-4 min-w-0">
            <div className="relative">
              <img
                src={avatar}
                alt={name}
                className="h-16 w-16 rounded-2xl object-cover ring-4 ring-background shadow-sm"
              />
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center ring-2 ring-background">
                  <CheckCircle className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
              </div>
              <p className="truncate text-sm font-medium text-primary">{title}</p>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isSaved ? "Quitar de guardados" : "Guardar profesional"}
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
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="font-semibold text-foreground">{rating}</span>
          </div>
          <span className="text-muted-foreground text-sm">({reviews} resenas)</span>
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
            className="rounded-full bg-primary px-5 hover:bg-primary/90 text-primary-foreground"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(true);
            }}
          >
            Contactar
          </Button>
        </div>
      </motion.button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <div className="grid max-h-[90vh] grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="min-h-0 overflow-y-auto bg-background p-6 md:p-8">
              <DialogHeader className="mb-6 border-b border-border/70 pb-6">
                <DialogTitle className="text-2xl md:text-3xl">{name}</DialogTitle>
                <DialogDescription className="max-w-2xl text-base leading-7">
                  Perfil profesional ampliado con informacion general, senales de confianza y acceso a chat directo.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <img
                    src={avatar}
                    alt={name}
                    className="h-24 w-24 rounded-[24px] object-cover ring-4 ring-muted shadow-sm"
                  />
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                      {category && <Badge variant="outline">{category}</Badge>}
                      {trustBadges.map((badge) => (
                        <Badge key={badge} className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        {rating} con {reviews} resenas
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {projectsDone} proyectos
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="w-4 h-4" />
                        {profileResponseTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Tarifa</p>
                    <p className="text-xl font-bold text-foreground">
                      {hourlyRate > 0 ? `$${hourlyRate}/hr` : "A convenir"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Experiencia</p>
                    <p className="text-sm font-medium text-foreground">{profileExperience}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Disponibilidad</p>
                    <p className="text-sm font-medium text-foreground">{profileAvailability}</p>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Award className="h-4 w-4 text-primary" />
                      Calidad destacada
                    </div>
                    <p className="text-sm text-muted-foreground">Muy buenas valoraciones y entregas consistentes.</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Perfil confiable
                    </div>
                    <p className="text-sm text-muted-foreground">Informacion completa y presencia activa en la plataforma.</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Buena respuesta
                    </div>
                    <p className="text-sm text-muted-foreground">{profileResponseTime} para nuevos proyectos.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="rounded-full bg-primary px-5 hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleSendMessage(proposalPrompt)}
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
                    {isSaved ? "Guardado en shortlist" : "Guardar en shortlist"}
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Sobre el perfil</h4>
                  <p className="text-sm leading-7 text-foreground">{profileBio}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Habilidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 border-t border-border bg-muted/20 p-6 md:border-l md:border-t-0 md:p-8">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-semibold text-foreground">Chat con {name}</h4>
                </div>
                {isSaved && <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">En shortlist</Badge>}
              </div>

              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-[240px] flex-1 overflow-y-auto rounded-[24px] border border-border bg-background p-4 shadow-sm space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.author === "cliente"
                        ? "ml-auto bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                </div>

                <div className="mt-4 space-y-3">
                  <Textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Escribe aqui los detalles de tu proyecto..."
                    className="min-h-24 rounded-2xl border-border bg-background resize-none shadow-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Send className="w-4 h-4 mr-2" />
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
