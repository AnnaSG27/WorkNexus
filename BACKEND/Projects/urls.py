from django.urls import path

from .views import (
    ApplyToProjectView,
    ProjectApplicationListView,
    ProjectApplicationUpdateView,
    ProjectDetailUpdateView,
    ProjectFavoriteToggleView,
    ProjectListCreateView,
)


urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="projects-list-create"),
    path("applications/", ProjectApplicationListView.as_view(), name="projects-applications"),
    path("applications/<int:application_id>/", ProjectApplicationUpdateView.as_view(), name="projects-application-update"),
    path("<int:project_id>/", ProjectDetailUpdateView.as_view(), name="projects-update"),
    path("<int:project_id>/apply/", ApplyToProjectView.as_view(), name="projects-apply"),
    path("<int:project_id>/favorite/", ProjectFavoriteToggleView.as_view(), name="projects-favorite"),
]
