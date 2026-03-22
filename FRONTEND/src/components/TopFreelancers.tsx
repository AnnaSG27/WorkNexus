import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

import FreelancerCard from "./FreelancerCard";
import { fallbackFreelancers, mergeFreelancers, PROFESSIONALS_API_URL, type FreelancersResponse } from "./professionalFreelancers";
import { canUseClientFeatures, getStoredUser } from "./professionals-session";
import { useProfessionalFavorites } from "./useProfessionalFavorites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const TopFreelancers = () => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [selectedProfileFreelancerId, setSelectedProfileFreelancerId] = useState<string | number | null>(null);
  const [selectedChatFreelancerId, setSelectedChatFreelancerId] = useState<string | number | null>(null);

  const user = getStoredUser();
  const canSaveFavorites = canUseClientFeatures(user);
  const { savedFreelancerIds, toggleFavorite } = useProfessionalFavorites(user, canSaveFavorites);

  const { data, isLoading } = useQuery({
    queryKey: ["freelancers"],
    queryFn: async (): Promise<FreelancersResponse> => {
      const response = await fetch(PROFESSIONALS_API_URL);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los profesionales");
      }

      return response.json();
    },
    retry: 1,
  });

  const freelancers = mergeFreelancers(data?.freelancers ?? []);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(freelancers.map((freelancer) => freelancer.category || "General")))],
    [freelancers],
  );

  const shortlist = freelancers.filter((freelancer) => freelancer.id && savedFreelancerIds.includes(freelancer.id));
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const matchesCategory = selectedCategory === "Todas" || freelancer.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!normalizedSearch) return true;

    const searchableContent = [
      freelancer.name,
      freelancer.title,
      freelancer.location,
      freelancer.category,
      freelancer.bio,
      freelancer.experience,
      freelancer.availability,
      freelancer.featuredLabel,
      ...freelancer.skills,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(normalizedSearch);
  });

  const visibleFreelancers = showAll ? filteredFreelancers : filteredFreelancers.slice(0, 4);
  const hasMoreThanPreview = filteredFreelancers.length > 4;

  const handleRequireClientLogin = () => {
    setIsLoginPromptOpen(true);
  };

  const handleToggleSave = (id: string | number | undefined) => {
    if (id === undefined) return;

    if (!canSaveFavorites) {
      handleRequireClientLogin();
      return;
    }

    const savedNow = toggleFavorite(id);
    const selectedFreelancer = freelancers.find((freelancer) => freelancer.id === id);

    toast({
      title: savedNow ? "Perfil guardado" : "Perfil quitado",
      description: selectedFreelancer
        ? `${selectedFreelancer.name} fue ${savedNow ? "agregado" : "removido"} de tus favoritos.`
        : `El perfil fue ${savedNow ? "agregado" : "removido"} de tus favoritos.`,
    });
  };

  return (
    <>
      <section id="freelancers" className="bg-gradient-to-b from-background via-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="inline-flex rounded-full border border-border bg-muted/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary shadow-sm"
              >
                Profesionales destacados
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-4 font-display text-3xl font-bold leading-tight text-foreground md:text-5xl"
              >
                Conoce a nuestros expertos
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.16 }}
                className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground"
              >
                Explora perfiles confiables, guarda tus favoritos y encuentra al profesional ideal para avanzar tu proyecto con claridad.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-1 md:mt-0"
            >
              <Button
                variant="outline"
                className="group rounded-full border-border bg-background px-5 shadow-sm"
                onClick={() => setShowAll((current) => !current)}
                disabled={!hasMoreThanPreview}
              >
                {hasMoreThanPreview ? (showAll ? "Ver menos" : "Ver todos") : "Sin mas resultados"}
                <ArrowRight
                  className={`ml-2 h-4 w-4 transition-transform ${showAll ? "rotate-90" : "group-hover:translate-x-1"}`}
                />
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mb-8 rounded-[28px] border border-border bg-card/95 p-4 shadow-sm backdrop-blur md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setShowAll(false);
                  }}
                  placeholder="Busca por diseno, marketing, frontend, soporte, seguridad, datos..."
                  className="h-12 rounded-2xl border-border bg-card pl-11 pr-4 shadow-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className="border-transparent bg-primary text-primary-foreground hover:bg-primary">
                  {filteredFreelancers.length} resultados
                </Badge>
                {shortlist.length > 0 && (
                  <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
                    {shortlist.length} en favoritos
                  </Badge>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Encuentra profesionales por habilidades, rol, ubicacion o necesidades especificas de tu proyecto.
            </p>
            {!canSaveFavorites && (
              <p className="mt-2 text-sm text-muted-foreground">
                Solo los clientes con sesion iniciada pueden guardar perfiles en favoritos y usar el chat.
              </p>
            )}
          </motion.div>

          <div className="mb-8 rounded-[28px] border border-border bg-card/90 p-4 shadow-sm backdrop-blur md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Categorias
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Filtra rapidamente por el tipo de profesional que necesitas para tu proyecto.
                </p>
              </div>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
                {categories.length - 1} categorias disponibles
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const isActive = selectedCategory === category;

                return (
                  <Button
                    key={category}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    className={`rounded-full px-4 py-2 shadow-sm transition-all ${
                      isActive
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-background/90 text-foreground hover:border-primary/30 hover:bg-accent"
                    }`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowAll(false);
                    }}
                  >
                    {category}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(isLoading ? fallbackFreelancers.slice(0, 4) : visibleFreelancers).map((freelancer, index) => (
              <FreelancerCard
                key={freelancer.id ?? `${freelancer.name}-${index}`}
                {...freelancer}
                index={index}
                isSaved={freelancer.id !== undefined && savedFreelancerIds.includes(freelancer.id)}
                onToggleSave={handleToggleSave}
                canUseChat={canSaveFavorites}
                onRequireClientLogin={handleRequireClientLogin}
                isProfileDialogOpen={freelancer.id !== undefined && selectedProfileFreelancerId === freelancer.id}
                onProfileDialogOpenChange={(isOpen) => {
                  if (isOpen) {
                    setSelectedProfileFreelancerId(freelancer.id ?? null);
                    return;
                  }

                  setSelectedProfileFreelancerId((current) => (current === freelancer.id ? null : current));
                }}
                isChatDialogOpen={freelancer.id !== undefined && selectedChatFreelancerId === freelancer.id}
                onChatDialogOpenChange={(isOpen) => {
                  if (isOpen) {
                    setSelectedChatFreelancerId(freelancer.id ?? null);
                    return;
                  }

                  setSelectedChatFreelancerId((current) => (current === freelancer.id ? null : current));
                }}
              />
            ))}
          </div>

          {!isLoading && filteredFreelancers.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <h3 className="text-lg font-semibold text-foreground">No encontramos perfiles con esa busqueda</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Prueba con otras palabras clave o cambia la categoria para ampliar los resultados.
              </p>
            </div>
          )}
        </div>
      </section>

      <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
        <DialogContent className="max-w-md rounded-[28px] border border-border bg-background p-0 shadow-2xl">
          <div className="overflow-hidden rounded-[28px]">
            <div className="bg-gradient-to-r from-primary/15 via-secondary/10 to-background px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl text-foreground">Inicia sesion como cliente</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                  Para guardar profesionales en favoritos y escribir por chat necesitas entrar con una cuenta de cliente.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-5">
              <DialogFooter className="gap-3 sm:justify-start">
                <Button
                  type="button"
                  className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    setIsLoginPromptOpen(false);
                    navigate("/login");
                  }}
                >
                  Ir a iniciar sesion
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsLoginPromptOpen(false)}
                >
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

export default TopFreelancers;
