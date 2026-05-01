import json

from django.core.management import call_command
from django.db import DatabaseError, IntegrityError, OperationalError, ProgrammingError
from django.db.models import Q
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt

from Authentication.models import ClientProfile, FreelancerProfile
from Reviews.models import Review
from Services.models import Service

from .models import Order
from .services import apply_order_status_transition, create_service_order, normalize_budget
from payments.models import Payment


def _parse_json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body)


def _normalize_user_id(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _ensure_order_schema():
    call_command("migrate", "order", interactive=False, verbosity=0)
    call_command("migrate", "Reviews", interactive=False, verbosity=0)


def _user_display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _serialize_order(order):
    client_user = order.client.user
    freelancer_user = order.freelancer.user
    review = Review.objects.filter(project=order.project).first() if order.project_id else None

    return {
        "id": order.id,
        "title": order.title,
        "description": order.description,
        "sourceType": order.source_type,
        "status": order.status,
        "payment": (
            {
                "status": Payment.objects.filter(order=order).first().status
            }
            if Payment.objects.filter(order=order).exists()
            else None
        ),
        "agreedBudget": float(order.agreed_budget) if order.agreed_budget is not None else None,
        "startedAt": order.started_at.isoformat() if order.started_at else None,
        "completedAt": order.completed_at.isoformat() if order.completed_at else None,
        "createdAt": order.created_at.isoformat(),
        "updatedAt": order.updated_at.isoformat(),
        "client": {
            "id": client_user.id,
            "username": client_user.username,
            "displayName": _user_display_name(client_user),
            "enterpriseName": order.client.enterprise_name,
        },
        "freelancer": {
            "id": freelancer_user.id,
            "username": freelancer_user.username,
            "displayName": _user_display_name(freelancer_user),
            "bio": order.freelancer.bio,
        },
        "service": (
            {
                "id": order.service.id,
                "title": order.service.title,
                "category": order.service.category,
            }
            if order.service
            else None
        ),
        "project": (
            {
                "id": order.project.id,
                "title": order.project.title,
                "status": order.project.status,
            }
            if order.project
            else None
        ),
        "projectReview": (
            {
                "id": review.id,
                "rating": review.rating,
                "comment": review.comment,
                "createdAt": review.created_at.isoformat(),
            }
            if review
            else None
        ),
        "application": (
            {
                "id": order.application.id,
                "status": order.application.status,
                "proposedBudget": (
                    float(order.application.proposed_budget)
                    if order.application.proposed_budget is not None
                    else None
                ),
            }
            if order.application
            else None
        ),
    }


def _orders_queryset():
    return Order.objects.select_related(
        "client__user",
        "freelancer__user",
        "service",
        "project",
        "application",
    )


def _build_summary(orders):
    items = list(orders)
    return {
        "total": len(items),
        "pending": sum(1 for item in items if item.status == "sin_iniciar"),
        "inProgress": sum(1 for item in items if item.status == "en_proceso"),
        "completed": sum(1 for item in items if item.status == "terminado"),
        "cancelled": sum(1 for item in items if item.status == "cancelado"),
    }


class OrderListCreateView(APIView):
    def _get_orders_response(self, request):
        user_id = request.query_params.get("user_id")
        role = request.query_params.get("role")
        status_param = request.query_params.get("status")
        source_type = request.query_params.get("source_type")

        orders = _orders_queryset()

        if user_id and role == "cliente":
            orders = orders.filter(client__user_id=user_id)
        elif user_id and role == "freelancer":
            orders = orders.filter(freelancer__user_id=user_id)
        elif user_id:
            orders = orders.filter(Q(client__user_id=user_id) | Q(freelancer__user_id=user_id))

        if status_param:
            orders = orders.filter(status=status_param)
        if source_type:
            orders = orders.filter(source_type=source_type)

        orders = orders.order_by("-created_at").distinct()
        return Response(
            {
                "orders": [_serialize_order(order) for order in orders],
                "summary": _build_summary(orders),
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        try:
            return self._get_orders_response(request)
        except (OperationalError, ProgrammingError):
            _ensure_order_schema()
            return self._get_orders_response(request)

    def _create_order_response(self, request):
        data = request.data
        client_id = _normalize_user_id(data.get("clientId"))
        service_id = data.get("serviceId")
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        status_param = data.get("status") or "sin_iniciar"

        client_profile = ClientProfile.objects.filter(user_id=client_id).first()
        if not client_profile:
            return Response({"error": "Solo los clientes pueden crear contrataciones"}, status=status.HTTP_403_FORBIDDEN)

        service = Service.objects.select_related("freelancer__user").filter(id=service_id).first()
        if not service:
            return Response({"error": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if not title:
            title = service.title

        valid_statuses = {choice[0] for choice in Order.STATUS_CHOICES}
        if status_param not in valid_statuses:
            return Response({"error": "Estado de contratacion no valido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            agreed_budget = normalize_budget(data.get("agreedBudget"))
            order = create_service_order(
                client_profile=client_profile,
                service=service,
                title=title,
                description=description,
                agreed_budget=agreed_budget,
            )
            if status_param != "sin_iniciar":
                order = apply_order_status_transition(order, status_param)
        except ValueError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        order = _orders_queryset().get(id=order.id)
        return Response({"order": _serialize_order(order)}, status=status.HTTP_201_CREATED)

    def post(self, request):
        try:
            return self._create_order_response(request)
        except (OperationalError, ProgrammingError):
            _ensure_order_schema()
            return self._create_order_response(request)
        except DatabaseError:
            return JsonResponse({"error": "No se pudo guardar la contratacion en la base de datos"}, status=500)
        except Exception as error:
            print("Error creating order:", error)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)


class OrderDetailUpdateView(APIView):
    def _get_order(self, order_id):
        return _orders_queryset().filter(id=order_id).first()

    def get(self, request, order_id):
        try:
            order = self._get_order(order_id)
            if not order:
                return Response({"error": "Contratacion no encontrada"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"order": _serialize_order(order)}, status=status.HTTP_200_OK)
        except (OperationalError, ProgrammingError):
            _ensure_order_schema()
            return self.get(request, order_id)

    def patch(self, request, order_id):
        try:
            data = request.data
            user_id = _normalize_user_id(data.get("userId"))
            new_status = data.get("status")
            description = data.get("description")
            title = data.get("title")

            order = self._get_order(order_id)
            if not order:
                return Response({"error": "Contratacion no encontrada"}, status=status.HTTP_404_NOT_FOUND)

            if user_id not in {order.client.user_id, order.freelancer.user_id}:
                return Response({"error": "No tienes permisos para actualizar esta contratacion"}, status=status.HTTP_403_FORBIDDEN)

            changed_fields = []
            if title is not None:
                normalized_title = title.strip()
                if not normalized_title:
                    return Response({"error": "El titulo no puede estar vacio"}, status=status.HTTP_400_BAD_REQUEST)
                order.title = normalized_title
                changed_fields.append("title")

            if description is not None:
                order.description = description.strip()
                changed_fields.append("description")

            if "agreedBudget" in data:
                try:
                    order.agreed_budget = normalize_budget(data.get("agreedBudget"))
                    changed_fields.append("agreed_budget")
                except ValueError as error:
                    return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)

            if changed_fields:
                changed_fields.append("updated_at")
                order.save(update_fields=changed_fields)

            if new_status is not None:
                valid_statuses = {choice[0] for choice in Order.STATUS_CHOICES}
                if new_status not in valid_statuses:
                    return Response({"error": "Estado de contratacion no valido"}, status=status.HTTP_400_BAD_REQUEST)
                
                if new_status == "terminado":
                    payment = Payment.objects.filter(order=order).first()
                    if not payment or payment.status != "paid":
                        return Response(
                            {"error": "No se puede finalizar una orden sin haber sido pagada"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                order = apply_order_status_transition(order, new_status)
                
                if new_status == "terminado":
                    payment = Payment.objects.filter(order=order).first()
                    if payment and payment.status == "paid":
                        payment.status = "released"
                        payment.save()

            order = self._get_order(order_id)
            return Response({"order": _serialize_order(order)}, status=status.HTTP_200_OK)
        except (OperationalError, ProgrammingError):
            _ensure_order_schema()
            return self.patch(request, order_id)
        except Exception as error:
            print("Error updating order:", error)
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
