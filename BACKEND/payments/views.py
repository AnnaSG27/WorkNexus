import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from order.models import Order
from .models import Payment

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreatePaymentIntentView(APIView):
    def post(self, request):
        try:
            
            order_id = request.data.get("order_id")

            order = Order.objects.get(id=order_id)
            print("AGREED BUDGET:", order.agreed_budget)
            
            existing_payment = Payment.objects.filter(order=order).first()

            # If a payment already exists, reuse or complete it
            if existing_payment:
                # If it already has a client_secret, return it
                if existing_payment.stripe_client_secret:
                    return Response({
                        "client_secret": existing_payment.stripe_client_secret
                    })

                # Otherwise, create the Stripe intent and update the existing payment
                amount = int(float(order.agreed_budget))

                intent = stripe.PaymentIntent.create(
                    amount=amount,
                    currency="cop",
                    metadata={
                        "order_id": order.id
                    }
                )

                existing_payment.stripe_payment_intent = intent.id
                existing_payment.stripe_client_secret = intent.client_secret
                existing_payment.save()

                return Response({
                    "client_secret": intent.client_secret
                })

            if not order.agreed_budget:
                return Response({"error": "Order has no agreed budget"}, status=400)

            amount = int(float(order.agreed_budget) * 100)

            payment = Payment.objects.create(
                order=order,
                amount=order.agreed_budget,
                status="pending"
            )

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency="cop",
                metadata={
                    "order_id": order.id
                }
            )

            payment.stripe_payment_intent = intent.id
            payment.stripe_client_secret = intent.client_secret
            payment.save()

            
            return Response({
                "client_secret": intent.client_secret
            })

        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class ConfirmPaymentIntentView(APIView):
    def post(self, request):
        try:
            payment_intent_id = request.data.get("payment_intent_id")
            
            if not payment_intent_id:
                return Response({"error": "Payment intent ID is required"}, status=400)
            payment = Payment.objects.get(stripe_payment_intent=payment_intent_id)
            payment.status = "paid"
            payment.save()
            
            order = payment.order
            order.status = "en_proceso"
            order.save()
            
            return Response({"message": "Payment completed successfully"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)