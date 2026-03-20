import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p>No hay usuario logueado</p>
      </div>
    );
  }

  return (
    <div className="pt-24 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Profile */}
        <Card className="shadow-lg">
          <CardContent className="flex items-center gap-6 p-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback>
                {user.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>

              <div className="mt-2">
                <Badge>
                  {user.userType === "cliente" ? "Cliente" : "Freelancer"}
                </Badge>
              </div>
            </div>

            <div className="ml-auto">
              <Button variant="outline">Editar perfil</Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle>Información general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Usuario:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </CardContent>
          </Card>

          {/* Info específica */}
          {user.userType === "cliente" && (
            <Card>
              <CardHeader>
                <CardTitle>Información de empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Empresa:</strong> {user.enterpriseName || "No especificado"}</p>
              </CardContent>
            </Card>
          )}

          {user.userType === "freelancer" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Perfil profesional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Descripción:</strong> {user.bio || "No especificada"}</p>
                  <p><strong>Edad:</strong> {user.age || "No especificada"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>⭐ Rating: 4.8</p>
                  <p>📦 Proyectos completados: 12</p>
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
