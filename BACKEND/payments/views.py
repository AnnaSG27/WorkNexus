import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from order.models import Order
from .models import Payment
from .serializers import CreatePaymentSerializer, ConfirmPaymentSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreatePaymentIntentView(APIView):
    def post(self, request):
        try:
            
            serializer = CreatePaymentSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            order_id = serializer.validated_data["order_id"]
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
                amount = int(float(order.agreed_budget) * 100)

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
                return Response({"error": "Order has no agreed budget"}, status=status.HTTP_400_BAD_REQUEST)

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
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ConfirmPaymentIntentView(APIView):
    def post(self, request):
        try:
            serializer = ConfirmPaymentSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            payment_intent_id = serializer.validated_data["payment_intent_id"]
            
            payment = Payment.objects.get(stripe_payment_intent=payment_intent_id)
            payment.status = "paid"
            payment.save()
            
            order = payment.order
            order.status = "en_proceso"
            order.save()
            
            return Response({"message": "Payment completed successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)