from django.http import JsonResponse
from django.db import OperationalError, ProgrammingError
from django.views import View

from Authentication.models import FreelancerProfile
from Projects.models import ProjectApplication
from Reviews.services import get_freelancer_review_stats


SEEDED_FREELANCERS = [
    {
        "id": "seed-maria-garcia",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        "name": "Maria Garcia",
        "title": "UX/UI Designer",
        "location": "Barcelona, Espana",
        "rating": 5.0,
        "reviews": 189,
        "skills": ["Figma", "Adobe XD", "Branding", "Prototyping"],
        "hourlyRate": 65,
        "isVerified": True,
        "bio": "Disena experiencias digitales limpias y modernas para productos SaaS, ecommerce y apps moviles. Le gusta trabajar de cerca con clientes para aterrizar ideas y convertirlas en flujos intuitivos.",
        "experience": "6 anos en diseno de producto y experiencia de usuario",
        "completedProjects": 124,
        "responseTime": "Responde en 45 minutos",
        "availability": "Disponible para empezar manana",
        "isSample": True,
    },
    {
        "id": "seed-ana-rodriguez",
        "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
        "name": "Ana Rodriguez",
        "title": "Digital Marketing Expert",
        "location": "Valencia, Espana",
        "rating": 4.8,
        "reviews": 256,
        "skills": ["SEO", "SEM", "Social Media", "Analytics"],
        "hourlyRate": 55,
        "isVerified": True,
        "bio": "Especialista en estrategia de crecimiento, anuncios de rendimiento y posicionamiento organico. Suele trabajar con marcas que quieren escalar sus ventas y mejorar conversiones.",
        "experience": "7 anos llevando trafico y conversion a marcas digitales",
        "completedProjects": 181,
        "responseTime": "Responde en 1 hora",
        "availability": "Cupos abiertos esta semana",
        "isSample": True,
    },
    {
        "id": "seed-david-lopez",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
        "name": "David Lopez",
        "title": "Video Editor & Motion Designer",
        "location": "Sevilla, Espana",
        "rating": 4.7,
        "reviews": 98,
        "skills": ["Premiere Pro", "After Effects", "DaVinci"],
        "hourlyRate": 45,
        "isVerified": False,
        "bio": "Edita piezas dinamicas para redes, YouTube y anuncios. Su enfoque combina ritmo, narrativa y motion graphics con entregas rapidas y organizadas.",
        "experience": "4 anos en edicion audiovisual y motion",
        "completedProjects": 86,
        "responseTime": "Responde en 2 horas",
        "availability": "Disponible por proyecto",
        "isSample": True,
    },
    {
        "id": "seed-sofia-mendoza",
        "avatar": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop",
        "name": "Sofia Mendoza",
        "title": "Frontend Developer",
        "location": "Bogota, Colombia",
        "rating": 4.9,
        "reviews": 142,
        "skills": ["React", "TypeScript", "Tailwind", "Vite"],
        "hourlyRate": 60,
        "isVerified": True,
        "bio": "Construye interfaces modernas y responsivas para startups y equipos de producto. Le importan mucho el detalle visual, la accesibilidad y el rendimiento.",
        "experience": "5 anos desarrollando frontend para productos web",
        "completedProjects": 109,
        "responseTime": "Responde en 30 minutos",
        "availability": "Disponible medio tiempo",
        "isSample": True,
    },
    {
        "id": "seed-camilo-ruiz",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
        "name": "Camilo Ruiz",
        "title": "Backend Developer",
        "location": "Medellin, Colombia",
        "rating": 4.9,
        "reviews": 117,
        "skills": ["Django", "PostgreSQL", "APIs", "Docker"],
        "hourlyRate": 62,
        "isVerified": True,
        "bio": "Desarrollador backend enfocado en APIs escalables, autenticacion y bases de datos. Suele ayudar a equipos a ordenar arquitectura y dejar procesos mantenibles.",
        "experience": "6 anos construyendo sistemas y servicios backend",
        "completedProjects": 97,
        "responseTime": "Responde en 50 minutos",
        "availability": "Disponible para proyectos largos",
        "isSample": True,
    },
    {
        "id": "seed-laura-paredes",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
        "name": "Laura Paredes",
        "title": "Brand Designer",
        "location": "Quito, Ecuador",
        "rating": 4.8,
        "reviews": 88,
        "skills": ["Branding", "Illustrator", "Packaging", "Social Kit"],
        "hourlyRate": 48,
        "isVerified": True,
        "bio": "Desarrolla identidades visuales memorables para marcas personales y negocios emergentes. Le gusta mezclar estrategia, claridad y un sistema visual consistente.",
        "experience": "5 anos en branding e identidad visual",
        "completedProjects": 73,
        "responseTime": "Responde en 1 hora",
        "availability": "Disponible para nuevos clientes",
        "isSample": True,
    },
    {
        "id": "seed-julian-castro",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
        "name": "Julian Castro",
        "title": "Data Analyst",
        "location": "Lima, Peru",
        "rating": 4.7,
        "reviews": 69,
        "skills": ["Python", "Power BI", "SQL", "Dashboards"],
        "hourlyRate": 52,
        "isVerified": False,
        "bio": "Analiza datos de negocio y convierte informacion dispersa en dashboards y reportes accionables. Trabaja mucho con equipos comerciales, operativos y de producto.",
        "experience": "4 anos en analitica y visualizacion de datos",
        "completedProjects": 58,
        "responseTime": "Responde en 3 horas",
        "availability": "Disponible por entregables",
        "isSample": True,
    },
    {
        "id": "seed-paula-vega",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
        "name": "Paula Vega",
        "title": "Content Strategist",
        "location": "Ciudad de Mexico, Mexico",
        "rating": 4.9,
        "reviews": 134,
        "skills": ["Copywriting", "Content SEO", "Blogs", "Email"],
        "hourlyRate": 46,
        "isVerified": True,
        "bio": "Crea estrategias de contenido y calendarios editoriales orientados a conversion. Su trabajo mezcla investigacion de audiencia, tono de marca y objetivos comerciales.",
        "experience": "6 anos creando contenido para empresas digitales",
        "completedProjects": 121,
        "responseTime": "Responde en 1 hora",
        "availability": "Disponible este mes",
        "isSample": True,
    },
]


