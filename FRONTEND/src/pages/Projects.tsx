import { FormEvent, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Clock3,
  Heart,
  HeartOff,
  MapPin,
  Search,
  Send,
  Sparkles,
  Star,
  Target,
  Trash2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getStoredUser } from "@/components/professionals-session";
import { toast } from "@/hooks/use-toast";
import {
  applyToProject,
  createProject,
  fetchMyApplications,
  fetchProjects,
  toggleProjectFavorite,
  deleteProject,
  updateApplicationStatus,
  updateProjectStatus,
  type CreateProjectPayload,
  type Project,
} from "@/lib/projects";
import { createReview } from "@/lib/reviews";

const categoryOptions = [
  { value: "all", label: "Todas las categorias" },
  { value: "desarrollo", label: "Desarrollo" },
  { value: "diseno", label: "Diseno" },
  { value: "marketing", label: "Marketing" },
  { value: "contenido", label: "Contenido" },
  { value: "soporte", label: "Soporte" },
  { value: "otros", label: "Otros" },
];

const modalityOptions = [
  { value: "all", label: "Todas las modalidades" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Hibrido" },
  { value: "presencial", label: "Presencial" },
];

const clientProjectStatusOptions = [
  { value: "abierto", label: "Abierto" },
  { value: "en_revision", label: "En revision" },
  { value: "en_ejecucion", label: "En ejecucion" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cerrado", label: "Cerrado" },
];

const applicationStatusOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revision" },
  { value: "aceptada", label: "Aceptada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "retirada", label: "Retirada" },
];

const initialForm: CreateProjectPayload = {
  clientId: "",
  title: "",
  description: "",
  category: "desarrollo",
  budget: "",
  timeline: "",
  location: "",
  skills: "",
  referenceUrl: "",
  modality: "remoto",
  deadline: "",
};

const formatCopCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const statusLabelMap = Object.fromEntries(
  [...clientProjectStatusOptions, ...applicationStatusOptions].map((item) => [item.value, item.label]),
);

const getStatusBadgeClass = (status: string) => {
  if (status === "aceptada" || status === "finalizado") return "bg-secondary text-secondary-foreground";
  if (status === "rechazada" || status === "cerrado" || status === "retirada") return "bg-destructive text-destructive-foreground";
  if (status === "en_ejecucion" || status === "en_revision") return "bg-accent text-accent-foreground";
  return "bg-primary text-primary-foreground";
};

const scoreProjectForFreelancer = (project: Project, bio?: string) => {
  const bioText = (bio || "").toLowerCase();
  const projectText = `${project.category} ${project.skills.join(" ")}`.toLowerCase();

  const score = project.skills.reduce((total, skill) => total + (bioText.includes(skill.toLowerCase()) ? 2 : 0), 0);
  return score + (bioText.includes(project.category.toLowerCase()) ? 3 : 0) + (projectText.includes("remoto") ? 0.5 : 0);
};

const Projects = () => {
  const user = getStoredUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("explore");
  const [formState, setFormState] = useState<CreateProjectPayload>(initialForm);
  const [coverLetters, setCoverLetters] = useState<Record<number, string>>({});
  const [proposedBudgets, setProposedBudgets] = useState<Record<number, string>>({});
  const [reviewForms, setReviewForms] = useState<Record<number, { rating: number; comment: string }>>({});
  const [reviewProject, setReviewProject] = useState<Project | null>(null);
  const [pendingReviewProjectId, setPendingReviewProjectId] = useState<number | null>(null);
  const [highlightedProjectId, setHighlightedProjectId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    modality: "all",
    status: "all",
    minBudget: "",
    maxBudget: "",
  });

  const deferredSearch = useDeferredValue(filters.search);
  const isClient = user?.userType === "cliente";
  const isFreelancer = user?.userType === "freelancer";

  const projectsQuery = useQuery({
    queryKey: ["projects", user?.id, user?.userType, deferredSearch, filters.category, filters.modality, filters.status, filters.minBudget, filters.maxBudget],
    queryFn: async () => {
      if (!user?.id) return { projects: [], favorites: [], summary: { projectCount: 0, openCount: 0, inProgressCount: 0, completedCount: 0 } };

      return fetchProjects({
        clientId: isClient ? user.id : undefined,
        freelancerId: isFreelancer ? user.id : undefined,
        search: deferredSearch,
        category: filters.category,
        modality: filters.modality,
        status: filters.status,
        minBudget: filters.minBudget,
        maxBudget: filters.maxBudget,
      });
    },
    enabled: Boolean(user?.id),
  });

  const applicationsQuery = useQuery({
    queryKey: ["projects", "applications", user?.id],
    queryFn: () => fetchMyApplications(user?.id ?? ""),
    enabled: Boolean(isFreelancer && user?.id),
  });

  const favoritesQuery = useQuery({
    queryKey: ["projects", "favorites", user?.id],
    queryFn: () => fetchProjects({ freelancerId: user?.id ?? "", favoriteOnly: true }),
    enabled: Boolean(isFreelancer && user?.id),
  });

  const invalidateAllProjectQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
      queryClient.invalidateQueries({ queryKey: ["messaging"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: () => createProject({ ...formState, clientId: user?.id ?? "" }),
    onSuccess: async (data, variables) => {
      setFormState({ ...initialForm, clientId: "" });
      await invalidateAllProjectQueries();
      toast({ title: "Proyecto publicado", description: "Ya puedes empezar a recibir postulaciones." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo publicar", description: error.message, variant: "destructive" });
    },
  });

  const applyMutation = useMutation({
    mutationFn: ({ projectId }: { projectId: number }) =>
      applyToProject(projectId, {
        freelancerId: user?.id ?? "",
        coverLetter: coverLetters[projectId] ?? "",
        proposedBudget: proposedBudgets[projectId] ?? "",
      }),
    onSuccess: async (_, variables) => {
      setCoverLetters((current) => ({ ...current, [variables.projectId]: "" }));
      setProposedBudgets((current) => ({ ...current, [variables.projectId]: "" }));
      await invalidateAllProjectQueries();
      toast({ title: "Postulacion enviada", description: "Ahora puedes seguir su estado desde Mis postulaciones." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo aplicar", description: error.message, variant: "destructive" });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (projectId: number) => toggleProjectFavorite(projectId, user?.id ?? ""),
    onSuccess: async (data) => {
      await invalidateAllProjectQueries();
      toast({
        title: data.isFavorite ? "Proyecto guardado" : "Proyecto retirado de favoritos",
        description: data.isFavorite ? "Lo encontrarás facilmente en tu pestaña de favoritos." : "Puedes volver a guardarlo cuando quieras.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo actualizar favorito", description: error.message, variant: "destructive" });
    },
  });

  const projectStatusMutation = useMutation({
    mutationFn: ({ projectId, status }: { projectId: number; status: string }) => updateProjectStatus(projectId, user?.id ?? "", status),
    onSuccess: async (data, variables) => {
      await invalidateAllProjectQueries();
      toast({ title: "Proyecto actualizado", description: "El estado del proyecto se guardó correctamente." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo actualizar el proyecto", description: error.message, variant: "destructive" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: number) => deleteProject(projectId, user?.id ?? ""),
    onSuccess: async () => {
      await invalidateAllProjectQueries();
      toast({ title: "Proyecto eliminado", description: "La publicación se eliminó correctamente." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo eliminar el proyecto", description: error.message, variant: "destructive" });
    },
  });

  const applicationStatusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: number; status: string }) =>
      updateApplicationStatus(applicationId, user?.id ?? "", status),
    onSuccess: async (data, variables) => {
      await invalidateAllProjectQueries();
      if (variables.status === "aceptada") {
        toast({ title: "Postulacion aceptada", description: "Se abrió una conversación para continuar el proyecto." });
      } else {
        toast({ title: "Postulacion actualizada", description: `Ahora está en estado ${statusLabelMap[variables.status] ?? variables.status}.` });
      }
      if (data.conversationId) navigate(`/messages?conversation=${data.conversationId}`);
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo actualizar la postulacion", description: error.message, variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ projectId, rating, comment }: { projectId: number; rating: number; comment: string }) =>
      createReview({
        clientId: user?.id ?? "",
        projectId,
        rating,
        comment,
      }),
    onSuccess: async (_, variables) => {
      setReviewForms((current) => ({
        ...current,
        [variables.projectId]: { rating: 5, comment: "" },
      }));
      await Promise.all([
        updateProjectStatus(variables.projectId, user?.id ?? "", "cerrado"),
        queryClient.invalidateQueries({ queryKey: ["freelancers"] }),
        queryClient.invalidateQueries({ queryKey: ["profile", "reviews"] }),
      ]);
      setReviewProject(null);
      setPendingReviewProjectId(null);
      await invalidateAllProjectQueries();
      toast({ title: "Reseña guardada", description: "La calificación ya se sumó al perfil del freelancer." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo guardar la reseña", description: error.message, variant: "destructive" });
    },
  });

  const projects = projectsQuery.data?.projects ?? [];
  const visibleClientProjects = isClient ? projects.filter((project) => project.status !== "cerrado") : projects;
  const favoriteProjects = favoritesQuery.data?.projects ?? [];
  const myApplications = applicationsQuery.data?.applications ?? [];

  const recommendedProjects = useMemo(() => {
    if (!isFreelancer) return [];
    return [...projects]
      .sort((left, right) => scoreProjectForFreelancer(right, user?.bio) - scoreProjectForFreelancer(left, user?.bio))
      .slice(0, 3);
  }, [isFreelancer, projects, user?.bio]);

  const handlePublish = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate();
  };

  const handleOpenRecommendedProject = (projectId: number) => {
    setHighlightedProjectId(projectId);

    window.requestAnimationFrame(() => {
      const projectCard = document.getElementById(`project-card-${projectId}`);
      projectCard?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const getReviewForm = (projectId: number) => reviewForms[projectId] ?? { rating: 5, comment: "" };

  useEffect(() => {
    if (!pendingReviewProjectId) return;
    const matchedProject = projects.find((project) => project.id === pendingReviewProjectId);
    if (!matchedProject) return;
    if (matchedProject.status === "finalizado" && matchedProject.assignedFreelancer && !matchedProject.review) {
      setReviewProject(matchedProject);
      setPendingReviewProjectId(null);
    }
  }, [pendingReviewProjectId, projects]);

  const handleClientProjectStatusChange = (project: Project, status: string) => {
    if (status === "finalizado") {
      setPendingReviewProjectId(project.id);
    }
    projectStatusMutation.mutate({ projectId: project.id, status });
  };

  if (!user) {
    return (
      <div className="relative overflow-hidden bg-background pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(220_70%_45%_/_0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_hsl(175_60%_45%_/_0.16),_transparent_28%)]" />
        <section className="relative border-b border-border/60 bg-[linear-gradient(180deg,hsl(210_20%_97%),hsl(210_20%_98%))] pb-16 pt-10">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <Badge className="rounded-full bg-secondary/15 px-4 py-1 text-secondary hover:bg-secondary/20">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Proyectos WorkNexus
                </Badge>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Publica oportunidades o encuentra tu siguiente proyecto con una experiencia clara y directa.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                  Los clientes pueden publicar necesidades reales y los freelancers pueden descubrir proyectos activos para postularse en minutos.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="gap-2">
                    <Link to="/login">
                      Iniciar sesion
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/register">Crear cuenta</Link>
                  </Button>
                </div>
              </div>

              <Card className="border-border/70 bg-background/90 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Como funciona</CardTitle>
                  <CardDescription>La nueva seccion de proyectos conecta demanda real con talento disponible.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ["Clientes publican proyectos", "Definen alcance, presupuesto y tiempos esperados.", <Briefcase className="h-5 w-5" key="a" />, "text-primary bg-primary/10"],
                    ["Freelancers exploran oportunidades", "La plataforma muestra proyectos abiertos para aplicar facilmente.", <Target className="h-5 w-5" key="b" />, "text-secondary bg-secondary/10"],
                    ["Las aplicaciones llegan al cliente", "Cada publicacion permite recibir candidatos directamente.", <Users className="h-5 w-5" key="c" />, "text-accent bg-accent/10"],
                  ].map(([title, description, icon, palette]) => (
                    <div key={title} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${palette}`}>{icon}</div>
                        <div>
                          <p className="font-medium text-foreground">{title}</p>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const renderProjectCard = (project: Project) => (
    <Card
      id={`project-card-${project.id}`}
      key={project.id}
      className={`overflow-hidden border-border/70 shadow-md transition-all ${highlightedProjectId === project.id ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <CardHeader className="gap-4 border-b border-border/50 bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{project.title}</CardTitle>
            <CardDescription className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {project.enterpriseName || project.clientDisplayName}
              </span>
              {project.timeline && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {project.timeline}
                </span>
              )}
              {project.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {project.location}
                </span>
              )}
              {project.deadline && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Cierra: {project.deadline}
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{project.category}</Badge>
            <Badge className="bg-primary/90">{formatCopCurrency(project.budget)}</Badge>
            <Badge className={getStatusBadgeClass(project.status)}>{statusLabelMap[project.status] ?? project.status}</Badge>
            <Badge variant="outline">{project.modality}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <p className="text-sm leading-6 text-muted-foreground">{project.description}</p>

        {(project.skills.length > 0 || project.referenceUrl) && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
            {project.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-background">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
            {project.referenceUrl && (
              <a href={project.referenceUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                Ver referencia del proyecto
              </a>
            )}
          </div>
        )}

        {isClient ? (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Gestion del proyecto</p>
                <p className="text-sm text-muted-foreground">Actualiza el estado y revisa a quienes aplicaron.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={project.status}
                  onChange={(event) => projectStatusMutation.mutate({ projectId: project.id, status: event.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {clientProjectStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const confirmed = window.confirm(`¿Seguro que quieres eliminar el proyecto "${project.title}"?`);
                    if (!confirmed) return;
                    deleteProjectMutation.mutate(project.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Aplicaciones recibidas: {project.applicationsCount}</p>
              </div>

              {project.applicationsCount === 0 ? (
                <p className="text-sm text-muted-foreground">Todavia no hay freelancers postulados a este proyecto.</p>
              ) : (
                <div className="space-y-3">
                  {project.applications.map((application) => (
                    <div key={application.id} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{application.freelancerDisplayName}</p>
                          <p className="text-xs text-muted-foreground">{application.freelancerEmail}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{application.freelancerBio || "Sin biografia registrada."}</p>
                          {application.proposedBudget !== null && (
                            <p className="mt-2 text-sm text-foreground">Propuesta economica: {formatCopCurrency(application.proposedBudget)}</p>
                          )}
                          <p className="mt-2 text-sm text-muted-foreground">{application.coverLetter || "Este freelancer no dejo mensaje adicional."}</p>
                        </div>
                        <Badge className={getStatusBadgeClass(application.status)}>{statusLabelMap[application.status] ?? application.status}</Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => applicationStatusMutation.mutate({ applicationId: application.id, status: "en_revision" })}>
                          Marcar en revision
                        </Button>
                        <Button size="sm" onClick={() => applicationStatusMutation.mutate({ applicationId: application.id, status: "aceptada" })}>
                          Aceptar y abrir chat
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => applicationStatusMutation.mutate({ applicationId: application.id, status: "rechazada" })}>
                          Rechazar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/messages?contact=${application.freelancerId}`)}>
                          Mensaje directo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {false && project.status === "finalizado" && !project.assignedFreelancer && (
              <>
                <Separator />
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">No se puede dejar reseña todavía</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Para calificar al freelancer, primero debes haber aceptado una postulación en este proyecto.
                  </p>
                </div>
              </>
            )}

            {false && project.status === "finalizado" && project.assignedFreelancer && (
              <>
                <Separator />
                <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Reseña del freelancer</p>
                    <p className="text-sm text-muted-foreground">
                      {project.review
                        ? `Ya calificaste a ${project.assignedFreelancer.displayName} en este proyecto.`
                        : `Califica a ${project.assignedFreelancer.displayName} para actualizar su perfil.`}
                    </p>
                  </div>

                  {project.review ? (
                    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-1 text-primary">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${index < project.review!.rating ? "fill-current" : ""}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.review.comment || "El cliente no dejó comentario adicional."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const selectedRating = index + 1;
                          const form = getReviewForm(project.id);
                          return (
                            <button
                              key={selectedRating}
                              type="button"
                              onClick={() =>
                                setReviewForms((current) => ({
                                  ...current,
                                  [project.id]: { ...form, rating: selectedRating },
                                }))
                              }
                              className="rounded-full border border-border bg-background p-2 text-primary transition hover:border-primary"
                            >
                              <Star className={`h-4 w-4 ${selectedRating <= form.rating ? "fill-current" : ""}`} />
                            </button>
                          );
                        })}
                      </div>
                      <Textarea
                        value={getReviewForm(project.id).comment}
                        onChange={(event) =>
                          setReviewForms((current) => ({
                            ...current,
                            [project.id]: { ...getReviewForm(project.id), comment: event.target.value },
                          }))
                        }
                        placeholder="Comparte una reseña corta sobre el trabajo, la comunicación o la calidad de entrega."
                        maxLength={500}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">Una reseña por proyecto finalizado.</p>
                        <Button
                          onClick={() =>
                            reviewMutation.mutate({
                              projectId: project.id,
                              rating: getReviewForm(project.id).rating,
                              comment: getReviewForm(project.id).comment.trim(),
                            })
                          }
                          disabled={reviewMutation.isPending}
                        >
                          Guardar reseña
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor={`cover-letter-${project.id}`}>Postularme</Label>
              <Button size="sm" variant={project.isFavorite ? "secondary" : "outline"} onClick={() => favoriteMutation.mutate(project.id)}>
                {project.isFavorite ? <HeartOff className="mr-2 h-4 w-4" /> : <Heart className="mr-2 h-4 w-4" />}
                {project.isFavorite ? "Quitar favorito" : "Guardar"}
              </Button>
            </div>
            <Input
              value={proposedBudgets[project.id] ?? ""}
              onChange={(event) =>
                setProposedBudgets((current) => ({
                  ...current,
                  [project.id]: event.target.value,
                }))
              }
              type="number"
              min="0"
              placeholder="Propuesta economica en COP"
              disabled={project.hasApplied}
            />
            <Textarea
              id={`cover-letter-${project.id}`}
              value={coverLetters[project.id] ?? ""}
              onChange={(event) =>
                setCoverLetters((current) => ({
                  ...current,
                  [project.id]: event.target.value,
                }))
              }
              placeholder="Cuentale al cliente por que encajas con este proyecto."
              disabled={project.hasApplied}
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={project.hasApplied || applyMutation.isPending} onClick={() => applyMutation.mutate({ projectId: project.id })}>
                <Send className="mr-2 h-4 w-4" />
                {project.hasApplied ? "Ya aplicaste" : "Aplicar"}
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/messages?contact=${project.clientId}`)}>
                Contactar cliente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-background pt-20">
      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top,_hsl(220_70%_45%_/_0.18),_transparent_38%),linear-gradient(180deg,hsl(210_20%_96%),hsl(210_20%_98%))] pb-16 pt-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <Badge className="rounded-full bg-secondary/15 px-4 py-1 text-secondary hover:bg-secondary/20">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Espacio de proyectos
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {isClient ? "Gestiona publicaciones, candidatos y conversaciones desde un solo panel." : "Explora oportunidades, guarda favoritas y sigue cada postulacion en tiempo real."}
              </h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                {isClient
                  ? "Publica, revisa perfiles, mueve proyectos entre estados y activa el chat cuando aceptes a alguien."
                  : "Filtra oportunidades, recibe recomendaciones segun tu perfil y organiza tu pipeline de aplicaciones."}
              </p>
            </div>

            <Card className="border-border/70 bg-background/90 shadow-lg">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">{projectsQuery.data?.summary.projectCount ?? 0}</p>
                  <p className="text-sm text-muted-foreground">{isClient ? "Proyectos creados" : "Proyectos visibles"}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{projectsQuery.data?.summary.openCount ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {isClient ? projectsQuery.data?.summary.applicationsCount ?? 0 : applicationsQuery.data?.summary.accepted ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{isClient ? "Aplicaciones recibidas" : "Aceptadas"}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{projectsQuery.data?.summary.inProgressCount ?? 0}</p>
                  <p className="text-sm text-muted-foreground">En ejecucion</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {isClient ? (
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="h-fit border-border/70 shadow-md">
              <CardHeader>
                <CardTitle>Publicar proyecto</CardTitle>
                <CardDescription>Agrega detalles suficientes para atraer mejores postulaciones.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePublish}>
                  <div className="space-y-2">
                    <Label htmlFor="project-title">Titulo</Label>
                    <Input id="project-title" value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Descripcion</Label>
                    <Textarea id="project-description" value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <select value={formState.category} onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        {categoryOptions.filter((option) => option.value !== "all").map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Presupuesto (COP)</Label>
                      <Input type="number" min="0" value={formState.budget} onChange={(event) => setFormState((current) => ({ ...current, budget: event.target.value }))} placeholder="1500000" required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Modalidad</Label>
                      <select value={formState.modality} onChange={(event) => setFormState((current) => ({ ...current, modality: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        {modalityOptions.filter((option) => option.value !== "all").map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha limite</Label>
                      <Input type="date" value={formState.deadline} onChange={(event) => setFormState((current) => ({ ...current, deadline: event.target.value }))} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tiempo estimado</Label>
                      <Input value={formState.timeline} onChange={(event) => setFormState((current) => ({ ...current, timeline: event.target.value }))} placeholder="4 semanas" />
                    </div>
                    <div className="space-y-2">
                      <Label>Ubicacion</Label>
                      <Input value={formState.location} onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))} placeholder="Bogota / Remoto" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Habilidades requeridas</Label>
                    <Input value={formState.skills} onChange={(event) => setFormState((current) => ({ ...current, skills: event.target.value }))} placeholder="React, Django, UX Writing" />
                  </div>
                  <div className="space-y-2">
                    <Label>Enlace de referencia</Label>
                    <Input value={formState.referenceUrl} onChange={(event) => setFormState((current) => ({ ...current, referenceUrl: event.target.value }))} placeholder="https://..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Publicando..." : "Publicar proyecto"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Tus proyectos</h2>
                <p className="text-sm text-muted-foreground">Gestiona estados, revisa postulantes y activa conversaciones cuando elijas talento.</p>
              </div>
              {visibleClientProjects.map(renderProjectCard)}
              {!projectsQuery.isLoading && visibleClientProjects.length === 0 && (
                <Card><CardContent className="p-6 text-sm text-muted-foreground">Aun no has publicado proyectos.</CardContent></Card>
              )}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid h-auto w-full grid-cols-3 rounded-2xl bg-muted/50 p-1">
              <TabsTrigger value="explore">Explorar</TabsTrigger>
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
              <TabsTrigger value="applications">Mis postulaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="explore" className="space-y-6">
              <Card className="border-border/70 shadow-md">
                <CardContent className="grid gap-4 p-5 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <Label>Buscar</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-9" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Frontend, copywriting, branding..." />
                    </div>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
                      {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Modalidad</Label>
                    <select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filters.modality} onChange={(event) => setFilters((current) => ({ ...current, modality: event.target.value }))}>
                      {modalityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Presupuesto max</Label>
                    <Input className="mt-2" type="number" value={filters.maxBudget} onChange={(event) => setFilters((current) => ({ ...current, maxBudget: event.target.value }))} placeholder="3000000" />
                  </div>
                </CardContent>
              </Card>
              {recommendedProjects.length > 0 && (
                <Card className="border-border/70 shadow-md">
                  <CardHeader>
                    <CardTitle>Recomendados para ti</CardTitle>
                    <CardDescription>Se priorizan coincidencias entre tu perfil y las habilidades pedidas.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    {recommendedProjects.map((project) => (
                      <div key={project.id} className="rounded-2xl border border-border bg-background p-4">
                        <p className="font-medium text-foreground">{project.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{project.enterpriseName || project.clientDisplayName}</p>
                        <p className="mt-3 text-sm text-foreground">{formatCopCurrency(project.budget)}</p>
                        <Button className="mt-4 w-full" variant="outline" onClick={() => handleOpenRecommendedProject(project.id)}>
                          Seguir viendo
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-5">
                {projects.map(renderProjectCard)}
                {!projectsQuery.isLoading && projects.length === 0 && (
                  <Card><CardContent className="p-6 text-sm text-muted-foreground">No encontramos proyectos con esos filtros.</CardContent></Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-5">
              {favoriteProjects.map(renderProjectCard)}
              {!projectsQuery.isLoading && favoriteProjects.length === 0 && (
                <Card><CardContent className="p-6 text-sm text-muted-foreground">Todavia no has guardado proyectos favoritos.</CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="applications" className="space-y-5">
              <Card className="border-border/70 shadow-md">
                <CardContent className="grid gap-4 p-6 sm:grid-cols-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-semibold text-foreground">{applicationsQuery.data?.summary.total ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-semibold text-foreground">{applicationsQuery.data?.summary.pending ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En revision</p>
                    <p className="text-2xl font-semibold text-foreground">{applicationsQuery.data?.summary.reviewing ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aceptadas</p>
                    <p className="text-2xl font-semibold text-foreground">{applicationsQuery.data?.summary.accepted ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rechazadas</p>
                    <p className="text-2xl font-semibold text-foreground">{applicationsQuery.data?.summary.rejected ?? 0}</p>
                  </div>
                </CardContent>
              </Card>

              {myApplications.map((application) => (
                <Card key={application.id} className="border-border/70 shadow-md">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold text-foreground">{application.project?.title}</p>
                        <p className="text-sm text-muted-foreground">{application.project?.enterpriseName || application.project?.clientDisplayName}</p>
                      </div>
                      <Badge className={getStatusBadgeClass(application.status)}>{statusLabelMap[application.status] ?? application.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{application.coverLetter || "Sin mensaje adicional."}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {application.proposedBudget !== null && <span>Tu propuesta: {formatCopCurrency(application.proposedBudget)}</span>}
                      {application.project?.budget && <span>Presupuesto cliente: {formatCopCurrency(application.project.budget)}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {application.status !== "retirada" && application.status !== "aceptada" && (
                        <Button variant="outline" onClick={() => applicationStatusMutation.mutate({ applicationId: application.id, status: "retirada" })}>
                          Retirar postulacion
                        </Button>
                      )}
                      {application.status === "aceptada" && (
                        <Button onClick={() => navigate(`/messages?contact=${application.project?.clientId}`)}>Abrir conversacion</Button>
                      )}
                      <Button variant="ghost" onClick={() => navigate(`/messages?contact=${application.project?.clientId}`)}>Escribir al cliente</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!applicationsQuery.isLoading && myApplications.length === 0 && (
                <Card><CardContent className="p-6 text-sm text-muted-foreground">Aun no has enviado postulaciones.</CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </section>

      <Dialog open={Boolean(reviewProject)} onOpenChange={(isOpen) => !isOpen && setReviewProject(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Califica al freelancer</DialogTitle>
            <DialogDescription>
              {reviewProject?.assignedFreelancer
                ? `Deja una reseña para ${reviewProject.assignedFreelancer.displayName}. Al guardarla, este proyecto se archivará y saldrá de Mis proyectos.`
                : "Deja una reseña del trabajo realizado."}
            </DialogDescription>
          </DialogHeader>

          {reviewProject && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="font-medium text-foreground">{reviewProject.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Freelancer: {reviewProject.assignedFreelancer?.displayName}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const selectedRating = index + 1;
                  const form = getReviewForm(reviewProject.id);
                  return (
                    <button
                      key={selectedRating}
                      type="button"
                      onClick={() =>
                        setReviewForms((current) => ({
                          ...current,
                          [reviewProject.id]: { ...form, rating: selectedRating },
                        }))
                      }
                      className="rounded-full border border-border bg-background p-3 text-primary transition hover:border-primary"
                    >
                      <Star className={`h-5 w-5 ${selectedRating <= form.rating ? "fill-current" : ""}`} />
                    </button>
                  );
                })}
              </div>

              <Textarea
                value={getReviewForm(reviewProject.id).comment}
                onChange={(event) =>
                  setReviewForms((current) => ({
                    ...current,
                    [reviewProject.id]: { ...getReviewForm(reviewProject.id), comment: event.target.value },
                  }))
                }
                placeholder="Cuéntanos cómo fue la comunicación, la calidad del trabajo y si volverías a contratarlo."
                maxLength={500}
                rows={5}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewProject(null)}>
              Después
            </Button>
            <Button
              onClick={() =>
                reviewProject &&
                reviewMutation.mutate({
                  projectId: reviewProject.id,
                  rating: getReviewForm(reviewProject.id).rating,
                  comment: getReviewForm(reviewProject.id).comment.trim(),
                })
              }
              disabled={reviewMutation.isPending || !reviewProject}
            >
              Guardar reseña y archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
