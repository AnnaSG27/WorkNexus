from decimal import Decimal, InvalidOperation

from django.db import IntegrityError
from django.utils import timezone

from .models import Order


def normalize_budget(value):
    if value in (None, ""):
        return None

    try:
        budget = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("El presupuesto debe ser un numero valido")

    if budget <= 0:
        raise ValueError("El presupuesto debe ser mayor a 0")

    return budget


def ensure_project_application_order(application):
    project = application.project
    default_budget = application.proposed_budget if application.proposed_budget is not None else project.budget

    order, created = Order.objects.get_or_create(
        application=application,
        defaults={
            "client": project.client,
            "freelancer": application.freelancer,
            "source_type": "project",
            "project": project,
            "title": project.title,
            "description": project.description,
            "agreed_budget": default_budget,
            "status": "sin_iniciar",
        },
    )

    if not created:
        changed_fields = []
        if order.project_id != project.id:
            order.project = project
            changed_fields.append("project")
        if order.client_id != project.client_id:
            order.client = project.client
            changed_fields.append("client")
        if order.freelancer_id != application.freelancer_id:
            order.freelancer = application.freelancer
            changed_fields.append("freelancer")
        if order.source_type != "project":
            order.source_type = "project"
            changed_fields.append("source_type")
        if changed_fields:
            order.save(update_fields=changed_fields)

    return order


def create_service_order(*, client_profile, service, title, description="", agreed_budget=None):
    if service.freelancer.user_id == client_profile.user_id:
        raise ValueError("No puedes contratar tu propio servicio")

    active_order_exists = Order.objects.filter(
        client=client_profile,
        service=service,
        source_type="service",
        status__in=["sin_iniciar", "en_proceso"],
    ).exists()
    if active_order_exists:
        raise IntegrityError("Ya tienes una contratacion activa para este servicio")

    return Order.objects.create(
        client=client_profile,
        freelancer=service.freelancer,
        source_type="service",
        service=service,
        title=title,
        description=description,
        agreed_budget=agreed_budget,
        status="sin_iniciar",
    )


def apply_order_status_transition(order, new_status):
    order.status = new_status
    changed_fields = ["status", "updated_at"]

    if new_status == "en_proceso" and order.started_at is None:
        order.started_at = timezone.now()
        changed_fields.append("started_at")

    if new_status == "terminado":
        if order.started_at is None:
            order.started_at = timezone.now()
            changed_fields.append("started_at")
        order.completed_at = timezone.now()
        changed_fields.append("completed_at")

    if new_status in {"sin_iniciar", "cancelado"} and order.completed_at is not None:
        order.completed_at = None
        changed_fields.append("completed_at")

    order.save(update_fields=changed_fields)

    if order.project:
        project_status_map = {
            "sin_iniciar": ("en_revision", True),
            "en_proceso": ("en_ejecucion", False),
            "terminado": ("finalizado", False),
            "cancelado": ("cerrado", False),
        }
        project_status, is_open = project_status_map[new_status]
        order.project.status = project_status
        order.project.is_open = is_open
        order.project.save(update_fields=["status", "is_open"])

    return order
