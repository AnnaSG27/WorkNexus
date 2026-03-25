import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Briefcase, FolderKanban, Search, Sparkles } from "lucide-react";

import CategorySection from "@/components/CategorySection";
import FeaturedServices from "@/components/FeaturedServices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoredUser } from "@/components/professionals-session";
import { toast } from "@/hooks/use-toast";
import { createServiceOrder } from "@/lib/orders";
import { fetchServices } from "@/lib/services";

const categoryOptions = [
  { value: "all", label: "Todas las categorias" },
  { value: "desarrollo", label: "Desarrollo" },
  { value: "diseno", label: "Diseno" },
  { value: "marketing", label: "Marketing" },
];

const Services = () => {
  const user = getStoredUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const servicesQuery = useQuery({
    queryKey: ["services", category],
    queryFn: () => fetchServices(category === "all" ? undefined : category),
  });

  const createOrderMutation = useMutation({
    mutationFn: ({ serviceId, title }: { serviceId: number; title: string }) =>
      createServiceOrder({
        clientId: user?.id ?? "",
        serviceId,
        title,
        description: `Contratacion iniciada desde la seccion de servicios para "${title}".`,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Servicio contratado", description: "Lo encuentras ahora en Mis proyectos." });
      navigate("/orders");
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo contratar", description: error.message, variant: "destructive" });
    },
  });

  const filteredServices = useMemo(() => {
    const items = servicesQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((service) =>
      `${service.title} ${service.description} ${service.freelancer_name} ${service.category}`.toLowerCase().includes(query),
    );
  }, [search, servicesQuery.data]);

  const roleLabel = user?.userType === "freelancer" ? "Mis trabajos" : "Mis proyectos";

  return (
    <div className="bg-background pt-20">
      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top,_hsl(185_65%_45%_/_0.18),_transparent_35%),linear-gradient(180deg,hsl(45_45%_96%),hsl(0_0%_100%))] pb-16 pt-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <Badge className="rounded-full bg-secondary/15 px-4 py-1 text-secondary hover:bg-secondary/20">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Contratacion de servicios
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Encuentra un servicio y contratalo de forma clara desde la misma plataforma.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                Cada boton de contratar crea una contratacion real. Luego la ves en {roleLabel} para hacer seguimiento al estado del trabajo.
              </p>
              {user && (
                <div className="mt-6">
                  <Button onClick={() => navigate("/orders")}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    Ir a {roleLabel}
                  </Button>
                </div>
              )}
            </div>

            <Card className="border-border/70 bg-background/90 shadow-lg">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-3xl font-bold text-foreground">{servicesQuery.data?.length ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Servicios disponibles</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{categoryOptions.filter((item) => item.value !== "all").length}</p>
                  <p className="text-sm text-muted-foreground">Categorias activas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <Card className="border-border/70 shadow-md">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <label className="text-sm font-medium text-foreground">Buscar servicio</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Desarrollo web, marketing, branding..." />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map((service) => {
            const isOwnService = Number(user?.id) === service.freelancer_id;
            const canHire = user?.userType === "cliente" && !isOwnService;

            return (
              <Card key={service.id} className="border-border/70 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">{service.freelancer_name}</p>
                    </div>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">{service.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => navigate(`/messages?contact=${service.freelancer_id}`)}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Hablar con freelancer
                    </Button>
                    <Button
                      disabled={!canHire || createOrderMutation.isPending}
                      onClick={() => createOrderMutation.mutate({ serviceId: service.id, title: service.title })}
                    >
                      Contratar servicio
                    </Button>
                  </div>
                  {!user && <p className="text-xs text-muted-foreground">Inicia sesion como cliente para contratar este servicio.</p>}
                  {user?.userType === "freelancer" && <p className="text-xs text-muted-foreground">Los freelancers no pueden contratar servicios desde esta cuenta.</p>}
                  {isOwnService && <p className="text-xs text-muted-foreground">No puedes contratar tu propio servicio.</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!servicesQuery.isLoading && filteredServices.length === 0 && (
          <Card className="mt-8">
            <CardContent className="p-6 text-sm text-muted-foreground">No encontramos servicios con esos filtros.</CardContent>
          </Card>
        )}
      </section>

      <section className="border-t border-border/60 bg-muted/20 py-6">
        <div className="container mx-auto px-4">
          <Badge variant="outline">Exploracion visual</Badge>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Conservamos tambien la vitrina visual con servicios de muestra para seguir mostrando la experiencia de descubrimiento.
          </p>
        </div>
      </section>

      <CategorySection />
      <FeaturedServices />
    </div>
  );
};

export default Services;
