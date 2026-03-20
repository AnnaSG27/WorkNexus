from django.urls import path

from .views import FreelancerListView


urlpatterns = [
    path("freelancers/", FreelancerListView.as_view(), name="freelancers"),
]
