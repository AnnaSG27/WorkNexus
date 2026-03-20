import { useState } from "react";
import { Menu, X, Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const navLinks = [
    { name: "Inicio", to: "/" },
    { name: "Servicios", to: "/services" },
    { name: "Profesionales", to: "/freelancers" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <img 
              src="../public/images/Logo_WorkNexus.png" 
              alt="WorkNexus Logo"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
            />
            <span className="font-display font-bold text-xl text-foreground tracking-tight group-hover:text-primary transition-colors">
              WorkNexus
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link to={link.to}
                key={link.name}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
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
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Registrarse
                  </Button>
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

                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                >
                  Cerrar sesión
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link to={link.to}
                  key={link.name}
                  className="block text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1">
                  Iniciar sesión
                </Button>
                <Button className="flex-1 bg-primary text-primary-foreground">
                  Registrarse
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
