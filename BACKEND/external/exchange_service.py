import requests

EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD"

def get_usd_to_cop():
    try:
        response = requests.get(EXCHANGE_API_URL, timeout=5)
        data = response.json()

        return {
            "base": data.get("base"),
            "cop": data["rates"].get("COP"),
        }
    except Exception as e:
        return {
            "error": str(e)
        }