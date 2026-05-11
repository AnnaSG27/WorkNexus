from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from .models import Factura


PAYMENT_METHOD_LABELS = {
    "stripe": "Stripe",
    "wallet": "Billetera",
}


def ensure_factura_for_payment(payment):
    if payment.status not in {"paid", "released"}:
        raise ValueError("Solo se pueden generar facturas para pagos completados")

    with transaction.atomic():
        factura, created = Factura.objects.select_for_update().get_or_create(
            payment=payment,
            defaults={"invoice_number": _build_invoice_number(payment)},
        )
        if created or not factura.pdf_file:
            _save_factura_pdf(factura)
        return factura


def regenerate_factura_pdf(factura):
    _save_factura_pdf(factura)
    return factura


def _build_invoice_number(payment):
    today = timezone.localdate().strftime("%Y%m%d")
    return f"FAC-{today}-{payment.id:06d}"


def _save_factura_pdf(factura):
    pdf_bytes = _render_factura_pdf(factura)
    filename = f"{factura.invoice_number}.pdf"
    target_name = f"facturas/{filename}"
    if factura.pdf_file:
        factura.pdf_file.delete(save=False)
    if default_storage.exists(target_name):
        default_storage.delete(target_name)
    factura.pdf_file.save(filename, ContentFile(pdf_bytes), save=True)


def _render_factura_pdf(factura):
    from io import BytesIO

    payment = factura.payment
    order = payment.order
    service_name = order.service.title if order.service else order.title
    method_label = PAYMENT_METHOD_LABELS.get(payment.method, payment.method)
    amount = _format_money(payment.amount, payment.currency)
    client_name = _display_name(order.client.user)
    freelancer_name = _display_name(order.freelancer.user)

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    margin = 46
    dark = colors.HexColor("#0F172A")
    brand = colors.HexColor("#0EA5C6")
    brand_dark = colors.HexColor("#036985")
    soft = colors.HexColor("#F3F8FA")
    border = colors.HexColor("#D8E7ED")
    muted = colors.HexColor("#64748B")
    text = colors.HexColor("#111827")

    pdf.setTitle(f"Factura {factura.invoice_number}")
    pdf.setAuthor("WorkNexus")

    pdf.setFillColor(dark)
    pdf.rect(0, height - 172, width, 172, stroke=0, fill=1)
    pdf.setFillColor(brand)
    pdf.rect(0, height - 172, width, 7, stroke=0, fill=1)

    logo_path = Path(settings.BASE_DIR) / "facturas" / "static" / "facturas" / "Logo_WorkNexus.png"
    if logo_path.exists():
        pdf.setFillColor(colors.white)
        pdf.roundRect(margin - 8, height - 126, 198, 88, 8, stroke=0, fill=1)
        pdf.drawImage(str(logo_path), margin + 2, height - 119, width=176, height=72, preserveAspectRatio=True, mask="auto")
    else:
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 25)
        pdf.drawString(margin, height - 74, "WORKNEXUS")

    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 25)
    pdf.drawRightString(width - margin, height - 65, "Factura")
    pdf.setFont("Helvetica", 10)
    pdf.setFillColor(colors.HexColor("#CFEFF7"))
    pdf.drawRightString(width - margin, height - 84, factura.invoice_number)
    pdf.drawRightString(width - margin, height - 101, timezone.localtime(factura.created_at).strftime("%Y-%m-%d %H:%M"))
    pdf.setFont("Helvetica-Bold", 9)
    pdf.setFillColor(colors.white)
    pdf.roundRect(width - margin - 122, height - 134, 122, 24, 12, stroke=0, fill=1)
    pdf.setFillColor(brand_dark)
    pdf.drawCentredString(width - margin - 61, height - 126, "PAGO CONFIRMADO")

    card_top = height - 202
    card_height = 106
    gap = 18
    card_width = (width - (margin * 2) - gap) / 2
    _info_card(
        pdf,
        x=margin,
        y=card_top - card_height,
        w=card_width,
        h=card_height,
        title="Facturado a",
        lines=[
            ("Cliente", client_name),
            ("Empresa", order.client.enterprise_name or "No registrada"),
        ],
        border=border,
        soft=soft,
        text=text,
        muted=muted,
        brand=brand,
    )
    _info_card(
        pdf,
        x=margin + card_width + gap,
        y=card_top - card_height,
        w=card_width,
        h=card_height,
        title="Trabajo",
        lines=[
            ("Profesional", freelancer_name),
            ("Orden", f"#{order.id}"),
            ("Tipo", order.get_source_type_display()),
        ],
        border=border,
        soft=soft,
        text=text,
        muted=muted,
        brand=brand,
    )

    table_y = card_top - card_height - 46
    table_w = width - (margin * 2)
    pdf.setFillColor(text)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(margin, table_y + 24, "Detalle del servicio")

    header_h = 34
    row_h = 54
    pdf.setFillColor(brand_dark)
    pdf.roundRect(margin, table_y - header_h, table_w, header_h, 8, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(margin + 18, table_y - 21, "SERVICIO")
    pdf.drawString(margin + table_w - 218, table_y - 21, "METODO")
    pdf.drawRightString(margin + table_w - 18, table_y - 21, "VALOR")

    pdf.setFillColor(colors.white)
    pdf.roundRect(margin, table_y - header_h - row_h, table_w, row_h, 8, stroke=1, fill=1)
    pdf.setStrokeColor(border)
    pdf.line(margin, table_y - header_h, margin + table_w, table_y - header_h)
    pdf.setFillColor(text)
    pdf.setFont("Helvetica-Bold", 10)
    _draw_wrapped_text(pdf, service_name, margin + 18, table_y - header_h - 21, max_width=table_w - 270)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(margin + table_w - 218, table_y - header_h - 22, method_label)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawRightString(margin + table_w - 18, table_y - header_h - 22, amount)

    summary_y = table_y - header_h - row_h - 64
    summary_w = 220
    summary_x = width - margin - summary_w
    pdf.setFillColor(soft)
    pdf.roundRect(summary_x, summary_y - 76, summary_w, 96, 8, stroke=0, fill=1)
    _summary_line(pdf, "Subtotal", amount, summary_x + 18, summary_y - 8, summary_w - 36, muted, text)
    _summary_line(pdf, "Impuestos", "Incluidos", summary_x + 18, summary_y - 30, summary_w - 36, muted, text)
    pdf.setStrokeColor(border)
    pdf.line(summary_x + 18, summary_y - 43, summary_x + summary_w - 18, summary_y - 43)
    _summary_line(pdf, "Total pagado", amount, summary_x + 18, summary_y - 63, summary_w - 36, text, brand_dark, bold=True)

    reference_y = summary_y - 112
    pdf.setFillColor(colors.HexColor("#F8FAFC"))
    pdf.roundRect(margin, reference_y, table_w, 58, 8, stroke=0, fill=1)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.setFillColor(muted)
    pdf.drawString(margin + 18, reference_y + 35, "REFERENCIA DE PAGO")
    pdf.setFont("Helvetica", 10)
    pdf.setFillColor(text)
    pdf.drawString(margin + 18, reference_y + 17, payment.processor_reference or f"Pago #{payment.id}")

    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 9)
    pdf.drawString(margin, 54, "WorkNexus - Factura generada automaticamente por pago de servicio.")
    pdf.setFillColor(brand)
    pdf.rect(0, 32, width, 5, stroke=0, fill=1)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def _section_title(pdf, text, x, y):
    pdf.setFillColor(colors.HexColor("#111827"))
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(x, y, text)


