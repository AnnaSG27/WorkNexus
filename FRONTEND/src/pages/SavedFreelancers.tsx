import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, SearchX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import FreelancerCard from "@/components/FreelancerCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { mergeFreelancers, PROFESSIONALS_API_URL, type FreelancersResponse } from "@/components/professionalFreelancers";
import { canUseClientFeatures, getStoredUser } from "@/components/professionals-session";
import { useProfessionalFavorites } from "@/components/useProfessionalFavorites";

const SavedFreelancers = () => {
  const navigate = useNavigate();
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
    enabled: canSaveFavorites,
  });

  const savedFreelancers = mergeFreelancers(data?.freelancers ?? []).filter(
    (freelancer) => freelancer.id && savedFreelancerIds.includes(freelancer.id),
  );

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
    const selectedFreelancer = savedFreelancers.find((freelancer) => freelancer.id === id);

    toast({
      title: savedNow ? "Perfil guardado" : "Perfil quitado",
      description: selectedFreelancer
        ? `${selectedFreelancer.name} fue ${savedNow ? "agregado" : "removido"} de tus favoritos.`
        : `El perfil fue ${savedNow ? "agregado" : "removido"} de tus favoritos.`,
    });
  };

  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 via-background to-background pb-16 pt-28">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary shadow-sm">
            Tu seleccion
          </span>
          <h1 className="mb-4 mt-4 font-display text-4xl font-bold text-foreground md:text-5xl">
            Perfiles Guardados
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Revisa los profesionales que te interesaron, compara opciones con calma y retoma el contacto cuando quieras.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-b from-background via-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-border bg-card/95 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                <Heart className="h-4 w-4 fill-current text-primary" />
                Biblioteca de favoritos
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Aqui se almacenan los perfiles a los que les diste me gusta desde la seccion de profesionales.
              </p>
            </div>
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
              {savedFreelancerIds.length} guardados
            </Badge>
          </div>

          {!canSaveFavorites ? (
            <div className="rounded-[28px] border border-border bg-card/95 px-6 py-12 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground">Inicia sesion como cliente</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Los perfiles guardados estan disponibles para cuentas de cliente. Entra con tu sesion para ver y administrar tu seleccion.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/login")}>
                  Ir a iniciar sesion
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/freelancers")}>
                  Ver profesionales
                </Button>
              </div>
            </div>
          ) : !isLoading && savedFreelancers.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
              <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-semibold text-foreground">Aun no has guardado perfiles</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Explora la lista de profesionales y usa el corazon para ir armando tu coleccion de candidatos.
              </p>
              <Button asChild className="mt-6 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                <Link to="/freelancers">Explorar profesionales</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {savedFreelancers.map((freelancer, index) => (
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

export default SavedFreelancers;
