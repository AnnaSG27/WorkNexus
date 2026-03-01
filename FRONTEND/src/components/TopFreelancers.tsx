import FreelancerCard from "./FreelancerCard";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const freelancers = [
  {
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    name: "María García",
    title: "UX/UI Designer",
    location: "Barcelona, España",
    rating: 5.0,
    reviews: 189,
    skills: ["Figma", "Adobe XD", "Branding", "Prototyping"],
    hourlyRate: 65,
    isVerified: true,
  },
  {
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    name: "Ana Rodríguez",
    title: "Digital Marketing Expert",
    location: "Valencia, España",
    rating: 4.8,
    reviews: 256,
    skills: ["SEO", "SEM", "Social Media", "Analytics"],
    hourlyRate: 55,
    isVerified: true,
  },
  {
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    name: "David López",
    title: "Video Editor & Motion Designer",
    location: "Sevilla, España",
    rating: 4.7,
    reviews: 98,
    skills: ["Premiere Pro", "After Effects", "DaVinci"],
    hourlyRate: 45,
    isVerified: false,
  },
];

const TopFreelancers = () => {
  return (
    <section id="freelancers" className="py-20 bg-background">
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
              Profesionales destacados
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3"
            >
              Conoce a nuestros expertos
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

        {/* Freelancers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {freelancers.map((freelancer, index) => (
            <FreelancerCard key={index} {...freelancer} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopFreelancers;
