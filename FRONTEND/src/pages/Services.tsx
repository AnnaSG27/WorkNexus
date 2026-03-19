
import CategorySection from "@/components/CategorySection";
import FeaturedServices from "@/components/FeaturedServices";
const Services = () => {
  return (
    <>
      {/* Hero simple de servicios */}
      <section className="pt-28 pb-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Encuentra el servicio perfecto
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explora categorías y descubre profesionales listos para ayudarte a llevar tu proyecto al siguiente nivel.
          </p>
        </div>
      </section>

      {/* Categorías */}
      <CategorySection />

      {/* Servicios destacados */}
      <FeaturedServices />
    </>
  );
};

export default Services;