import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/components/professionals-session";
import { fetchMyApplications, fetchProjects } from "@/lib/projects";
import { fetchFreelancerReviews } from "@/lib/reviews";
import { API_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiClient";
import { formatCopCurrency, formatCopInput, parseCopInput } from "@/lib/utils";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

type WalletTopUpFormProps = {
  clientSecret: string;
  onCompleted: (walletBalance: string) => void;
  onCancel: () => Promise<void>;
};

const WalletTopUpForm = ({ clientSecret, onCompleted, onCancel }: WalletTopUpFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const confirmTopUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "No se pudo confirmar la recarga");
      }

      if (!result.paymentIntent) {
        throw new Error("Stripe no retorno la confirmacion del pago");
      }

      const response = await apiFetch(`${API_URL}/payments/wallet/topups/complete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payment_intent_id: result.paymentIntent.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar la billetera");
      }

      if (!data.completed) {
        throw new Error(data.message || "La recarga todavia no ha sido completada por Stripe");
      }

      onCompleted(data.wallet_balance);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo confirmar la recarga";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={confirmTopUp} className="space-y-3">
      <PaymentElement className="rounded border p-3" />
      <div className="grid grid-cols-2 gap-3">
        <Button type="submit" disabled={submitting || !stripe}>
          {submitting ? "Confirmando..." : "Confirmar recarga"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
};

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [topUpAmount, setTopUpAmount] = useState("50000");
  const [topUpId, setTopUpId] = useState<number | null>(null);
  const [topUpClientSecret, setTopUpClientSecret] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState("");
  const [bankForm, setBankForm] = useState({ bankName: "", bankAccountNumber: "" });
  const [isEditingBankData, setIsEditingBankData] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMessage, setBankMessage] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) return;
    setUser(storedUser);
    setFormData(storedUser);
    setBankForm({
      bankName: storedUser.bankName || "",
      bankAccountNumber: storedUser.bankAccountNumber || "",
    });
  }, []);

  const historyQuery = useQuery({
    queryKey: ["profile", "history", user?.id, user?.userType],
    queryFn: async () => {
      if (!user?.id) return null;
      if (user.userType === "cliente") return fetchProjects({ clientId: user.id });
      if (user.userType === "freelancer") return fetchMyApplications(user.id);
      return null;
    },
    enabled: Boolean(user?.id && user?.userType),
  });

  const reviewsQuery = useQuery({
    queryKey: ["profile", "reviews", user?.id],
    queryFn: () => fetchFreelancerReviews(user?.id ?? ""),
    enabled: Boolean(user?.id && user?.userType === "freelancer"),
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const syncStoredUser = (updatedUser: any) => {
    setUser(updatedUser);
    setFormData(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleSave = async () => {
    try {
      const response = await apiFetch(`${API_URL}/auth/editProfile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        syncStoredUser(data.user);
        setIsEditing(false);
        alert("Perfil actualizado correctamente");
      } else {
        alert(data.error || "Error al actualizar perfil");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexion con el servidor");
    }
  };

  const startWalletTopUp = async () => {
    if (!user?.id) return;

    setTopUpLoading(true);
    setTopUpError("");
    setTopUpClientSecret("");
    setTopUpId(null);

    try {
      const response = await apiFetch(`${API_URL}/payments/wallet/topups/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id, amount: topUpAmount }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la recarga");
      }

      setTopUpId(data.topup_id);
      setTopUpClientSecret(data.client_secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la recarga";
      setTopUpError(message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const cancelWalletTopUp = async () => {
    if (!topUpId) return;

    try {
      await apiFetch(`${API_URL}/payments/wallet/topups/cancel/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topup_id: topUpId }),
      });
    } finally {
      setTopUpId(null);
      setTopUpClientSecret("");
      setTopUpError("");
    }
  };

  const completeWalletTopUp = (walletBalance: string) => {
    const updatedUser = { ...user, walletBalance };
    syncStoredUser(updatedUser);
    setTopUpId(null);
    setTopUpClientSecret("");
    setTopUpAmount("50000");
    setTopUpError("");
  };

  const saveBankData = async () => {
    if (!user?.id) return;

    setBankSaving(true);
    setBankMessage("");

    try {
      const payload = {
        ...user,
        ...bankForm,
      };
      const response = await apiFetch(`${API_URL}/auth/editProfile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron guardar los datos bancarios");
      }

      syncStoredUser(data.user);
      setBankForm({
        bankName: data.user.bankName || "",
        bankAccountNumber: data.user.bankAccountNumber || "",
      });
      setBankMessage("Datos bancarios guardados");
      setIsEditingBankData(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron guardar los datos bancarios";
      setBankMessage(message);
    } finally {
      setBankSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p>No hay usuario logueado</p>
      </div>
    );
  }

  const clientSummary = historyQuery.data?.summary;
  const freelancerSummary = historyQuery.data?.summary;
  const reviewsSummary = reviewsQuery.data?.summary;
  const reviews = reviewsQuery.data?.reviews ?? [];

  return (
    <div className="p-6 pt-24">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="shadow-lg">
          <CardContent className="flex items-center gap-6 p-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{user.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-2">
                <Badge>{user.userType === "cliente" ? "Cliente" : "Freelancer"}</Badge>
              </div>
            </div>

            <div className="ml-auto">
              {isEditing ? (
                <Button onClick={handleSave}>Guardar</Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informacion general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Usuario:</strong>{" "}
                {isEditing ? <input className="rounded border p-1" value={formData.username} onChange={(e) => handleChange("username", e.target.value)} /> : user.username}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {isEditing ? <input className="rounded border p-1" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} /> : user.email}
              </p>
            </CardContent>
          </Card>

          {user.userType === "cliente" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Informacion de empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Empresa:</strong>{" "}
                    {isEditing ? (
                      <input className="rounded border p-1" value={formData.enterpriseName || ""} onChange={(e) => handleChange("enterpriseName", e.target.value)} />
                    ) : (
                      user.enterpriseName || "No especificado"
                    )}
                  </p>
                  <p><strong>Proyectos publicados:</strong> {clientSummary?.projectCount ?? 0}</p>
                  <p><strong>Activos:</strong> {clientSummary?.openCount ?? 0}</p>
                  <p><strong>En ejecucion:</strong> {clientSummary?.inProgressCount ?? 0}</p>
                  <p><strong>Finalizados:</strong> {clientSummary?.completedCount ?? 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billetera</CardTitle>
                  <CardDescription>Saldo disponible para pagar ordenes dentro de WorkNexus.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Saldo actual</p>
                    <p className="text-2xl font-bold">
                      {formatCopCurrency(user.walletBalance)}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">Datos bancarios</p>
                        <p className="text-sm text-muted-foreground">Información usada para habilitar recargas con Stripe.</p>
                      </div>
                      {!isEditingBankData && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBankForm({
                              bankName: user.bankName || "",
                              bankAccountNumber: user.bankAccountNumber || "",
                            });
                            setBankMessage("");
                            setIsEditingBankData(true);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                    </div>

                    {!isEditingBankData ? (
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Banco:</strong> {user.bankName || "No registrado"}
                        </p>
                        <p>
                          <strong>Cuenta bancaria:</strong> {user.bankAccountNumber || "No registrada"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium">Banco</label>
                          <input
                            className="mt-1 w-full rounded border p-2"
                            value={bankForm.bankName}
                            onChange={(event) => {
                              setBankForm((prev) => ({ ...prev, bankName: event.target.value }));
                              setBankMessage("");
                            }}
                            placeholder="Ej: Bancolombia"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Cuenta bancaria</label>
                          <input
                            className="mt-1 w-full rounded border p-2"
                            value={bankForm.bankAccountNumber}
                            onChange={(event) => {
                              setBankForm((prev) => ({ ...prev, bankAccountNumber: event.target.value }));
                              setBankMessage("");
                            }}
                            placeholder="Numero de cuenta"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button type="button" onClick={saveBankData} disabled={bankSaving}>
                            {bankSaving ? "Guardando..." : "Guardar"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setBankForm({
                                bankName: user.bankName || "",
                                bankAccountNumber: user.bankAccountNumber || "",
                              });
                              setBankMessage("");
                              setIsEditingBankData(false);
                            }}
                            disabled={bankSaving}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                    {bankMessage && <p className="text-sm text-muted-foreground">{bankMessage}</p>}
                  </div>

                  {!topUpClientSecret && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Monto a ingresar</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full rounded border p-2"
                        value={formatCopInput(topUpAmount)}
                        onChange={(event) => setTopUpAmount(parseCopInput(event.target.value))}
                        placeholder="50.000"
                      />
                      <Button onClick={startWalletTopUp} disabled={topUpLoading}>
                        {topUpLoading ? "Creando recarga..." : "Añadir plata"}
                      </Button>
                    </div>
                  )}

                  {topUpClientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret: topUpClientSecret }}>
                      <WalletTopUpForm
                        clientSecret={topUpClientSecret}
                        onCompleted={completeWalletTopUp}
                        onCancel={cancelWalletTopUp}
                      />
                    </Elements>
                  )}

                  {topUpError && <p className="text-sm text-red-600">{topUpError}</p>}
                </CardContent>
              </Card>
            </>
          )}

          {user.userType === "freelancer" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Perfil profesional</CardTitle>
                  <CardDescription>Tu información pública y la reputación que se construye con cada proyecto finalizado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Descripcion:</strong>{" "}
                    {isEditing ? (
                      <input className="w-full rounded border p-1" value={formData.bio || ""} onChange={(e) => handleChange("bio", e.target.value)} />
                    ) : (
                      user.bio || "No especificada"
                    )}
                  </p>
                  <p>
                    <strong>Fecha de Nacimiento:</strong>{" "}
                    {isEditing ? (
                      <input type="number" className="rounded border p-1" value={formData.date_of_birth || ""} onChange={(e) => handleChange("date_of_birth", e.target.value)} />
                    ) : (
                      user.date_of_birth || "No especificada"
                    )}
                  </p>
                  <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <p className="font-medium text-foreground">
                        {reviewsSummary?.averageRating?.toFixed(1) ?? "0.0"} / 5
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {reviewsSummary?.reviewsCount ?? 0} reseñas recibidas
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial de postulaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Total:</strong> {freelancerSummary?.total ?? 0}</p>
                  <p><strong>Pendientes:</strong> {freelancerSummary?.pending ?? 0}</p>
                  <p><strong>En revision:</strong> {freelancerSummary?.reviewing ?? 0}</p>
                  <p><strong>Aceptadas:</strong> {freelancerSummary?.accepted ?? 0}</p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Reseñas recibidas</CardTitle>
                  <CardDescription>Comentarios que dejaron tus clientes al finalizar proyectos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no has recibido reseñas en proyectos finalizados.</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{review.projectTitle}</p>
                            <p className="text-sm text-muted-foreground">Cliente: {review.client.displayName}</p>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : ""}`} />
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {review.comment || "Sin comentario adicional."}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
