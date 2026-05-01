import json
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import DatabaseError, OperationalError, ProgrammingError
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from Authentication.models import ClientProfile, FreelancerProfile
from Messaging.models import Conversation, Message
from Reviews.models import Review
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
    call_command("migrate", "Reviews", interactive=False, verbosity=0)


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
    accepted_application = next((application for application in applications if application.status == "aceptada"), None)
    review = Review.objects.select_related("client__user", "freelancer__user").filter(project=project).first()

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
        "assignedFreelancer": {
            "id": accepted_application.freelancer.user.id,
            "profileId": accepted_application.freelancer.id,
            "name": accepted_application.freelancer.user.username,
            "displayName": _user_display_name(accepted_application.freelancer.user),
        } if accepted_application else None,
        "review": {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "createdAt": review.created_at.isoformat(),
        } if review else None,
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


class ProjectListCreateView(APIView):
    def _get_projects_response(self, request):
        freelancer_id = request.query_params.get("freelancer_id")
        client_id = request.query_params.get("client_id")
        category = request.query_params.get("category")
        modality = request.query_params.get("modality")
        search = (request.query_params.get("search") or "").strip()
        favorite_only = request.query_params.get("favorite_only") == "true"
        min_budget = request.query_params.get("min_budget")
        max_budget = request.query_params.get("max_budget")
        status_param = request.query_params.get("status")

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
        if status_param:
            projects = projects.filter(status=status_param)
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

        return Response(
            {
                "projects": project_items,
                "favorites": favorite_projects,
                "summary": _project_summary(projects.distinct(), user_type),
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        try:
            return self._get_projects_response(request)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self._get_projects_response(request)

    def _create_project_response(self, request):
        data = request.data
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
            return Response({"error": "Solo los clientes pueden publicar proyectos"}, status=status.HTTP_403_FORBIDDEN)
        if not title or not description or budget in (None, ""):
            return Response({"error": "Titulo, descripcion y presupuesto son obligatorios"}, status=status.HTTP_400_BAD_REQUEST)

        valid_categories = {choice[0] for choice in Project.CATEGORY_CHOICES}
        valid_modalities = {choice[0] for choice in Project.MODALITY_CHOICES}
        if category not in valid_categories:
            return Response({"error": "La categoria seleccionada no es valida"}, status=status.HTTP_400_BAD_REQUEST)
        if modality not in valid_modalities:
            return Response({"error": "La modalidad seleccionada no es valida"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            normalized_budget = Decimal(str(budget))
        except (InvalidOperation, TypeError, ValueError):
            return Response({"error": "El presupuesto debe ser un numero valido"}, status=status.HTTP_400_BAD_REQUEST)
        if normalized_budget <= 0:
            return Response({"error": "El presupuesto debe ser mayor a 0"}, status=status.HTTP_400_BAD_REQUEST)

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
        return Response({"project": _serialize_project(project)}, status=status.HTTP_201_CREATED)

    def post(self, request):
        try:
            return self._create_project_response(request)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self._create_project_response(request)
        except DatabaseError:
            return Response({"error": "No se pudo guardar el proyecto en la base de datos"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as error:
            print("Error creating project:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectDetailUpdateView(APIView):
    def patch(self, request, project_id):
        try:
            data = request.data
            user_id = _normalize_user_id(data.get("userId"))
            new_status = data.get("status")

            project = _base_projects_queryset().filter(id=project_id).first()
            if not project:
                return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            if project.client.user_id != user_id:
                return Response({"error": "Solo el cliente propietario puede actualizar el proyecto"}, status=status.HTTP_403_FORBIDDEN)

            valid_statuses = {choice[0] for choice in Project.STATUS_CHOICES}
            if new_status not in valid_statuses:
                return Response({"error": "Estado de proyecto no valido"}, status=status.HTTP_400_BAD_REQUEST)

            if new_status == "finalizado":
                accepted_application_exists = ProjectApplication.objects.filter(
                    project=project,
                    status="aceptada",
                ).exists()
                if not accepted_application_exists:
                    return Response(
                        {"error": "Debes aceptar un freelancer antes de finalizar y calificar el proyecto"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            project.status = new_status
            project.is_open = new_status in {"abierto", "en_revision"}
            project.save(update_fields=["status", "is_open"])
            project = _base_projects_queryset().get(id=project.id)

            return Response({"project": _serialize_project(project)}, status=status.HTTP_200_OK)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.patch(request, project_id)
        except Exception as error:
            print("Error updating project:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, project_id):
        try:
            data = request.data
            user_id = _normalize_user_id(data.get("userId"))

            project = Project.objects.select_related("client__user").filter(id=project_id).first()
            if not project:
                return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            if project.client.user_id != user_id:
                return Response({"error": "Solo el cliente propietario puede eliminar el proyecto"}, status=status.HTTP_403_FORBIDDEN)

            project.delete()
            return Response({"message": "Proyecto eliminado correctamente"}, status=status.HTTP_200_OK)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.delete(request, project_id)
        except Exception as error:
            print("Error deleting project:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectApplicationListView(APIView):
    def get(self, request):
        try:
            freelancer_id = request.query_params.get("freelancer_id")
            freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()
            if not freelancer_profile:
                return Response({"error": "Freelancer no encontrado"}, status=status.HTTP_404_NOT_FOUND)

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
            return Response({"applications": payload, "summary": summary}, status=status.HTTP_200_OK)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.get(request)


class ApplyToProjectView(APIView):
    def _apply_to_project_response(self, request, project_id):
        data = request.data
        freelancer_id = _normalize_user_id(data.get("freelancerId"))
        cover_letter = (data.get("coverLetter") or "").strip()
        proposed_budget = data.get("proposedBudget")

        freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()
        if not freelancer_profile:
            return Response({"error": "Solo los freelancers pueden aplicar a proyectos"}, status=status.HTTP_403_FORBIDDEN)

        project = _base_projects_queryset().filter(id=project_id, is_open=True).first()
        if not project:
            return Response({"error": "Proyecto no encontrado o cerrado"}, status=status.HTTP_404_NOT_FOUND)
        if project.client.user_id == freelancer_id:
            return Response({"error": "No puedes aplicar a tu propio proyecto"}, status=status.HTTP_400_BAD_REQUEST)

        if project.status not in {"abierto", "en_revision"}:
            return Response({"error": "Este proyecto ya no recibe postulaciones"}, status=status.HTTP_400_BAD_REQUEST)

        normalized_budget = None
        if proposed_budget not in (None, ""):
            try:
                normalized_budget = Decimal(str(proposed_budget))
            except (InvalidOperation, TypeError, ValueError):
                return Response({"error": "La propuesta economica no es valida"}, status=status.HTTP_400_BAD_REQUEST)

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
            return Response({"error": "Ya aplicaste a este proyecto"}, status=status.HTTP_400_BAD_REQUEST)

        if not created and application.status == "retirada":
            application.cover_letter = cover_letter
            application.proposed_budget = normalized_budget
            application.status = "pendiente"
            application.save(update_fields=["cover_letter", "proposed_budget", "status"])

        project = _base_projects_queryset().get(id=project.id)
        return Response(
            {
                "message": "Aplicacion enviada correctamente",
                "application": _serialize_application(application, current_user_id=freelancer_id),
                "project": _serialize_project(project, freelancer_profile),
            },
            status=status.HTTP_201_CREATED,
        )

    def post(self, request, project_id):
        try:
            return self._apply_to_project_response(request, project_id)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self._apply_to_project_response(request, project_id)
        except DatabaseError:
            return Response({"error": "No se pudo guardar la aplicacion en la base de datos"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as error:
            print("Error applying to project:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectApplicationUpdateView(APIView):
    def patch(self, request, application_id):
        try:
            data = request.data
            user_id = _normalize_user_id(data.get("userId"))
            new_status = data.get("status")

            application = (
                ProjectApplication.objects.select_related("project__client__user", "freelancer__user")
                .filter(id=application_id)
                .first()
            )
            if not application:
                return Response({"error": "Postulacion no encontrada"}, status=status.HTTP_404_NOT_FOUND)

            valid_statuses = {choice[0] for choice in ProjectApplication.STATUS_CHOICES}
            if new_status not in valid_statuses:
                return Response({"error": "Estado de postulacion no valido"}, status=status.HTTP_400_BAD_REQUEST)

            is_client_owner = application.project.client.user_id == user_id
            is_freelancer_owner = application.freelancer.user_id == user_id

            if new_status == "retirada":
                if not is_freelancer_owner:
                    return Response({"error": "Solo el freelancer puede retirar su postulacion"}, status=status.HTTP_403_FORBIDDEN)
            else:
                if not is_client_owner:
                    return Response({"error": "Solo el cliente puede actualizar esta postulacion"}, status=status.HTTP_403_FORBIDDEN)

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
            return Response(response_payload, status=status.HTTP_200_OK)
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.patch(request, application_id)
        except Exception as error:
            print("Error updating application:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectFavoriteToggleView(APIView):
    def post(self, request, project_id):
        try:
            data = request.data
            freelancer_id = _normalize_user_id(data.get("freelancerId"))
            freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()
            if not freelancer_profile:
                return Response({"error": "Solo los freelancers pueden guardar proyectos"}, status=status.HTTP_403_FORBIDDEN)

            project = _base_projects_queryset().filter(id=project_id).first()
            if not project:
                return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

            favorite, created = ProjectFavorite.objects.get_or_create(project=project, freelancer=freelancer_profile)
            if not created:
                favorite.delete()
                is_favorite = False
            else:
                is_favorite = True

            project = _base_projects_queryset().get(id=project.id)
            return Response(
                {
                    "isFavorite": is_favorite,
                    "project": _serialize_project(project, freelancer_profile),
                },
                status=status.HTTP_200_OK,
            )
        except (OperationalError, ProgrammingError):
            _ensure_projects_schema()
            return self.post(request, project_id)
        except Exception as error:
            print("Error toggling favorite:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
