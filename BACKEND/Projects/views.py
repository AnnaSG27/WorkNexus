import json
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import DatabaseError, OperationalError, ProgrammingError
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from Authentication.models import ClientProfile, FreelancerProfile
from Messaging.models import Conversation, Message
from order.services import ensure_project_application_order

from .models import Project, ProjectApplication, ProjectFavorite


User = get_user_model()


def _parse_json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body)


def _normalize_user_id(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _ensure_projects_schema():
    call_command("migrate", "Projects", interactive=False, verbosity=0)


def _serialize_skills(skills):
    return [item.strip() for item in (skills or "").split(",") if item.strip()]


def _user_display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _serialize_application(application, current_user_id=None):
    freelancer_user = application.freelancer.user
    return {
        "id": application.id,
        "projectId": application.project_id,
        "freelancerId": freelancer_user.id,
        "freelancerName": freelancer_user.username,
        "freelancerDisplayName": _user_display_name(freelancer_user),
        "freelancerEmail": freelancer_user.email,
        "freelancerBio": application.freelancer.bio,
        "freelancerAge": application.freelancer.age,
        "coverLetter": application.cover_letter,
        "proposedBudget": float(application.proposed_budget) if application.proposed_budget is not None else None,
        "status": application.status,
        "createdAt": application.created_at.isoformat(),
        "isMine": bool(current_user_id and freelancer_user.id == current_user_id),
    }


def _serialize_project(project, freelancer_profile=None):
    applications = list(project.applications.select_related("freelancer__user").all())
    favorite_count = project.favorites.count()
    has_applied = False
    is_favorite = False

    if freelancer_profile:
        has_applied = any(application.freelancer_id == freelancer_profile.id for application in applications)
        is_favorite = project.favorites.filter(freelancer=freelancer_profile).exists()

    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "category": project.category,
        "budget": float(project.budget),
        "timeline": project.timeline,
        "location": project.location,
        "skills": _serialize_skills(project.skills),
        "referenceUrl": project.reference_url,
        "deadline": project.deadline.isoformat() if project.deadline else None,
        "modality": project.modality,
        "status": project.status,
        "isOpen": project.is_open,
        "createdAt": project.created_at.isoformat(),
        "clientId": project.client.user.id,
        "clientName": project.client.user.username,
        "clientDisplayName": _user_display_name(project.client.user),
        "enterpriseName": project.client.enterprise_name,
        "applicationsCount": len(applications),
        "favoriteCount": favorite_count,
        "hasApplied": has_applied,
        "isFavorite": is_favorite,
        "applications": [_serialize_application(application) for application in applications],
    }


def _base_projects_queryset():
    return Project.objects.select_related("client__user").prefetch_related(
        "applications__freelancer__user",
        "favorites",
    )


def _sorted_conversation_users(user_a, user_b):
    return (user_a, user_b) if user_a.id < user_b.id else (user_b, user_a)


def _start_project_conversation(project, freelancer_user):
    client_user = project.client.user
    participant_one, participant_two = _sorted_conversation_users(client_user, freelancer_user)
    conversation, created = Conversation.objects.get_or_create(
        participant_one=participant_one,
        participant_two=participant_two,
    )

    if created or not conversation.messages.exists():
        Message.objects.create(
            conversation=conversation,
            sender=client_user,
            content=f"Tu postulacion al proyecto '{project.title}' fue aceptada. Continuemos por aqui.",
        )
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["updated_at"])

    return conversation


def _project_summary(projects, user_type):
    project_list = list(projects)
    return {
        "projectCount": len(project_list),
        "openCount": sum(1 for project in project_list if project.status == "abierto"),
        "inProgressCount": sum(1 for project in project_list if project.status == "en_ejecucion"),
        "completedCount": sum(1 for project in project_list if project.status == "finalizado"),
        "applicationsCount": sum(project.applications.count() for project in project_list) if user_type == "cliente" else None,
    }


