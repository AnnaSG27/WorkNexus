import { apiFetch } from "@/lib/apiClient";
import { API_URL } from "./api";
const ORDERS_API_BASE = `${API_URL}/orders`;

export interface OrderParty {
  id: number;
  username: string;
  displayName: string;
  enterpriseName?: string;
  bio?: string;
}

export interface OrderServiceInfo {
  id: number;
  title: string;
  category: string;
}

export interface OrderProjectInfo {
  id: number;
  title: string;
  status: string;
}

export interface OrderApplicationInfo {
  id: number;
  status: string;
  proposedBudget: number | null;
}

export interface Order {
  id: number;
  title: string;
  description: string;
  sourceType: "service" | "project";
  status: "sin_iniciar" | "en_proceso" | "terminado" | "cancelado";
  agreedBudget: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: OrderParty;
  freelancer: OrderParty;
  service: OrderServiceInfo | null;
  project: OrderProjectInfo | null;
  projectReview: {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
  } | null;
  application: OrderApplicationInfo | null;
}

export interface OrdersSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

const handleJsonResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo completar la solicitud");
  }

  return payload as T;
};

export const fetchOrders = async (userId: string | number, role?: string) => {
  const params = new URLSearchParams({ user_id: String(userId) });
  if (role) params.set("role", role);

  const response = await apiFetch(`${ORDERS_API_BASE}/?${params.toString()}`, {
    method: "GET",
  });
  return handleJsonResponse<{ orders: Order[]; summary: OrdersSummary }>(response);
};

export const createServiceOrder = async (payload: {
  clientId: string | number;
  serviceId: number;
  title?: string;
  description?: string;
}) => {
  const response = await apiFetch(`${ORDERS_API_BASE}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ order: Order }>(response);
};

export const updateOrder = async (
  orderId: number,
  payload: {
    userId: string | number;
    status?: Order["status"];
    title?: string;
    description?: string;
    agreedBudget?: number | string | null;
  },
) => {
  const response = await apiFetch(`${ORDERS_API_BASE}/${orderId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ order: Order }>(response);
};
