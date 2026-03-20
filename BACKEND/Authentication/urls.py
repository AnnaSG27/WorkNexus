from django.urls import path
from . import views

urlpatterns = [
    #path("login/", views.login_view),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("freelancers/", views.FreelancerListView.as_view(), name="freelancers"),
]
