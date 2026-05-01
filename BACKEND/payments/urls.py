from django.urls import path
from .views import CreatePaymentIntentView, ConfirmPaymentIntentView

urlpatterns = [
    path("create/", CreatePaymentIntentView.as_view()),
    path("complete/", ConfirmPaymentIntentView.as_view()),
]