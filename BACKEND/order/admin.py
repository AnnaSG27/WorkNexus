from django.contrib import admin

from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "source_type", "status", "client", "freelancer", "created_at")
    list_filter = ("source_type", "status", "created_at")
    search_fields = ("title", "client__user__username", "freelancer__user__username")
