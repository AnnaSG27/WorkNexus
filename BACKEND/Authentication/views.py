import json

from django.db import transaction
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from .models import ClientProfile, FreelancerProfile, User


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
    return {
        "id": profile.id,
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
        "name": _build_name(user),
        "title": title,
        "location": _build_location(user),
        "rating": 5.0,
        "reviews": 0,
        "skills": _build_skills(profile),
        "hourlyRate": 0,
        "isVerified": bool(user.email),
        "bio": profile.bio,
        "experience": "Profesional registrado en WorkNexus",
        "completedProjects": 12,
        "responseTime": "Responde en menos de 2 horas",
        "availability": "Disponible esta semana",
    }


@method_decorator(csrf_exempt, name="dispatch")
class FreelancerListView(View):
    def get(self, request):
        profiles = FreelancerProfile.objects.select_related("user").all().order_by("-id")
        freelancers = SEEDED_FREELANCERS + [_serialize_freelancer(profile) for profile in profiles]
        return JsonResponse({"freelancers": freelancers}, status=200)


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            required_fields = ["nombre", "username", "email", "password", "confirmPassword", "userType"]
            missing_fields = [field for field in required_fields if not str(data.get(field, "")).strip()]
            if missing_fields:
                return JsonResponse(
                    {"error": f"Faltan campos obligatorios: {', '.join(missing_fields)}"},
                    status=400,
                )

            if data["password"] != data["confirmPassword"]:
                return JsonResponse({"error": "Las contrasenas no coinciden"}, status=400)

            if User.objects.filter(username=data["username"]).exists():
                return JsonResponse({"error": "El nombre de usuario ya existe"}, status=400)

            if User.objects.filter(email=data["email"]).exists():
                return JsonResponse({"error": "El correo ya existe"}, status=400)

            with transaction.atomic():
                full_name = data["nombre"].strip().split()
                first_name = full_name[0] if full_name else ""
                last_name = " ".join(full_name[1:]) if len(full_name) > 1 else ""

                user = User.objects.create_user(
                    username=data["username"].strip(),
                    email=data["email"].strip(),
                    password=data["password"],
                    first_name=first_name,
                    last_name=last_name,
                    country=str(data.get("country", "")).strip(),
                    city=str(data.get("city", "")).strip(),
                )

                user_type = str(data["userType"]).strip().lower()

                if user_type == "cliente":
                    enterprise_name = str(data.get("enterpriseName", "")).strip()
                    if not enterprise_name:
                        raise ValueError("El nombre de la empresa es obligatorio para clientes")

                    ClientProfile.objects.create(user=user, enterprise_name=enterprise_name)
                elif user_type == "freelancer":
                    bio = str(data.get("bio", "")).strip()
                    age = str(data.get("age", "")).strip()
                    if not bio or not age:
                        raise ValueError("La descripcion y la edad son obligatorias para freelancers")

                    FreelancerProfile.objects.create(user=user, bio=bio, age=int(age))
                else:
                    raise ValueError("Tipo de usuario no valido")

            return JsonResponse(
                {"message": "Usuario registrado correctamente", "userType": user_type},
                status=201,
            )

        except ValueError as value_error:
            return JsonResponse({"error": str(value_error)}, status=400)
        except Exception as error:
            print("Error al procesar la solicitud:", error)
            return JsonResponse({"error": "Error al procesar la solicitud"}, status=400)
