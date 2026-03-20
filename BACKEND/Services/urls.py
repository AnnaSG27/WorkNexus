from django.urls import path

from .views import *


urlpatterns = [
    path("services/", ServiceListView.as_view()),
]
