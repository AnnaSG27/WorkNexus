from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    order_title = serializers.CharField(source="order.title", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "order_id",
            "order_title",
            "amount",
            "currency",
            "stripe_payment_intent",
            "stripe_client_secret",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
            "stripe_payment_intent",
            "stripe_client_secret",
        ]
        
class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    
class ConfirmPaymentSerializer(serializers.Serializer):
    payment_intent_id = serializers.CharField()