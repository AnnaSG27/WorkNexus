from rest_framework.views import APIView
from rest_framework.response import Response
from .exchange_service import get_usd_to_cop

class ExchangeRateView(APIView):
    def get(self, request):
        data = get_usd_to_cop()

        if "error" in data:
            return Response(data, status=500)

        return Response(data)