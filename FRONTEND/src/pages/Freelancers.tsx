

import TopFreelancers from "@/components/TopFreelancers";

const Freelancers = () => {
  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 via-background to-background pt-28 pb-16">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary shadow-sm">
            Explora talento
          </span>
          <h1 className="mb-4 mt-4 font-display text-4xl font-bold text-foreground md:text-5xl">
            Encuentra profesionales expertos
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Descubre talento verificado, compara perfiles con calma y guarda tus favoritos para tomar mejores decisiones.
          </p>
        </div>
      </section>

      <TopFreelancers />
    </>
  );
};

export default Freelancers;