@method_decorator(csrf_exempt, name="dispatch")
class ProjectListCreateView(View):
    def _get_projects_response(self, request):
        freelancer_id = request.GET.get("freelancer_id")
        client_id = request.GET.get("client_id")
        category = request.GET.get("category")
        modality = request.GET.get("modality")
        search = (request.GET.get("search") or "").strip()
        favorite_only = request.GET.get("favorite_only") == "true"
        min_budget = request.GET.get("min_budget")
        max_budget = request.GET.get("max_budget")
        status = request.GET.get("status")

        freelancer_profile = None
        if freelancer_id:
            freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()

        projects = _base_projects_queryset()
        user_type = "freelancer"

        if client_id:
            projects = projects.filter(client__user_id=client_id)
            user_type = "cliente"
        else:
            projects = projects.filter(is_open=True).exclude(status__in=["cerrado", "finalizado"])

        if category:
            projects = projects.filter(category=category)
        if modality:
            projects = projects.filter(modality=modality)
        if status:
            projects = projects.filter(status=status)
        if search:
            projects = projects.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if min_budget:
            projects = projects.filter(budget__gte=min_budget)
        if max_budget:
            projects = projects.filter(budget__lte=max_budget)
        if freelancer_profile and favorite_only:
            projects = projects.filter(favorites__freelancer=freelancer_profile)

        if client_id:
            projects = projects.order_by("-created_at")
        else:
            projects = projects.order_by("?")

        project_items = [_serialize_project(project, freelancer_profile) for project in projects.distinct()]
        favorite_projects = [item for item in project_items if item["isFavorite"]]

        return JsonResponse(
            {
                "projects": project_items,
                "favorites": favorite_projects,
                "summary": _project_summary(projects.distinct(), user_type),
            },
            status=200,
        )

    def get(self, request):
        try:
            return self._get_projects_response(request)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self._get_projects_response(request)

    def _create_project_response(self, request):
        data = _parse_json_body(request)
        client_id = _normalize_user_id(data.get("clientId"))
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        category = data.get("category") or "otros"
        budget = data.get("budget")
        timeline = (data.get("timeline") or "").strip()
        location = (data.get("location") or "").strip()
        skills = (data.get("skills") or "").strip()
        reference_url = (data.get("referenceUrl") or "").strip()
        modality = data.get("modality") or "remoto"
        deadline = parse_date(data.get("deadline") or "") if data.get("deadline") else None

        client_profile = ClientProfile.objects.filter(user_id=client_id).first()
        if not client_profile:
            return JsonResponse({"error": "Solo los clientes pueden publicar proyectos"}, status=403)
        if not title or not description or budget in (None, ""):
            return JsonResponse({"error": "Titulo, descripcion y presupuesto son obligatorios"}, status=400)

        valid_categories = {choice[0] for choice in Project.CATEGORY_CHOICES}
        valid_modalities = {choice[0] for choice in Project.MODALITY_CHOICES}
        if category not in valid_categories:
            return JsonResponse({"error": "La categoria seleccionada no es valida"}, status=400)
        if modality not in valid_modalities:
            return JsonResponse({"error": "La modalidad seleccionada no es valida"}, status=400)

        try:
            normalized_budget = Decimal(str(budget))
        except (InvalidOperation, TypeError, ValueError):
            return JsonResponse({"error": "El presupuesto debe ser un numero valido"}, status=400)
        if normalized_budget <= 0:
            return JsonResponse({"error": "El presupuesto debe ser mayor a 0"}, status=400)

        project = Project.objects.create(
            client=client_profile,
            title=title,
            description=description,
            category=category,
            budget=normalized_budget,
            timeline=timeline,
            location=location,
            skills=skills,
            reference_url=reference_url,
            deadline=deadline,
            modality=modality,
            status="abierto",
            is_open=True,
        )
        project = _base_projects_queryset().get(id=project.id)
        return JsonResponse({"project": _serialize_project(project)}, status=201)

    def post(self, request):
        try:
            return self._create_project_response(request)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self._create_project_response(request)
        except DatabaseError:
            return JsonResponse({"error": "No se pudo guardar el proyecto en la base de datos"}, status=500)
        except Exception as error:
            print("Error creating project:", error)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ProjectDetailUpdateView(View):
    def patch(self, request, project_id):
        try:
            data = _parse_json_body(request)
            user_id = _normalize_user_id(data.get("userId"))
            new_status = data.get("status")

            project = _base_projects_queryset().filter(id=project_id).first()
            if not project:
                return JsonResponse({"error": "Proyecto no encontrado"}, status=404)
            if project.client.user_id != user_id:
                return JsonResponse({"error": "Solo el cliente propietario puede actualizar el proyecto"}, status=403)

            valid_statuses = {choice[0] for choice in Project.STATUS_CHOICES}
            if new_status not in valid_statuses:
                return JsonResponse({"error": "Estado de proyecto no valido"}, status=400)

            project.status = new_status
            project.is_open = new_status in {"abierto", "en_revision"}
            project.save(update_fields=["status", "is_open"])
            project = _base_projects_queryset().get(id=project.id)

            return JsonResponse({"project": _serialize_project(project)}, status=200)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.patch(request, project_id)
        except Exception as error:
            print("Error updating project:", error)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)

    def delete(self, request, project_id):
        try:
            data = _parse_json_body(request)
            user_id = _normalize_user_id(data.get("userId"))

            project = Project.objects.select_related("client__user").filter(id=project_id).first()
            if not project:
                return JsonResponse({"error": "Proyecto no encontrado"}, status=404)
            if project.client.user_id != user_id:
                return JsonResponse({"error": "Solo el cliente propietario puede eliminar el proyecto"}, status=403)

            project.delete()
            return JsonResponse({"message": "Proyecto eliminado correctamente"}, status=200)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.delete(request, project_id)
        except Exception as error:
            print("Error deleting project:", error)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ProjectApplicationListView(View):
    def get(self, request):
        try:
            freelancer_id = request.GET.get("freelancer_id")
            freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()
            if not freelancer_profile:
                return JsonResponse({"error": "Freelancer no encontrado"}, status=404)

            applications = (
                ProjectApplication.objects.filter(freelancer=freelancer_profile)
                .select_related("project__client__user", "freelancer__user")
                .order_by("-created_at")
            )

            payload = []
            for application in applications:
                project = _base_projects_queryset().get(id=application.project_id)
                item = _serialize_application(application, current_user_id=freelancer_profile.user_id)
                item["project"] = _serialize_project(project, freelancer_profile)
                payload.append(item)

            summary = {
                "total": len(payload),
                "pending": sum(1 for item in payload if item["status"] == "pendiente"),
                "reviewing": sum(1 for item in payload if item["status"] == "en_revision"),
                "accepted": sum(1 for item in payload if item["status"] == "aceptada"),
                "rejected": sum(1 for item in payload if item["status"] == "rechazada"),
            }
            return JsonResponse({"applications": payload, "summary": summary}, status=200)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.get(request)


