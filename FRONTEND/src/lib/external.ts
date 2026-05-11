import { API_URL } from "./api";
import { apiFetch } from "@/lib/apiClient";

export const fetchExchangeRate = async () => {
  const response = await apiFetch(`${API_URL}/external/exchange/`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Exchange rate request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.cop;
};
