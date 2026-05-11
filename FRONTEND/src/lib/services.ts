import { API_URL } from "./api"
import { apiFetch } from "@/lib/apiClient";

const SERVICES_API_BASE = `${API_URL}/services`;

export interface Service {
  id: number;
  title: string;
  description: string;
  category: string;
  freelancer_name: string;
  freelancer_id: number;
}

const handleJsonResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo completar la solicitud");
  }

  return payload as T;
};

export const fetchServices = async (category?: string) => {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await apiFetch(`${SERVICES_API_BASE}/services/${query}`, {
    method: "GET",
  });
  return handleJsonResponse<Service[]>(response);
};
