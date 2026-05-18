import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Menu, MessageSquare, User, X } from "lucide-react";
import { fetchExchangeRate } from "@/lib/external";

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
import { useI18n } from "@/i18n";
import { fetchConversations } from "@/lib/chat";

const Navbar = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useI18n();
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

  const [rate, setRate] = useState<number | null>(null);

  const scrollToPageTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const closeMenuAndScrollTop = () => {
    setIsMenuOpen(false);
    scrollToPageTop();
  };

  const navigateFromNavbar = (to: string) => {
    scrollToPageTop();
    navigate(to);
  };

  useEffect(() => {
    let isMounted = true;

    const loadExchangeRate = async () => {
      try {
        const nextRate = await fetchExchangeRate();
        if (isMounted) {
          setRate(nextRate);
        }
      } catch (error) {
        console.error("Unable to refresh exchange rate", error);
      }
    };

    loadExchangeRate();
    const interval = setInterval(loadExchangeRate, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3" onClick={scrollToPageTop}>
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
                onClick={scrollToPageTop}
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
                <DropdownMenuItem onSelect={() => navigateFromNavbar("/freelancers")}>Explorar profesionales</DropdownMenuItem>
                {canSaveFavorites && (
                  <DropdownMenuItem onSelect={() => navigateFromNavbar("/saved-profiles")} className="justify-between">
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
            <Button
              variant="outline"
              size="sm"
              className="min-w-20 rounded-full px-3"
              onClick={toggleLanguage}
              aria-label={language === "es" ? "Cambiar a ingles" : "Switch to Spanish"}
            >
              {language === "es" ? "🌐 EN" : "🌐 ES"}
            </Button>
            {!user && (
              <>
                <Link to="/login" onClick={scrollToPageTop}>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Iniciar sesion
                  </Button>
                </Link>
                <Link to="/register" onClick={scrollToPageTop}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Registrarse</Button>
                </Link>
              </>
            )}

            {user && (
              <>
                {rate && (
                  <span className="text-sm text-muted-foreground">
                    💵 1 USD = {rate} COP
                  </span>
                )}
                <Link to="/messages" className="relative" onClick={scrollToPageTop}>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 min-w-5 justify-center border-transparent bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground hover:bg-primary">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Link>

                <Link to="/profile" onClick={scrollToPageTop}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Mi perfil
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  onClick={() => {
                    scrollToPageTop();
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
                  onClick={closeMenuAndScrollTop}
                >
                  {link.name}
                </Link>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full"
                onClick={toggleLanguage}
                aria-label={language === "es" ? "Cambiar a ingles" : "Switch to Spanish"}
              >
                {language === "es" ? "🌐 English" : "🌐 Español"}
              </Button>
              <Link
                to="/freelancers"
                className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={closeMenuAndScrollTop}
              >
                Profesionales
              </Link>
              {canSaveFavorites && (
                <Link
                  to="/saved-profiles"
                  className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={closeMenuAndScrollTop}
                >
                  Perfiles guardados
                </Link>
              )}

              {!user ? (
                <div className="flex gap-2 border-t border-border pt-4">
                  <Link to="/login" className="flex-1" onClick={closeMenuAndScrollTop}>
                    <Button variant="outline" className="w-full">
                      Iniciar sesion
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={closeMenuAndScrollTop}>
                    <Button className="w-full bg-primary text-primary-foreground">Registrarse</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 border-t border-border pt-4">
                  <Link to="/messages" className="block" onClick={closeMenuAndScrollTop}>
                    <Button variant="outline" className="w-full justify-between">
                      Mensajes
                      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
                    </Button>
                  </Link>
                  {canSaveFavorites && (
                    <Link to="/saved-profiles" className="block" onClick={closeMenuAndScrollTop}>
                      <Button variant="outline" className="w-full justify-between">
                        Perfiles guardados
                        {savedFreelancerIds.length > 0 && <Badge>{savedFreelancerIds.length}</Badge>}
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile" className="block" onClick={closeMenuAndScrollTop}>
                    <Button variant="outline" className="w-full">
                      Mi perfil
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      scrollToPageTop();
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
