import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Menu, MessageSquare, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canUseClientFeatures, getStoredUser } from "@/components/professionals-session";
import { useProfessionalFavorites } from "@/components/useProfessionalFavorites";
import { fetchConversations } from "@/lib/chat";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = getStoredUser();
  const canSaveFavorites = canUseClientFeatures(user);
  const { savedFreelancerIds } = useProfessionalFavorites(user, canSaveFavorites);
  const workLabel = user?.userType === "freelancer" ? "Mis trabajos" : "Mis proyectos";
  const isFreelancer = user?.userType === "freelancer";

  const conversationsQuery = useQuery({
    queryKey: ["messaging", "conversations", user?.id],
    queryFn: () => fetchConversations(Number(user?.id)),
    enabled: Boolean(user?.id),
    refetchInterval: 2500,
  });

  const unreadCount = conversationsQuery.data?.totalUnread ?? 0;

  const navLinks = [
    { name: "Inicio", to: "/" },
    ...(!isFreelancer ? [{ name: "Servicios", to: "/services" }] : []),
    { name: "Proyectos", to: "/projects" },
    ...(user ? [{ name: workLabel, to: "/orders" }] : []),
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src="/images/Logo_WorkNexus.png"
              alt="WorkNexus Logo"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-display text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              WorkNexus
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
            {!isFreelancer && (<DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Profesionales
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2">
                <DropdownMenuItem onSelect={() => navigate("/freelancers")}>Explorar profesionales</DropdownMenuItem>
                {canSaveFavorites && (
                  <DropdownMenuItem onSelect={() => navigate("/saved-profiles")} className="justify-between">
                    <span className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      Perfiles guardados
                    </span>
                    {savedFreelancerIds.length > 0 && <Badge>{savedFreelancerIds.length}</Badge>}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>)}
          </div>

          <div className="hidden items-center gap-3 md:flex">
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
                <Link to="/messages" className="relative">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 min-w-5 justify-center border-transparent bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground hover:bg-primary">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Link>

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
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/freelancers"
                className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Profesionales
              </Link>
              {canSaveFavorites && (
                <Link
                  to="/saved-profiles"
                  className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Perfiles guardados
                </Link>
              )}

              {!user ? (
                <div className="flex gap-2 border-t border-border pt-4">
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Iniciar sesion
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground">Registrarse</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 border-t border-border pt-4">
                  <Link to="/messages" className="block" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-between">
                      Mensajes
                      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
                    </Button>
                  </Link>
                  {canSaveFavorites && (
                    <Link to="/saved-profiles" className="block" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-between">
                        Perfiles guardados
                        {savedFreelancerIds.length > 0 && <Badge>{savedFreelancerIds.length}</Badge>}
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile" className="block" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Mi perfil
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      localStorage.removeItem("user");
                      window.location.href = "/";
                    }}
                  >
                    Cerrar sesion
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
