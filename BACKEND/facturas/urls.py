from django.urls import path

from .views import FacturaByOrderPdfView, FacturaPdfView


urlpatterns = [
    path("<int:factura_id>/pdf/", FacturaPdfView.as_view(), name="factura-pdf"),
    path("orders/<int:order_id>/pdf/", FacturaByOrderPdfView.as_view(), name="factura-order-pdf"),
]
