import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom"
import { useState } from "react"
import { API_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiClient";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [userType, setUserType] = useState("");
  const [enterpriseName, setEnterpriseName] = useState("");
  const [bio, setBio] = useState("");
  const [date_of_birth, setDate_of_birth] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Validación según tipo de usuario
    if (!userType) {
      alert("Debes seleccionar un tipo de usuario");
      return;
    }

    if (userType === "freelancer") {
      if (!bio || !date_of_birth) {
        alert("La descripción y la edad son obligatorias para freelancers");
        return;
      }
    }

    let data: any = {
      nombre,
      username,
      email,
      password,
      confirmPassword,
      phone,
      country,
      city,
      userType,
    };

    if (userType === "cliente") {
      data.enterpriseName = enterpriseName;
    }

    if (userType === "freelancer") {
      data.bio = bio;
      data.date_of_birth = date_of_birth || null;
    }

    try {
      const response = await apiFetch(`${API_URL}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert("Usuario registrado correctamente");
      } else {
        // Mostrar errores del backend (DRF)
        const messages = Object.values(result).flat().join(" ");
        alert(messages);
      }
    } catch (error: any) {
      console.error("Error al registrar:", error);

      // En caso de que apiFetch ya lance el error con el body
      if (error && typeof error === "object") {
        const messages = Object.values(error).flat().join(" ");
        alert(messages);
      } else {
        alert("Error inesperado");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Crear cuenta
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="juanperez04"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder=""
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                type="text"
                placeholder=""
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pais</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Selecciona una opción</option>
                <option value="Colombia">Colombia</option>
                {/* add new countries on the future */}
              </select>
            </div>

            {country === "Colombia" ? (
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Selecciona una ciudad</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Bogotá">Bogotá</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Ingresa tu ciudad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="userType">Selecciona el tipo de usuario</Label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Selecciona una opción</option>
                <option value="cliente">Cliente</option>
                <option value="freelancer">Profesional / Freelancer</option>
              </select>
            </div>

            {userType === "cliente" && (
              <div className="space-y-2">
                <Label htmlFor="enterpriseName">Nombre de empresa</Label>
                <Input
                  id="enterpriseName"
                  type="text"
                  placeholder="Mercado Libre"
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                />
              </div>
            )}

            {userType === "freelancer" && (
              <div className="space-y-2">
                <Label htmlFor="bio">Descripción</Label>
                <Input
                  id="bio"
                  type="text"
                  placeholder="Cuéntanos sobre ti"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            )}

            {userType === "freelancer" && (
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={date_of_birth}
                  onChange={(e) => setDate_of_birth(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              Registrarse
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>

            <div className="text-center">
              <Link to="/">
                <Button variant="ghost" className="mt-2">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}