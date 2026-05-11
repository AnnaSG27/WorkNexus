from django.db import models


class Factura(models.Model):
    payment = models.OneToOneField(
        "payments.Payment",
        on_delete=models.CASCADE,
        related_name="factura",
    )
    invoice_number = models.CharField(max_length=40, unique=True)
    pdf_file = models.FileField(upload_to="facturas/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.invoice_number