@method_decorator(csrf_exempt, name="dispatch")
class ApplyToProjectView(View):
    def _apply_to_project_response(self, request, project_id):
        data = _parse_json_body(request)
        freelancer_id = _normalize_user_id(data.get("freelancerId"))
        cover_letter = (data.get("coverLetter") or "").strip()
        proposed_budget = data.get("proposedBudget")

        freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()
        if not freelancer_profile:
            return JsonResponse({"error": "Solo los freelancers pueden aplicar a proyectos"}, status=403)

        project = _base_projects_queryset().filter(id=project_id, is_open=True).first()
        if not project:
            return JsonResponse({"error": "Proyecto no encontrado o cerrado"}, status=404)
        if project.client.user_id == freelancer_id:
            return JsonResponse({"error": "No puedes aplicar a tu propio proyecto"}, status=400)

        if project.status not in {"abierto", "en_revision"}:
            return JsonResponse({"error": "Este proyecto ya no recibe postulaciones"}, status=400)

        normalized_budget = None
        if proposed_budget not in (None, ""):
            try:
                normalized_budget = Decimal(str(proposed_budget))
            except (InvalidOperation, TypeError, ValueError):
                return JsonResponse({"error": "La propuesta economica no es valida"}, status=400)

        application, created = ProjectApplication.objects.get_or_create(
            project=project,
            freelancer=freelancer_profile,
            defaults={
                "cover_letter": cover_letter,
                "proposed_budget": normalized_budget,
                "status": "pendiente",
            },
        )

        if not created and application.status != "retirada":
            return JsonResponse({"error": "Ya aplicaste a este proyecto"}, status=400)

        if not created and application.status == "retirada":
            application.cover_letter = cover_letter
            application.proposed_budget = normalized_budget
            application.status = "pendiente"
            application.save(update_fields=["cover_letter", "proposed_budget", "status"])

        project = _base_projects_queryset().get(id=project.id)
        return JsonResponse(
            {
                "message": "Aplicacion enviada correctamente",
                "application": _serialize_application(application, current_user_id=freelancer_id),
                "project": _serialize_project(project, freelancer_profile),
            },
            status=201,
        )

    def post(self, request, project_id):
        try:
            return self._apply_to_project_response(request, project_id)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self._apply_to_project_response(request, project_id)
        except DatabaseError:
            return JsonResponse({"error": "No se pudo guardar la aplicacion en la base de datos"}, status=500)
        except Exception as error:
            print("Error applying to project:", error)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ProjectApplicationUpdateView(View):
    def patch(self, request, application_id):
        try:
            data = _parse_json_body(request)
            user_id = _normalize_user_id(data.get("userId"))
            new_status = data.get("status")

            application = (
                ProjectApplication.objects.select_related("project__client__user", "freelancer__user")
                .filter(id=application_id)
                .first()
            )
            if not application:
                return JsonResponse({"error": "Postulacion no encontrada"}, status=404)

            valid_statuses = {choice[0] for choice in ProjectApplication.STATUS_CHOICES}
            if new_status not in valid_statuses:
                return JsonResponse({"error": "Estado de postulacion no valido"}, status=400)

            is_client_owner = application.project.client.user_id == user_id
            is_freelancer_owner = application.freelancer.user_id == user_id

            if new_status == "retirada":
                if not is_freelancer_owner:
                    return JsonResponse({"error": "Solo el freelancer puede retirar su postulacion"}, status=403)
            else:
                if not is_client_owner:
                    return JsonResponse({"error": "Solo el cliente puede actualizar esta postulacion"}, status=403)

            application.status = new_status
            application.save(update_fields=["status"])

            project = application.project
            conversation_payload = None

            if new_status == "aceptada":
                ProjectApplication.objects.filter(project=project).exclude(id=application.id).filter(
                    status__in=["pendiente", "en_revision"]
                ).update(status="rechazada")
                project.status = "en_ejecucion"
                project.is_open = False
                project.save(update_fields=["status", "is_open"])
                ensure_project_application_order(application)
                conversation = _start_project_conversation(project, application.freelancer.user)
                conversation_payload = {"conversationId": conversation.id}
            elif new_status == "rechazada" and project.status == "abierto":
                project.status = "en_revision"
                project.save(update_fields=["status"])
            elif new_status == "en_revision" and project.status == "abierto":
                project.status = "en_revision"
                project.save(update_fields=["status"])

            project = _base_projects_queryset().get(id=project.id)
            application = (
                ProjectApplication.objects.select_related("project__client__user", "freelancer__user")
                .filter(id=application.id)
                .first()
            )
            response_payload = {
                "application": _serialize_application(application, current_user_id=user_id),
                "project": _serialize_project(project, application.freelancer if is_freelancer_owner else None),
            }
            if conversation_payload:
                response_payload.update(conversation_payload)
            return JsonResponse(response_payload, status=200)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.patch(request, application_id)
        except Exception as error:
            print("Error updating application:", error)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ProjectFavoriteToggleView(View):
    def post(self, request, project_id):
        try:
            data = _parse_json_body(request)
            freelancer_id = _normalize_user_id(data.get("freelancerId"))
            freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()
            if not freelancer_profile:
                return JsonResponse({"error": "Solo los freelancers pueden guardar proyectos"}, status=403)

            project = _base_projects_queryset().filter(id=project_id).first()
            if not project:
                return JsonResponse({"error": "Proyecto no encontrado"}, status=404)

            favorite, created = ProjectFavorite.objects.get_or_create(project=project, freelancer=freelancer_profile)
            if not created:
                favorite.delete()
                is_favorite = False
            else:
                is_favorite = True

            project = _base_projects_queryset().get(id=project.id)
            return JsonResponse(
                {
                    "isFavorite": is_favorite,
                    "project": _serialize_project(project, freelancer_profile),
                },
                status=200,
            )
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.post(request, project_id)
        except Exception as error:
            print("Error toggling favorite:", error)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)
