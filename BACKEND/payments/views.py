from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from order.models import Order
from .models import Payment, WalletTopUp
from .processors import PaymentProcessingError, get_payment_processor
from .serializers import (
    CancelPaymentSerializer,
    CancelWalletTopUpSerializer,
    ConfirmWalletTopUpSerializer,
    CreatePaymentSerializer,
    CreateWalletTopUpSerializer,
    ConfirmPaymentSerializer,
)
from .wallet_topup_service import WalletTopUpError, WalletTopUpService


class CreatePaymentIntentView(APIView):
    def post(self, request):
        try:
            serializer = CreatePaymentSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            order_id = serializer.validated_data["order_id"]
            payment_method = serializer.validated_data["method"]
            order = Order.objects.get(id=order_id)

            if not order.agreed_budget:
                return Response({"error": "Order has no agreed budget"}, status=status.HTTP_400_BAD_REQUEST)

            existing_payment = Payment.objects.filter(order=order).first()

            if existing_payment and existing_payment.status != "failed":
                if existing_payment.method != payment_method:
                    return Response(
                        {"error": "This order already has a payment with another method"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                payment = existing_payment
            elif existing_payment and existing_payment.status == "failed":
                existing_payment.status = "pending"
                existing_payment.method = payment_method
                existing_payment.save()
                payment = existing_payment
            else:
                payment = Payment.objects.create(
                    order=order,
                    amount=order.agreed_budget,
                    method=payment_method,
                    status="pending",
                )

            processor = get_payment_processor(payment_method)
            return Response(processor.create_payment(order, payment))

        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        except PaymentProcessingError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ConfirmPaymentIntentView(APIView):
    def post(self, request):
        try:
            serializer = ConfirmPaymentSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            payment_method = serializer.validated_data["method"]
            payment_identifier = (
                serializer.validated_data.get("payment_intent_id")
                if payment_method == "stripe"
                else serializer.validated_data.get("payment_id")
            )

            processor = get_payment_processor(payment_method)
            return Response(processor.confirm_payment(payment_identifier), status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        except PaymentProcessingError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CancelPaymentIntentView(APIView):
    def post(self, request):
        try:
            serializer = CancelPaymentSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            payment_method = serializer.validated_data["method"]
            payment_id = serializer.validated_data["payment_id"]

            processor = get_payment_processor(payment_method)
            return Response(processor.cancel_payment(payment_id), status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        except PaymentProcessingError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateWalletTopUpView(APIView):
    def post(self, request):
        try:
            serializer = CreateWalletTopUpSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            service = WalletTopUpService()
            return Response(
                service.create_topup(
                    user_id=serializer.validated_data["user_id"],
                    amount=serializer.validated_data["amount"],
                ),
                status=status.HTTP_201_CREATED,
            )

        except WalletTopUpError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConfirmWalletTopUpView(APIView):
    def post(self, request):
        try:
            serializer = ConfirmWalletTopUpSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            service = WalletTopUpService()
            return Response(
                service.confirm_topup(payment_intent_id=serializer.validated_data["payment_intent_id"]),
                status=status.HTTP_200_OK,
            )

        except WalletTopUp.DoesNotExist:
            return Response({"error": "Wallet top-up not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CancelWalletTopUpView(APIView):
    def post(self, request):
        try:
            serializer = CancelWalletTopUpSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            service = WalletTopUpService()
            return Response(
                service.cancel_topup(topup_id=serializer.validated_data["topup_id"]),
                status=status.HTTP_200_OK,
            )

        except WalletTopUp.DoesNotExist:
            return Response({"error": "Wallet top-up not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
