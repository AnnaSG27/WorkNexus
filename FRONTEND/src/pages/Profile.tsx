import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/components/professionals-session";
import { fetchMyApplications, fetchProjects } from "@/lib/projects";
import { fetchFreelancerReviews } from "@/lib/reviews";
import { API_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiClient";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) return;
    setUser(storedUser);
    setFormData(storedUser);
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
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
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
