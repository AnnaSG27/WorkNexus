import ServiceCard from "./ServiceCard";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=450&fit=crop",
    title: "Desarrollo de aplicaciones web modernas con React y Node.js",
    freelancer: {
      name: "Carlos Mendoza",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      level: "Top Rated",
    },
    rating: 4.9,
    reviews: 324,
    price: 150,
    deliveryTime: "5 días",
  },
  {
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=450&fit=crop",
    title: "Diseño de identidad visual y branding completo para tu marca",
    freelancer: {
      name: "María García",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      level: "Pro",
    },
    rating: 5.0,
    reviews: 189,
    price: 200,
    deliveryTime: "7 días",
  },
  {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=450&fit=crop",
    title: "Estrategia de marketing digital y gestión de redes sociales",
    freelancer: {
      name: "Ana Rodríguez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      level: "Top Rated",
    },
    rating: 4.8,
    reviews: 256,
    price: 120,
    deliveryTime: "3 días",
  },
  {
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=450&fit=crop",
    title: "Edición de video profesional para YouTube y redes sociales",
    freelancer: {
      name: "David López",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      level: "Rising Talent",
    },
    rating: 4.7,
    reviews: 98,
    price: 80,
    deliveryTime: "2 días",
  },
  {
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=450&fit=crop",
    title: "Análisis de datos y visualización con Power BI y Python",
    freelancer: {
      name: "Laura Martínez",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
      level: "Pro",
    },
    rating: 4.9,
    reviews: 142,
    price: 175,
    deliveryTime: "4 días",
  },
  {
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=450&fit=crop",
    title: "Copywriting persuasivo y contenido SEO para tu sitio web",
    freelancer: {
      name: "Javier Sánchez",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      level: "Top Rated",
    },
    rating: 4.8,
    reviews: 203,
    price: 90,
    deliveryTime: "3 días",
  },
];

const FeaturedServices = () => {
  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-secondary font-semibold text-sm uppercase tracking-wider"
            >
              Servicios destacados
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3"
            >
              Los más populares
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 md:mt-0"
          >
            <Button variant="ghost" className="text-primary hover:text-primary/80 group">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
