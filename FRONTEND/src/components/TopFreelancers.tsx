import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Search, SlidersHorizontal } from "lucide-react";

import FreelancerCard, { type FreelancerCardProps } from "./FreelancerCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = "http://localhost:8000/professionals/freelancers/";

const fallbackFreelancers: FreelancerCardProps[] = [
  {
    id: "seed-maria-garcia",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    name: "Maria Garcia",
    title: "UX/UI Designer",
    location: "Barcelona, Espana",
    rating: 5.0,
    reviews: 189,
    skills: ["Figma", "Adobe XD", "Branding", "Prototyping"],
    hourlyRate: 65,
    isVerified: true,
    bio: "Disena experiencias digitales limpias y modernas para productos SaaS, ecommerce y apps moviles. Le gusta trabajar de cerca con clientes para aterrizar ideas y convertirlas en flujos intuitivos.",
    experience: "6 anos en diseno de producto y experiencia de usuario",
    completedProjects: 124,
    responseTime: "Responde en 45 minutos",
    availability: "Disponible para empezar manana",
    category: "Diseno",
    featuredLabel: "Top Rated",
  },
  {
    id: "seed-ana-rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    name: "Ana Rodriguez",
    title: "Digital Marketing Expert",
    location: "Valencia, Espana",
    rating: 4.8,
    reviews: 256,
    skills: ["SEO", "SEM", "Social Media", "Analytics"],
    hourlyRate: 55,
    isVerified: true,
    bio: "Especialista en estrategia de crecimiento, anuncios de rendimiento y posicionamiento organico. Suele trabajar con marcas que quieren escalar sus ventas y mejorar conversiones.",
    experience: "7 anos llevando trafico y conversion a marcas digitales",
    completedProjects: 181,
    responseTime: "Responde en 1 hora",
    availability: "Cupos abiertos esta semana",
    category: "Marketing",
    featuredLabel: "Mas contratado",
  },
  {
    id: "seed-david-lopez",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    name: "David Lopez",
    title: "Video Editor & Motion Designer",
    location: "Sevilla, Espana",
    rating: 4.7,
    reviews: 98,
    skills: ["Premiere Pro", "After Effects", "DaVinci"],
    hourlyRate: 45,
    isVerified: false,
    bio: "Edita piezas dinamicas para redes, YouTube y anuncios. Su enfoque combina ritmo, narrativa y motion graphics con entregas rapidas y organizadas.",
    experience: "4 anos en edicion audiovisual y motion",
    completedProjects: 86,
    responseTime: "Responde en 2 horas",
    availability: "Disponible por proyecto",
    category: "Audiovisual",
  },
  {
    id: "seed-sofia-mendoza",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop",
    name: "Sofia Mendoza",
    title: "Frontend Developer",
    location: "Bogota, Colombia",
    rating: 4.9,
    reviews: 142,
    skills: ["React", "TypeScript", "Tailwind", "Vite"],
    hourlyRate: 60,
    isVerified: true,
    bio: "Construye interfaces modernas y responsivas para startups y equipos de producto. Le importan mucho el detalle visual, la accesibilidad y el rendimiento.",
    experience: "5 anos desarrollando frontend para productos web",
    completedProjects: 109,
    responseTime: "Responde en 30 minutos",
    availability: "Disponible medio tiempo",
    category: "Desarrollo",
    featuredLabel: "Respuesta rapida",
  },
  {
    id: "seed-camilo-ruiz",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
    name: "Camilo Ruiz",
    title: "Backend Developer",
    location: "Medellin, Colombia",
    rating: 4.9,
    reviews: 117,
    skills: ["Django", "PostgreSQL", "APIs", "Docker"],
    hourlyRate: 62,
    isVerified: true,
    bio: "Desarrollador backend enfocado en APIs escalables, autenticacion y bases de datos. Suele ayudar a equipos a ordenar arquitectura y dejar procesos mantenibles.",
    experience: "6 anos construyendo sistemas y servicios backend",
    completedProjects: 97,
    responseTime: "Responde en 50 minutos",
    availability: "Disponible para proyectos largos",
    category: "Desarrollo",
  },
  {
    id: "seed-laura-paredes",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    name: "Laura Paredes",
    title: "Brand Designer",
    location: "Quito, Ecuador",
    rating: 4.8,
    reviews: 88,
    skills: ["Branding", "Illustrator", "Packaging", "Social Kit"],
    hourlyRate: 48,
    isVerified: true,
    bio: "Desarrolla identidades visuales memorables para marcas personales y negocios emergentes. Le gusta mezclar estrategia, claridad y un sistema visual consistente.",
    experience: "5 anos en branding e identidad visual",
    completedProjects: 73,
    responseTime: "Responde en 1 hora",
    availability: "Disponible para nuevos clientes",
    category: "Diseno",
  },
  {
    id: "seed-julian-castro",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    name: "Julian Castro",
    title: "Data Analyst",
    location: "Lima, Peru",
    rating: 4.7,
    reviews: 69,
    skills: ["Python", "Power BI", "SQL", "Dashboards"],
    hourlyRate: 52,
    isVerified: false,
    bio: "Analiza datos de negocio y convierte informacion dispersa en dashboards y reportes accionables. Trabaja mucho con equipos comerciales, operativos y de producto.",
    experience: "4 anos en analitica y visualizacion de datos",
    completedProjects: 58,
    responseTime: "Responde en 3 horas",
    availability: "Disponible por entregables",
    category: "Datos",
  },
  {
    id: "seed-paula-vega",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
    name: "Paula Vega",
    title: "Content Strategist",
    location: "Ciudad de Mexico, Mexico",
    rating: 4.9,
    reviews: 134,
    skills: ["Copywriting", "Content SEO", "Blogs", "Email"],
    hourlyRate: 46,
    isVerified: true,
    bio: "Crea estrategias de contenido y calendarios editoriales orientados a conversion. Su trabajo mezcla investigacion de audiencia, tono de marca y objetivos comerciales.",
    experience: "6 anos creando contenido para empresas digitales",
    completedProjects: 121,
    responseTime: "Responde en 1 hora",
    availability: "Disponible este mes",
    category: "Marketing",
    featuredLabel: "Mas contratado",
  },
  {
    id: "seed-esteban-mora",
    avatar: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=200&h=200&fit=crop",
    name: "Esteban Mora",
    title: "Mobile App Developer",
    location: "San Jose, Costa Rica",
    rating: 4.8,
    reviews: 91,
    skills: ["Flutter", "React Native", "Firebase", "Android"],
    hourlyRate: 58,
    isVerified: true,
    bio: "Desarrolla aplicaciones moviles para negocios y productos digitales. Trabaja en interfaces fluidas, integraciones y despliegues listos para tiendas.",
    experience: "5 anos creando apps moviles multiplataforma",
    completedProjects: 76,
    responseTime: "Responde en 1 hora",
    availability: "Disponible para MVPs y mejoras",
    category: "Desarrollo",
  },
  {
    id: "seed-valentina-rios",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop",
    name: "Valentina Rios",
    title: "Customer Support Specialist",
    location: "Manizales, Colombia",
    rating: 4.9,
    reviews: 77,
    skills: ["CRM", "Chat Support", "Email Support", "Onboarding"],
    hourlyRate: 34,
    isVerified: true,
    bio: "Ayuda a empresas a estructurar procesos de atencion al cliente, soporte por chat y flujos de onboarding con un tono cercano y profesional.",
    experience: "4 anos optimizando experiencia de soporte",
    completedProjects: 63,
    responseTime: "Responde en 40 minutos",
    availability: "Disponible para soporte recurrente",
    category: "Soporte",
    featuredLabel: "Respuesta rapida",
  },
  {
    id: "seed-nicolas-suarez",
    avatar: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop",
    name: "Nicolas Suarez",
    title: "Cybersecurity Consultant",
    location: "Buenos Aires, Argentina",
    rating: 4.8,
    reviews: 54,
    skills: ["Security Audit", "OWASP", "Pentesting", "DevSecOps"],
    hourlyRate: 72,
    isVerified: false,
    bio: "Realiza auditorias de seguridad, revisiones de vulnerabilidades y buenas practicas para equipos que quieren fortalecer sus productos web.",
    experience: "6 anos en seguridad ofensiva y consultoria",
    completedProjects: 49,
    responseTime: "Responde en 2 horas",
    availability: "Disponible por auditorias puntuales",
    category: "Seguridad",
  },
];

