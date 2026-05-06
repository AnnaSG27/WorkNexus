import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseCopInput = (value: string) => value.replace(/\D/g, "");

export const formatCopInput = (value: string) => {
  const normalized = parseCopInput(value);
  if (!normalized) return "";

  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Number(normalized));
};

export const formatCopCurrency = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};
