

import TopFreelancers from "@/components/TopFreelancers";

const Freelancers = () => {
  return (
    <>
      {/* Hero simple */}
      <section className="pt-28 pb-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Encuentra profesionales expertos
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre talento verificado listo para ayudarte con tus proyectos.
          </p>
        </div>
      </section>

      {/* Lista de freelancers */}
      <TopFreelancers />
    </>
  );
};

export default Freelancers;