def _build_location(user):
    parts = [part for part in [user.city, user.country] if part]
    return ", ".join(parts) if parts else "Ubicacion no especificada"


def _build_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _build_skills(profile):
    items = [chunk.strip() for chunk in profile.bio.split(",") if chunk.strip()]
    return items[:4] if items else ["Freelancer"]


def _serialize_freelancer(profile):
    user = profile.user
    title = profile.bio.strip().splitlines()[0][:60] if profile.bio.strip() else "Profesional Freelancer"
    review_stats = get_freelancer_review_stats(profile)
    completed_projects = ProjectApplication.objects.filter(freelancer=profile, status="aceptada").count()
    return {
        "id": profile.id,
        "userId": user.id,
        "avatar": "",
        "name": _build_name(user),
        "title": title,
        "location": _build_location(user),
        "rating": review_stats["averageRating"],
        "reviews": review_stats["reviewsCount"],
        "skills": _build_skills(profile),
        "hourlyRate": 0,
        "isVerified": bool(user.email),
        "bio": profile.bio,
        "experience": "Profesional registrado en WorkNexus",
        "completedProjects": completed_projects,
        "responseTime": "Responde en menos de 2 horas",
        "availability": "Disponible esta semana",
        "isSample": False,
    }


class FreelancerListView(View):
    def get(self, request):
        try:
            profiles = FreelancerProfile.objects.select_related("user").all().order_by("-id")
            freelancers = SEEDED_FREELANCERS + [_serialize_freelancer(profile) for profile in profiles]
            return JsonResponse({"freelancers": freelancers}, status=200)
        except (OperationalError, ProgrammingError):
            return JsonResponse({"error": "La base de datos no está disponible"}, status=503)
