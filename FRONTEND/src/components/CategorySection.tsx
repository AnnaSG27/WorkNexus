import { 
  Code, 
  Palette, 
  TrendingUp, 
  Video, 
  FileText, 
  Megaphone,
  Camera,
  Music
} from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  {
    icon: Code,
    name: "Desarrollo",
    services: "2,340 servicios",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Palette,
    name: "Diseño",
    services: "1,850 servicios",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: TrendingUp,
    name: "Marketing",
    services: "1,420 servicios",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Video,
    name: "Video",
    services: "980 servicios",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: FileText,
    name: "Escritura",
    services: "1,680 servicios",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Megaphone,
    name: "Publicidad",
    services: "720 servicios",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: Camera,
    name: "Fotografía",
    services: "540 servicios",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Music,
    name: "Audio",
    services: "380 servicios",
    color: "from-indigo-500 to-purple-500",
  },
];

const CategorySection = () => {
  return (
    <section id="categories" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-secondary font-semibold text-sm uppercase tracking-wider"
          >
            Categorías
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4"
          >
            Explora nuestros servicios
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Desde desarrollo web hasta producción audiovisual, encuentra exactamente lo que necesitas
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.a
              key={category.name}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-border"
            >
              {/* Icon Background */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <category.icon className="w-full h-full text-white" />
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-muted-foreground text-sm">{category.services}</p>

              {/* Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
