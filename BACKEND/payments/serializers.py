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
            "method",
            "processor_reference",
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
            "processor_reference",
        ]
        
class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    method = serializers.ChoiceField(choices=["stripe", "wallet"], default="stripe")
    
class ConfirmPaymentSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=["stripe", "wallet"], default="stripe")
    payment_intent_id = serializers.CharField(required=False)
    payment_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        method = attrs.get("method", "stripe")

        if method == "stripe" and not attrs.get("payment_intent_id"):
            raise serializers.ValidationError({"payment_intent_id": "This field is required for Stripe payments."})

        if method == "wallet" and not attrs.get("payment_id"):
            raise serializers.ValidationError({"payment_id": "This field is required for wallet payments."})

        return attrs


class CancelPaymentSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=["stripe"], default="stripe")
    payment_id = serializers.IntegerField()


class CreateWalletTopUpSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1000)


class ConfirmWalletTopUpSerializer(serializers.Serializer):
    payment_intent_id = serializers.CharField()


class CancelWalletTopUpSerializer(serializers.Serializer):
    topup_id = serializers.IntegerField()
