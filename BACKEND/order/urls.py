from django.urls import path

from .views import OrderDetailUpdateView, OrderListCreateView


urlpatterns = [
    path("", OrderListCreateView.as_view(), name="orders-list-create"),
    path("<int:order_id>/", OrderDetailUpdateView.as_view(), name="orders-detail-update"),
]
