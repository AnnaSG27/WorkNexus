import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Link } from "react-router-dom";

import { canUseClientFeatures, getStoredUser } from "./professionals-session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = getStoredUser();
  const canSaveFavorites = canUseClientFeatures(user);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="group flex items-center gap-3">
            <img
              src="../public/images/Logo_WorkNexus.png"
              alt="WorkNexus Logo"
              className="h-10 w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-display text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              WorkNexus
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Inicio
            </Link>
            <Link to="/services" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Servicios
            </Link>
            {canSaveFavorites ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Profesionales
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 rounded-xl p-2">
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link to="/freelancers">Ver profesionales</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link to="/freelancers/saved" className="inline-flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Perfiles Guardados
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/freelancers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Profesionales
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ShoppingCart className="h-5 w-5" />
            </Button>

            {!user && (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Iniciar sesion
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Registrarse</Button>
                </Link>
              </>
            )}

            {user && (
              <>
                {user.userType === "cliente" && (
                  <Link to="/services">
                    <Button variant="ghost">Mis solicitudes</Button>
                  </Link>
                )}

                {user.userType === "freelancer" && (
                  <Link to="/freelancers">
                    <Button variant="ghost">Trabajos</Button>
                  </Link>
                )}

                <Link to="/profile">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Mi perfil
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                >
                  Cerrar sesion
                </Button>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-background md:hidden"
          >
            <div className="container mx-auto space-y-4 px-4 py-4">
              <Link
                to="/"
                className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                to="/services"
                className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Servicios
              </Link>
              <Link
                to="/freelancers"
                className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Profesionales
              </Link>
              {canSaveFavorites && (
                <Link
                  to="/freelancers/saved"
                  className="ml-4 flex items-center gap-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart className="h-4 w-4" />
                  Perfiles Guardados
                </Link>
              )}
              <div className="flex gap-2 border-t border-border pt-4">
                <Button variant="outline" className="flex-1">
                  Iniciar sesion
                </Button>
                <Button className="flex-1 bg-primary text-primary-foreground">Registrarse</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
