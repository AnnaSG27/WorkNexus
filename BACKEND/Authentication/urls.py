from BACKEND.WorkNexus.urls import urlpatterns
from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view),
]