def _line(pdf, label, value, x, y, bold_value=False):
    pdf.setFillColor(colors.HexColor("#4B5563"))
    pdf.setFont("Helvetica", 10)
    pdf.drawString(x, y, f"{label}:")
    pdf.setFillColor(colors.HexColor("#111827"))
    pdf.setFont("Helvetica-Bold" if bold_value else "Helvetica", 10)
    pdf.drawString(x + 110, y, str(value))


def _info_card(pdf, x, y, w, h, title, lines, border, soft, text, muted, brand):
    pdf.setFillColor(soft)
    pdf.roundRect(x, y, w, h, 8, stroke=0, fill=1)
    pdf.setStrokeColor(border)
    pdf.roundRect(x, y, w, h, 8, stroke=1, fill=0)
    pdf.setFillColor(brand)
    pdf.roundRect(x, y + h - 6, w, 6, 3, stroke=0, fill=1)
    pdf.setFillColor(text)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x + 16, y + h - 28, title)

    current_y = y + h - 52
    for label, value in lines:
        pdf.setFillColor(muted)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(x + 16, current_y, label.upper())
        pdf.setFillColor(text)
        pdf.setFont("Helvetica-Bold", 9)
        _draw_wrapped_text(pdf, str(value), x + 86, current_y, max_width=w - 104, line_height=10, max_lines=2)
        current_y -= 21


def _summary_line(pdf, label, value, x, y, w, label_color, value_color, bold=False):
    pdf.setFillColor(label_color)
    pdf.setFont("Helvetica-Bold" if bold else "Helvetica", 10)
    pdf.drawString(x, y, label)
    pdf.setFillColor(value_color)
    pdf.setFont("Helvetica-Bold" if bold else "Helvetica", 10)
    pdf.drawRightString(x + w, y, value)


def _draw_wrapped_text(pdf, text, x, y, max_width, line_height=11, max_lines=2):
    words = str(text).split()
    lines = []
    current = ""

    for word in words:
        candidate = f"{current} {word}".strip()
        if pdf.stringWidth(candidate, pdf._fontname, pdf._fontsize) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
            if len(lines) == max_lines:
                break

    if current and len(lines) < max_lines:
        lines.append(current)

    for index, line in enumerate(lines[:max_lines]):
        if index == max_lines - 1 and len(lines) == max_lines and words and line != " ".join(words):
            while pdf.stringWidth(f"{line}...", pdf._fontname, pdf._fontsize) > max_width and len(line) > 3:
                line = line[:-1]
            line = f"{line}..."
        pdf.drawString(x, y - (index * line_height), line)


def _display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _format_money(amount, currency):
    currency_label = (currency or "COP").upper()
    value = Decimal(amount).quantize(Decimal("0.01"))
    return f"{currency_label} {value:,.2f}"
