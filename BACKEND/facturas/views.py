from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from order.models import Order
from payments.models import Payment

from .models import Factura
from .services import ensure_factura_for_payment


class FacturaByOrderPdfView(APIView):
    def get(self, request, order_id):
        payment = Payment.objects.select_related(
            "order__client__user",
            "order__freelancer__user",
            "order__service",
        ).filter(order_id=order_id, status__in=["paid", "released"]).first()

        if not Order.objects.filter(id=order_id).exists():
            return Response({"error": "Orden no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        if not payment:
            return Response({"error": "La orden aun no tiene un pago completado"}, status=status.HTTP_400_BAD_REQUEST)

        factura = ensure_factura_for_payment(payment)
        return _pdf_response(factura)


class FacturaPdfView(APIView):
    def get(self, request, factura_id):
        factura = Factura.objects.select_related(
            "payment__order__client__user",
            "payment__order__freelancer__user",
            "payment__order__service",
        ).filter(id=factura_id).first()

        if not factura:
            return Response({"error": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        return _pdf_response(factura)


def _pdf_response(factura):
    if not factura.pdf_file:
        factura = ensure_factura_for_payment(factura.payment)

    return FileResponse(
        factura.pdf_file.open("rb"),
        content_type="application/pdf",
        as_attachment=True,
        filename=f"{factura.invoice_number}.pdf",
    )