interface FreelancersResponse {
  freelancers: FreelancerCardProps[];
}

const normalizeFreelancer = (freelancer: FreelancerCardProps): FreelancerCardProps => ({
  ...freelancer,
  bio:
    freelancer.bio ||
    `${freelancer.name} ofrece servicios como ${freelancer.title} y trabaja con enfoque en calidad, buena comunicacion y resultados claros para cada cliente.`,
  experience: freelancer.experience || "3+ anos de experiencia profesional",
  completedProjects: freelancer.completedProjects ?? Math.max(12, freelancer.reviews),
  responseTime: freelancer.responseTime || "Responde en menos de 2 horas",
  availability: freelancer.availability || "Disponible esta semana",
  category: freelancer.category || "General",
});

const TopFreelancers = () => {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [savedFreelancerIds, setSavedFreelancerIds] = useState<Array<string | number>>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["freelancers"],
    queryFn: async (): Promise<FreelancersResponse> => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los profesionales");
      }

      return response.json();
    },
    retry: 1,
  });

  const apiFreelancers = data?.freelancers?.map(normalizeFreelancer) ?? [];
  const fallbackById = new Map(fallbackFreelancers.map((freelancer) => [String(freelancer.id), freelancer]));
  const mergedFreelancers = [
    ...fallbackFreelancers,
    ...apiFreelancers.filter((freelancer) => !fallbackById.has(String(freelancer.id))),
  ];
  const freelancers = mergedFreelancers.length ? mergedFreelancers : fallbackFreelancers;

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(freelancers.map((freelancer) => freelancer.category || "General")))],
    [freelancers],
  );

  const shortlist = freelancers.filter((freelancer) => freelancer.id && savedFreelancerIds.includes(freelancer.id));
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const matchesCategory = selectedCategory === "Todas" || freelancer.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!normalizedSearch) return true;

    const searchableContent = [
      freelancer.name,
      freelancer.title,
      freelancer.location,
      freelancer.category,
      freelancer.bio,
      freelancer.experience,
      freelancer.availability,
      freelancer.featuredLabel,
      ...freelancer.skills,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(normalizedSearch);
  });

  const visibleFreelancers = showAll ? filteredFreelancers : filteredFreelancers.slice(0, 4);
  const hasMoreThanPreview = filteredFreelancers.length > 4;

  const handleToggleSave = (id: string | number | undefined) => {
    if (id === undefined) return;
    setSavedFreelancerIds((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  };

  return (
    <section id="freelancers" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary"
            >
              Profesionales destacados
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 font-display text-3xl font-bold leading-tight text-foreground md:text-5xl"
            >
              Conoce a nuestros expertos
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground"
            >
              Explora perfiles confiables, guarda tus favoritos y encuentra al profesional ideal para avanzar tu proyecto con claridad.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-1 md:mt-0"
          >
            <Button
              variant="outline"
              className="group rounded-full border-border bg-background px-5 shadow-sm"
              onClick={() => setShowAll((current) => !current)}
              disabled={!hasMoreThanPreview}
            >
              {hasMoreThanPreview ? (showAll ? "Ver menos" : "Ver todos") : "Sin mas resultados"}
              <ArrowRight
                className={`ml-2 h-4 w-4 transition-transform ${showAll ? "rotate-90" : "group-hover:translate-x-1"}`}
              />
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mb-8 rounded-[28px] border border-border bg-card p-4 shadow-sm md:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setShowAll(false);
                }}
                placeholder="Busca por diseno, marketing, frontend, soporte, seguridad, datos..."
                className="h-12 rounded-2xl border-border bg-card pl-11 pr-4 shadow-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className="border-transparent bg-primary text-primary-foreground hover:bg-primary">
                {filteredFreelancers.length} resultados
              </Badge>
              {shortlist.length > 0 && (
                <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
                  {shortlist.length} en shortlist
                </Badge>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Encuentra profesionales por habilidades, rol, ubicacion o necesidades especificas de tu proyecto.
          </p>
        </motion.div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
            Categoria
          </div>
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={selectedCategory === category ? "default" : "outline"}
              className="rounded-full border-border bg-background px-4 shadow-sm"
              onClick={() => {
                setSelectedCategory(category);
                setShowAll(false);
              }}
            >
              {category}
            </Button>
          ))}
        </div>

        {shortlist.length > 0 && (
          <div className="mb-10 rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary fill-current" />
              <h3 className="font-semibold text-foreground">Shortlist del cliente</h3>
              <Badge variant="outline">{shortlist.length} guardados</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              {shortlist.map((freelancer) => (
                <button
                  key={freelancer.id}
                  type="button"
                  onClick={() => handleToggleSave(freelancer.id)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-accent"
                >
                  {freelancer.name} · {freelancer.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(isLoading ? fallbackFreelancers.slice(0, 4) : visibleFreelancers).map((freelancer, index) => (
            <FreelancerCard
              key={freelancer.id ?? `${freelancer.name}-${index}`}
              {...freelancer}
              index={index}
              isSaved={freelancer.id !== undefined && savedFreelancerIds.includes(freelancer.id)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>

        {!isLoading && filteredFreelancers.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <h3 className="text-lg font-semibold text-foreground">No encontramos perfiles con esa busqueda</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Prueba con otras palabras clave o cambia la categoria para ampliar los resultados.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopFreelancers;
