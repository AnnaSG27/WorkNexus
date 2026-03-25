import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, CheckCircle2, ClipboardList, FolderKanban, PlayCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/components/professionals-session";
import { toast } from "@/hooks/use-toast";
import { fetchOrders, updateOrder, type Order } from "@/lib/orders";

const statusOptions = [
  { value: "sin_iniciar", label: "Sin iniciar" },
  { value: "en_proceso", label: "En proceso" },
  { value: "terminado", label: "Terminado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

const statusLabelMap = Object.fromEntries(statusOptions.map((item) => [item.value, item.label]));

const getStatusBadgeClass = (status: string) => {
  if (status === "terminado") return "bg-secondary text-secondary-foreground";
  if (status === "cancelado") return "bg-destructive text-destructive-foreground";
  if (status === "en_proceso") return "bg-accent text-accent-foreground";
  return "bg-primary text-primary-foreground";
};

const Orders = () => {
  const user = getStoredUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFreelancer = user?.userType === "freelancer";
  const pageTitle = isFreelancer ? "Mis trabajos" : "Mis proyectos";
  const pageDescription = isFreelancer
    ? "Aqui encuentras los trabajos que te han contratado desde servicios o proyectos."
    : "Aqui encuentras las contrataciones que hiciste desde servicios o al aceptar postulaciones.";

  const ordersQuery = useQuery({
    queryKey: ["orders", user?.id, user?.userType],
    queryFn: () => fetchOrders(user?.id ?? "", user?.userType),
    enabled: Boolean(user?.id),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: Order["status"] }) =>
      updateOrder(orderId, { userId: user?.id ?? "", status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
      toast({ title: "Estado actualizado", description: "La contratacion se actualizo correctamente." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo actualizar", description: error.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 pb-20 pt-28">
        <Card className="mx-auto max-w-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>Debes iniciar sesion para ver tus contrataciones</CardTitle>
            <CardDescription>Esta seccion organiza tus servicios contratados y trabajos activos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")}>Iniciar sesion</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = ordersQuery.data?.summary;
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <div className="bg-background pt-20">
      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_hsl(220_70%_45%_/_0.15),_transparent_35%),linear-gradient(180deg,hsl(210_20%_97%),hsl(210_20%_99%))] pb-16 pt-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <Badge className="rounded-full bg-secondary/15 px-4 py-1 text-secondary hover:bg-secondary/20">
                <FolderKanban className="mr-2 h-3.5 w-3.5" />
                {pageTitle}
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">{pageTitle}</h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{pageDescription}</p>
            </div>

            <Card className="border-border/70 bg-background/90 shadow-lg">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">{summary?.total ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{summary?.pending ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Sin iniciar</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{summary?.inProgress ?? 0}</p>
                  <p className="text-sm text-muted-foreground">En proceso</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{summary?.completed ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Terminados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="space-y-5">
          {orders.map((order) => (
            <Card key={order.id} className="border-border/70 shadow-md">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{order.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {isFreelancer ? `Cliente: ${order.client.enterpriseName || order.client.displayName}` : `Freelancer: ${order.freelancer.displayName}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{order.sourceType === "service" ? "Servicio" : "Proyecto"}</Badge>
                    <Badge className={getStatusBadgeClass(order.status)}>{statusLabelMap[order.status] ?? order.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{order.description || "Sin descripcion adicional."}</p>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {order.service && <span>Servicio: {order.service.title}</span>}
                  {order.project && <span>Proyecto: {order.project.title}</span>}
                  {order.agreedBudget !== null && <span>Presupuesto acordado: ${order.agreedBudget}</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate(`/messages?contact=${isFreelancer ? order.client.id : order.freelancer.id}`)}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Abrir chat
                  </Button>
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={order.status === option.value ? "default" : "outline"}
                      disabled={updateOrderMutation.isPending}
                      onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: option.value })}
                    >
                      {option.value === "sin_iniciar" && <ClipboardList className="mr-2 h-4 w-4" />}
                      {option.value === "en_proceso" && <PlayCircle className="mr-2 h-4 w-4" />}
                      {option.value === "terminado" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {option.value === "cancelado" && <XCircle className="mr-2 h-4 w-4" />}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {!ordersQuery.isLoading && orders.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                {isFreelancer ? "Todavia no tienes trabajos contratados." : "Todavia no has contratado servicios ni iniciado proyectos contratados."}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default Orders;
