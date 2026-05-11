import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStoredUser } from "@/components/professionals-session";
import { API_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
type PaymentMethod = "stripe" | "wallet";

type PaymentFormProps = {
  clientSecret: string;
  onCancel: () => Promise<void>;
  canceling: boolean;
};

const PaymentForm = ({ clientSecret, onCancel, canceling }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: "Test User",
          email: "test@example.com",
        },
      }
    });

    if (result.error) {
      console.error("Error:", result.error.message);
    } else {
      await apiFetch(`${API_URL}/payments/complete/`, {
        method: "POST",     
        headers: {     
          "Content-Type": "application/json",     
        },     
        body: JSON.stringify({      
          method: "stripe",
          payment_intent_id: result.paymentIntent.id,     
        }),
      })
      .then(res => res.json())
      .then(data => console.log("Confirmación:", data));
      navigate(`/orders`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-md">
      <CardElement className="p-4 border rounded-md" />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Pagar ahora
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={canceling}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          {canceling ? "Cancelando..." : "Cancelar"}
        </button>
      </div>
    </form>
  );
};

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState("");

  const syncWalletBalance = (walletBalance: string) => {
    const storedUser = getStoredUser();
    if (!storedUser) return;

    localStorage.setItem(
      "user",
      JSON.stringify({
        ...storedUser,
        walletBalance,
      }),
    );
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setClientSecret("");
    setPaymentId(null);
    setError("");
  };

  const createPayment = async () => {
    if (!orderId) return;

    setLoading(true);
    setError("");
    setClientSecret("");
    setPaymentId(null);

    try {
      const response = await apiFetch(`${API_URL}/payments/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId, method: paymentMethod }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el pago");
      }

      if (paymentMethod === "wallet") {
        if (data.wallet_balance) {
          syncWalletBalance(data.wallet_balance);
        }
        navigate(`/orders`);
        return;
      }

      if (data.client_secret) {
        setClientSecret(data.client_secret);
        setPaymentId(data.payment_id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el pago";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelStripePayment = async () => {
    if (!paymentId) return;

    setCanceling(true);
    setError("");

    try {
      const response = await apiFetch(`${API_URL}/payments/cancel/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "stripe", payment_id: paymentId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cancelar el pago");
      }

      setClientSecret("");
      setPaymentId(null);
      setPaymentMethod("stripe");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cancelar el pago";
      setError(message);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-20 min-h-[80vh]">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-2">Orden: {orderId}</p>

      <div className="mt-6 max-w-md space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Método de pago
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selectPaymentMethod("stripe")}
            className={`rounded-md border px-4 py-3 text-sm font-medium ${
              paymentMethod === "stripe"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            Stripe
          </button>
          <button
            type="button"
            onClick={() => selectPaymentMethod("wallet")}
            className={`rounded-md border px-4 py-3 text-sm font-medium ${
              paymentMethod === "wallet"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            Billetera
          </button>
        </div>

        <button
          type="button"
          onClick={createPayment}
          disabled={loading}
          className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Procesando..." : "Continuar"}
        </button>
      </div>

      {!loading && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            clientSecret={clientSecret}
            onCancel={cancelStripePayment}
            canceling={canceling}
          />
        </Elements>
      )}

      {error && (
        <p className="mt-4 text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Checkout;
