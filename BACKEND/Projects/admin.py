from django.contrib import admin

from .models import Project, ProjectApplication, ProjectFavorite


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "client", "category", "budget", "status", "modality", "is_open", "created_at")
    search_fields = ("title", "description", "client__user__username", "client__enterprise_name")
    list_filter = ("category", "status", "modality", "is_open", "created_at")


@admin.register(ProjectApplication)
class ProjectApplicationAdmin(admin.ModelAdmin):
    list_display = ("project", "freelancer", "status", "created_at")
    search_fields = ("project__title", "freelancer__user__username")


@admin.register(ProjectFavorite)
class ProjectFavoriteAdmin(admin.ModelAdmin):
    list_display = ("project", "freelancer", "created_at")
    search_fields = ("project__title", "freelancer__user__username")
