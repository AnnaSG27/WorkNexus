from django.urls import path

from .views import *


urlpatterns = [
    path("services/", ServiceListView.as_view()),
    path("category-count/", CategoryCountView.as_view(), name="category-count"),
]
