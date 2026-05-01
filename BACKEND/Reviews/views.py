import json

from django.db import DatabaseError, OperationalError, ProgrammingError
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from Authentication.models import ClientProfile, FreelancerProfile
from Projects.models import ProjectApplication

from .models import Review
from .services import ensure_reviews_schema, get_freelancer_review_stats

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


def _parse_json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body)


def _normalize_user_id(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _user_display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def serialize_review(review):
    return {
        "id": review.id,
        "projectId": review.project_id,
        "projectTitle": review.project.title,
        "rating": review.rating,
        "comment": review.comment,
        "createdAt": review.created_at.isoformat(),
        "updatedAt": review.updated_at.isoformat(),
        "client": {
            "id": review.client.user_id,
            "username": review.client.user.username,
            "displayName": _user_display_name(review.client.user),
        },
        "freelancer": {
            "id": review.freelancer.user_id,
            "username": review.freelancer.user.username,
            "displayName": _user_display_name(review.freelancer.user),
        },
    }


class ReviewListCreateView(APIView):
    def get(self, request):
        try:
            freelancer_id = request.query_params.get("freelancer_id")
            freelancer_profile = FreelancerProfile.objects.filter(user_id=freelancer_id).first()
            if not freelancer_profile:
                return Response({"error": "Freelancer no encontrado"}, status=status.HTTP_404_NOT_FOUND)

            reviews = (
                Review.objects.filter(freelancer=freelancer_profile)
                .select_related("project", "client__user", "freelancer__user")
                .order_by("-created_at")
            )
            stats = get_freelancer_review_stats(freelancer_profile)
            return Response(
                {
                    "reviews": [serialize_review(review) for review in reviews],
                    "summary": stats,
                },
                status=status.HTTP_200_OK,
            )
        except (OperationalError, ProgrammingError):
            ensure_reviews_schema()
            return self.get(request)

    def post(self, request):
        try:
            data = request.data
            client_id = _normalize_user_id(data.get("clientId"))
            project_id = _normalize_user_id(data.get("projectId"))
            rating = data.get("rating")
            comment = (data.get("comment") or "").strip()

            client_profile = ClientProfile.objects.filter(user_id=client_id).first()
            if not client_profile:
                return Response({"error": "Solo un cliente puede registrar una reseña"}, status=status.HTTP_403_FORBIDDEN)

            application = (
                ProjectApplication.objects.select_related("project__client__user", "freelancer__user")
                .filter(project_id=project_id, status="aceptada")
                .first()
            )
            if not application:
                return Response({"error": "El proyecto no tiene un freelancer asignado"}, status=status.HTTP_400_BAD_REQUEST)

            project = application.project
            if project.client_id != client_profile.id:
                return Response({"error": "Solo el cliente propietario puede reseñar este proyecto"}, status=status.HTTP_403_FORBIDDEN)
            if project.status != "finalizado":
                return Response({"error": "Solo puedes reseñar proyectos finalizados"}, status=status.HTTP_400_BAD_REQUEST)
            if Review.objects.filter(project=project).exists():
                return Response({"error": "Este proyecto ya tiene una reseña registrada"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                normalized_rating = int(rating)
            except (TypeError, ValueError):
                return Response({"error": "La calificacion debe ser un numero entero"}, status=status.HTTP_400_BAD_REQUEST)

            if normalized_rating < 1 or normalized_rating > 5:
                return Response({"error": "La calificacion debe estar entre 1 y 5 estrellas"}, status=status.HTTP_400_BAD_REQUEST)

            review = Review.objects.create(
                project=project,
                client=client_profile,
                freelancer=application.freelancer,
                rating=normalized_rating,
                comment=comment,
            )
            stats = get_freelancer_review_stats(application.freelancer)
            return Response(
                {
                    "review": serialize_review(
                        Review.objects.select_related("project", "client__user", "freelancer__user").get(id=review.id)
                    ),
                    "summary": stats,
                },
                status=status.HTTP_201_CREATED,
            )
        except (OperationalError, ProgrammingError):
            ensure_reviews_schema()
            return self.post(request)
        except DatabaseError:
            return Response({"error": "No se pudo guardar la reseña en la base de datos"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as error:
            print("Error creating review:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
