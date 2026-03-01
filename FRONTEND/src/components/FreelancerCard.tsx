import { Star, MapPin, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FreelancerCardProps {
  avatar: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  skills: string[];
  hourlyRate: number;
  isVerified?: boolean;
  index?: number;
}

const FreelancerCard = ({
  avatar,
  name,
  title,
  location,
  rating,
  reviews,
  skills,
  hourlyRate,
  isVerified = false,
  index = 0,
}: FreelancerCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-border"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <img
            src={avatar}
            alt={name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-background"
          />
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center ring-2 ring-background">
              <CheckCircle className="w-4 h-4 text-secondary-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
          </div>
          <p className="text-sm text-primary font-medium truncate">{title}</p>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-foreground">{rating}</span>
        </div>
        <span className="text-muted-foreground text-sm">({reviews} reseñas)</span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {skills.slice(0, 3).map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs font-medium">
            {skill}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{skills.length - 3}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <span className="text-xs text-muted-foreground">Tarifa</span>
          <p className="text-lg font-bold text-foreground">${hourlyRate}/hr</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Contactar
        </Button>
      </div>
    </motion.div>
  );
};

export default FreelancerCard;
