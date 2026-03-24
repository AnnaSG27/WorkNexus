import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle, Clock3, Heart, MapPin, MessageSquare, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

export interface FreelancerCardProps {
  id?: string | number;
  userId?: number;
  avatar?: string;
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

export interface FreelancerConversationState {
  label: "Enviar mensaje" | "Ver chat" | "Nuevo mensaje";
  hasConversation: boolean;
  hasUnread: boolean;
  conversationId?: number;
  lastResponseAt?: string | null;
}

interface FreelancerCardComponentProps extends FreelancerCardProps {
  isSaved?: boolean;
  onToggleSave?: (id: string | number | undefined) => void;
  isDialogOpen?: boolean;
  onDialogOpenChange?: (isOpen: boolean) => void;
  canUseChat?: boolean;
  onRequireClientLogin?: () => void;
  conversationState?: FreelancerConversationState;
  savedAtLabel?: string | null;
  showSavedContext?: boolean;
}

const FreelancerCard = ({
  id,
  userId,
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
  conversationState,
  savedAtLabel,
  showSavedContext = false,
}: FreelancerCardComponentProps) => {
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isHeartPopping, setIsHeartPopping] = useState(false);

  useEffect(() => {
    if (!isHeartPopping) return;
    const timeout = window.setTimeout(() => setIsHeartPopping(false), 260);
    return () => window.clearTimeout(timeout);
  }, [isHeartPopping]);

  const profileBio =
    bio ||
    `${name} trabaja como ${title} y se especializa en proyectos orientados a resultados, comunicacion clara y entregas bien cuidadas.`;

  const profileExperience = experience || "3+ anos de experiencia trabajando con clientes remotos";
  const projectsDone = completedProjects ?? Math.max(12, reviews);
  const profileResponseTime = responseTime || "Responde en menos de 2 horas";
  const profileAvailability = availability || "Disponible esta semana";
  const dialogOpen = isDialogOpen ?? internalIsOpen;
  const setDialogOpen = onDialogOpenChange ?? setInternalIsOpen;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");

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

  const openRealConversation = () => {
    if (!canUseChat) {
      onRequireClientLogin?.();
      return;
    }

    if (!userId) {
      toast({
        title: "Chat no disponible",
        description: "Este perfil todavia no tiene una cuenta conectada para abrir conversacion.",
      });
      return;
    }

    setDialogOpen(false);
    navigate(`/messages?contact=${userId}`);
  };

  const handleToggleFavorite = (event?: MouseEvent | KeyboardEvent) => {
    event?.stopPropagation();
    setIsHeartPopping(true);
    onToggleSave?.(id);
  };

  const conversationBadge = conversationState?.hasUnread
    ? "Nuevo mensaje"
    : conversationState?.hasConversation
      ? "Chat activo"
      : null;

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 }}
        whileHover={{ y: -6 }}
        onClick={() => setDialogOpen(true)}
        className="group w-full overflow-hidden rounded-[28px] border border-border bg-card p-6 text-left shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 rounded-2xl ring-4 ring-background shadow-sm">
                {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
                <AvatarFallback className="rounded-2xl bg-secondary/20 text-base font-semibold text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary ring-2 ring-background">
                  <CheckCircle className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
              <p className="truncate text-sm font-medium text-primary">{title}</p>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          <motion.div animate={isHeartPopping ? { scale: [1, 1.22, 0.95, 1] } : { scale: 1 }} transition={{ duration: 0.26 }}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isSaved ? "Quitar de favoritos" : "Guardar profesional"}
              className={isSaved ? "rounded-full bg-secondary text-secondary-foreground" : "rounded-full text-muted-foreground"}
              onClick={handleToggleFavorite}
            >
              <Heart className={`h-4 w-4 transition-transform ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </motion.div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {category && <Badge variant="outline">{category}</Badge>}
          {conversationBadge && <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">{conversationBadge}</Badge>}
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

        <div className="mb-5 flex flex-wrap gap-2">
          {skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="border-transparent text-xs font-medium">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && <Badge variant="outline" className="text-xs">+{skills.length - 3}</Badge>}
        </div>

        {showSavedContext && (
          <div className="mb-5 grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Guardado</span>
              <span className="font-medium text-foreground">{savedAtLabel || "Recientemente"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Disponibilidad</span>
              <span className="font-medium text-foreground">{profileAvailability}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Conversacion</span>
              <span className="font-medium text-foreground">{conversationState?.label || "Sin mensajes"}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/80 pt-4">
          <div>
            <span className="text-xs text-muted-foreground">Tarifa</span>
            <p className="text-lg font-bold text-foreground">{hourlyRate > 0 ? `$${hourlyRate}/hr` : "A convenir"}</p>
          </div>
          <Button
            type="button"
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            onClick={(event) => {
              event.stopPropagation();
              openRealConversation();
            }}
          >
            {conversationState?.label || "Contactar"}
          </Button>
        </div>
      </motion.button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl overflow-y-auto p-0">
          <div className="bg-background">
            <div className="sticky top-0 z-10 border-b border-border/80 bg-background/95 px-6 py-5 backdrop-blur md:px-8">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl md:text-3xl">{name}</DialogTitle>
                <DialogDescription className="max-w-2xl text-sm leading-6 md:text-base">
                  Perfil profesional con informacion clave, bloques separados y contacto directo cuando lo necesites.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <section className="rounded-[28px] border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  <div className="relative">
                    <Avatar className="h-28 w-28 rounded-[28px] ring-4 ring-muted shadow-sm">
                      {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
                      <AvatarFallback className="rounded-[28px] bg-secondary/20 text-3xl font-semibold text-secondary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
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
                      {conversationBadge && <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">{conversationBadge}</Badge>}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{location}</span>
                      <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" />{rating} con {reviews} resenas</span>
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" />{projectsDone} proyectos completados</span>
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{profileResponseTime}</span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button type="button" className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90" onClick={openRealConversation}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {conversationState?.label || "Contactar"}
                      </Button>
                      <Button type="button" variant="outline" className="rounded-full bg-background" onClick={handleToggleFavorite}>
                        <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current text-primary" : ""}`} />
                        {isSaved ? "Quitar de favoritos" : "Guardar en favoritos"}
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm lg:col-span-2">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumen</h4>
                  <p className="text-sm leading-7 text-foreground">{profileBio}</p>
                </div>
                <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tarifa y disponibilidad</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Tarifa</span>
                      <span className="font-medium text-foreground">{hourlyRate > 0 ? `$${hourlyRate}/hr` : "A convenir"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Disponibilidad</span>
                      <span className="text-right font-medium text-foreground">{profileAvailability}</span>
                    </div>
                    {savedAtLabel && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Guardado</span>
                        <span className="text-right font-medium text-foreground">{savedAtLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Experiencia y metricas</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {profileMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                        <p className="mt-1 text-sm font-medium leading-6 text-foreground">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FreelancerCard;
