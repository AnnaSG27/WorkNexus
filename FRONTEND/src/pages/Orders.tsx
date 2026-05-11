import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, CheckCircle2, ClipboardList, FolderKanban, PlayCircle, Sparkles, Star, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getStoredUser } from "@/components/professionals-session";
import { toast } from "@/hooks/use-toast";
import { fetchOrders, updateOrder, type Order } from "@/lib/orders";
import { createReview } from "@/lib/reviews";
import { formatCopCurrency } from "@/lib/utils";

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
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: "" });
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
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
      if (
        !isFreelancer &&
        variables.status === "terminado" &&
        data.order.sourceType === "project" &&
        data.order.project &&
        !data.order.projectReview
      ) {
        setReviewOrder(data.order);
        setReviewDraft({ rating: 5, comment: "" });
        toast({ title: "Proyecto terminado", description: "Ahora puedes calificar al freelancer." });
        return;
      }
      toast({ title: "Estado actualizado", description: "La contratacion se actualizo correctamente." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo actualizar", description: error.message, variant: "destructive" });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: () =>
      createReview({
        clientId: user?.id ?? "",
        projectId: reviewOrder?.project?.id ?? 0,
        rating: reviewDraft.rating,
        comment: reviewDraft.comment.trim(),
      }),
    onSuccess: async () => {
      setReviewOrder(null);
      setReviewDraft({ rating: 5, comment: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["freelancers"] }),
        queryClient.invalidateQueries({ queryKey: ["profile", "reviews"] }),
      ]);
      toast({ title: "Reseña guardada", description: "La calificación quedó vinculada al perfil del freelancer." });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo guardar la reseña", description: error.message, variant: "destructive" });
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

  const handlePay = (orderId: number) => {
    navigate(`/checkout/${orderId}`);
  };

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
                  {order.agreedBudget !== null && <span>Presupuesto acordado: {formatCopCurrency(order.agreedBudget)}</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate(`/messages?contact=${isFreelancer ? order.client.id : order.freelancer.id}`)}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Abrir chat
                  </Button>
                  {(() => {
                    // =========================
                    // CLIENTE
                    // =========================
                    if (!isFreelancer) {
                      if (order.status === "sin_iniciar") {
                        return (
                          <>
                            <Button
                              onClick={() => handlePay(order.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              💳 Pagar
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateOrderMutation.mutate({
                                  orderId: order.id,
                                  status: "cancelado",
                                })
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </>
                        );
                      }

                      if (order.status === "en_proceso") {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="border-blue-500 text-blue-600 bg-blue-50 cursor-not-allowed"
                          >
                            <PlayCircle className="mr-2 h-4 w-4 text-blue-600" />
                            En Proceso
                          </Button>
                        );
                      }

                      if (order.status === "terminado") {
                        return (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="border-green-500 text-green-600 bg-green-50 cursor-not-allowed"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Terminado
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setReviewOrder(order);
                                setReviewDraft({ rating: 5, comment: "" })
                              }}
                            >
                              ✍️ Escribir reseña
                            </Button>
                          </>
                        );
                      }

                      // en_proceso o cancelado → nada
                      return null;
                    }

                    // =========================
                    // FREELANCER
                    // =========================
                    if (isFreelancer) {
                      if (order.status === "sin_iniciar") {
                        return (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              En aprobación
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateOrderMutation.mutate({
                                  orderId: order.id,
                                  status: "cancelado",
                                })
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </>
                        );
                      }

                      if (order.status === "en_proceso") {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateOrderMutation.mutate({
                                orderId: order.id,
                                status: "terminado",
                              })
                            }
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Terminar
                          </Button>
                        );
                      }

                      if (order.status === "terminado") {
                        return (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="border-green-500 text-green-600 bg-green-50 cursor-not-allowed"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Terminado
                            </Button>
                            {order.payment?.status === "released" && (
                              <div className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                                💰 Pago liberado
                              </div>
                            )}
                          </>
                        );
                      }


                      // terminado o cancelado → nada
                      return null;
                    }

                    return null;
                  })()}
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

      <Dialog open={Boolean(reviewOrder)} onOpenChange={(isOpen) => !isOpen && setReviewOrder(null)}>
        <DialogContent className="overflow-hidden border-border/70 p-0 shadow-2xl sm:max-w-2xl">
          <DialogHeader className="border-b border-border/70 bg-[radial-gradient(circle_at_top_left,_hsl(220_70%_45%_/_0.14),_transparent_32%),linear-gradient(180deg,hsl(210_20%_98%),hsl(210_20%_100%))] px-6 py-5 text-left md:px-7">
            <div className="inline-flex w-fit items-center rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Reseña final del proyecto
            </div>
            <DialogTitle className="pt-2 text-2xl text-foreground">Califica al freelancer</DialogTitle>
            <DialogDescription>
              {reviewOrder
                ? `Tu proyecto "${reviewOrder.title}" quedó terminado. Deja una reseña para ${reviewOrder.freelancer.displayName}.`
                : "Deja una reseña del freelancer."}
            </DialogDescription>
          </DialogHeader>

          {/* ✅ Contenedor del body del dialog */}
          <div className="space-y-6 px-6 py-6 md:px-7">

            {/* Tarjeta: info del proyecto y freelancer */}
            <div className="grid gap-4 rounded-[24px] border border-border/70 bg-background/90 p-5 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Proyecto</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{reviewOrder?.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {reviewOrder?.description || "Cierre del proyecto con valoración final del trabajo entregado."}
                </p>
              </div>
              <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Freelancer</p>
                <p className="mt-2 text-base font-semibold text-foreground">{reviewOrder?.freelancer.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">@{reviewOrder?.freelancer.username}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">{reviewOrder?.sourceType === "project" ? "Proyecto contratado" : "Servicio"}</Badge>
                  {reviewOrder?.project && <Badge className="bg-secondary text-secondary-foreground">Terminado</Badge>}
                </div>
              </div>
            </div>

            {/* Tarjeta: selector de estrellas */}
            <div className="rounded-[24px] border border-border/70 bg-background p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Calificación general</p>
                  <p className="text-sm text-muted-foreground">Selecciona de 1 a 5 estrellas según tu experiencia.</p>
                </div>
                <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  <Star className="mr-2 h-4 w-4 fill-primary text-primary" />
                  {reviewDraft.rating}.0 / 5
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {Array.from({ length: 5 }).map((_, index) => {
                  const selectedRating = index + 1;
                  const isActive = selectedRating <= reviewDraft.rating;
                  return (
                    <button
                      key={selectedRating}
                      type="button"
                      onClick={() => setReviewDraft((current) => ({ ...current, rating: selectedRating }))}
                      className={`rounded-2xl border px-4 py-3 transition-all ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <span className={isActive ? "opacity-100" : "opacity-40"}>★</span>
                    </button>
                  );
                })}
              </div>
            </div> {/* ✅ Cierra la tarjeta de estrellas */}

            {/* Textarea fuera de la tarjeta de estrellas */}
            <Textarea
              value={reviewDraft.comment}
              onChange={(event) => setReviewDraft((current) => ({ ...current, comment: event.target.value }))}
              placeholder="Escribe una reseña corta sobre la calidad del trabajo, la comunicación y la entrega."
              maxLength={500}
              rows={5}
              className="mt-5 resize-none border-border/70 bg-muted/20 focus-visible:ring-primary"
            />

          </div> {/* ✅ Cierra el space-y-6 */}

          {/* DialogFooter directamente en DialogContent, fuera del div con padding */}
          <DialogFooter className="border-t border-border/70 bg-background/90 px-6 py-5 md:px-7">
            <Button variant="outline" className="rounded-full" onClick={() => setReviewOrder(null)}>
              Después
            </Button>
            <Button
              className="rounded-full px-6"
              onClick={() => createReviewMutation.mutate()}
              disabled={createReviewMutation.isPending || !reviewOrder?.project}
            >
              Guardar reseña
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
