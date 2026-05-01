import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { API_URL } from "@/lib/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ clientSecret }: { clientSecret: string }) => {
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
      console.log("Pago exitoso 🔥");
      await fetch(`${API_URL}/payments/complete/`, {
        method: "POST",     
        headers: {     
          "Content-Type": "application/json",     
        },     
        body: JSON.stringify({      
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

      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
      >
        💳 Pagar ahora
      </button>
    </form>
  );
};

const Checkout = () => {
  const { orderId } = useParams();
  console.log("ORDER ID:", orderId);

  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`${API_URL}/payments/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id: orderId }),
    })
      .then(async (res) => {
        const data = await res.json();
        console.log("RESPUESTA BACKEND:", data);
        return data;
      })
      .then((data) => {
        setClientSecret(data.client_secret);
        setLoading(false);
        console.log("Client Secret:", data.client_secret);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [orderId]);

  return (
    <div className="container mx-auto px-4 pt-28 pb-20 min-h-[80vh]">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-2">Orden: {orderId}</p>

      {loading && <p className="mt-4">Cargando pago...</p>}

      {!loading && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm clientSecret={clientSecret} />
        </Elements>
      )}

      {!loading && !clientSecret && (
        <p className="mt-4 text-red-600">
          Error al crear el pago ❌
        </p>
      )}
    </div>
  );
};

export default Checkout;