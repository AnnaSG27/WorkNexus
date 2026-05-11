from django.contrib import admin

from .models import Factura


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "payment", "created_at")
    search_fields = ("invoice_number", "payment__order__title")
    readonly_fields = ("created_at",)
