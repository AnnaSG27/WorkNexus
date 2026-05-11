import { API_URL } from "./api";
import { apiFetch } from "@/lib/apiClient";

const REVIEWS_API_BASE = `${API_URL}/reviews`;

export interface Review {
  id: number;
  projectId: number;
  projectTitle: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: number;
    username: string;
    displayName: string;
  };
  freelancer: {
    id: number;
    username: string;
    displayName: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  reviewsCount: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  summary: ReviewSummary;
}

export interface CreateReviewPayload {
  clientId: string | number;
  projectId: number;
  rating: number;
  comment: string;
}

const handleJsonResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo completar la solicitud");
  }

  return payload as T;
};

export const fetchFreelancerReviews = async (freelancerId: string | number) => {
  const response = await apiFetch(`${REVIEWS_API_BASE}/?freelancer_id=${freelancerId}`, {
    method: "GET",
  });
  return handleJsonResponse<ReviewsResponse>(response);
};

export const createReview = async (payload: CreateReviewPayload) => {
  const response = await apiFetch(`${REVIEWS_API_BASE}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ review: Review; summary: ReviewSummary }>(response);
};
