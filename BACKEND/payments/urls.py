from django.urls import path
from .views import (
    CancelPaymentIntentView,
    CancelWalletTopUpView,
    ConfirmPaymentIntentView,
    ConfirmWalletTopUpView,
    CreatePaymentIntentView,
    CreateWalletTopUpView,
)

urlpatterns = [
    path("create/", CreatePaymentIntentView.as_view()),
    path("complete/", ConfirmPaymentIntentView.as_view()),
    path("cancel/", CancelPaymentIntentView.as_view()),
    path("wallet/topups/create/", CreateWalletTopUpView.as_view()),
    path("wallet/topups/complete/", ConfirmWalletTopUpView.as_view()),
    path("wallet/topups/cancel/", CancelWalletTopUpView.as_view()),
]
