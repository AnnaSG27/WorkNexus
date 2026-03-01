import { Star, Heart, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
  image: string;
  title: string;
  freelancer: {
    name: string;
    avatar: string;
    level: string;
  };
  rating: number;
  reviews: number;
  price: number;
  deliveryTime: string;
  index?: number;
}

const ServiceCard = ({
  image,
  title,
  freelancer,
  rating,
  reviews,
  price,
  deliveryTime,
  index = 0,
}: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm">
          <Heart className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
          <Clock className="w-3 h-3" />
          {deliveryTime}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Freelancer Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={freelancer.avatar}
            alt={freelancer.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{freelancer.name}</p>
            <p className="text-xs text-secondary font-medium">{freelancer.level}</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">{rating}</span>
          <span className="text-sm text-muted-foreground">({reviews})</span>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <span className="text-xs text-muted-foreground">Desde</span>
            <p className="text-xl font-bold text-foreground">${price}</p>
          </div>
          <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors">
            Ver más
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
