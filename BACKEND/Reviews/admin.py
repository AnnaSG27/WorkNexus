from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "freelancer", "client", "rating", "created_at")
    search_fields = ("project__title", "freelancer__user__username", "client__user__username")
    list_filter = ("rating", "created_at")

