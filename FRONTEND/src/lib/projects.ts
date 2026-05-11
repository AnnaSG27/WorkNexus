import { API_URL } from "./api";
import { apiFetch } from "@/lib/apiClient";

const PROJECTS_API_BASE = `${API_URL}/projects`;

export interface ProjectApplication {
  id: number;
  projectId: number;
  freelancerId: number;
  freelancerName: string;
  freelancerDisplayName: string;
  freelancerEmail: string;
  freelancerBio: string;
  freelancerDate_of_birth: string;
  coverLetter: string;
  proposedBudget: number | null;
  status: string;
  createdAt: string;
  isMine: boolean;
  project?: Project;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: number;
  timeline: string;
  location: string;
  skills: string[];
  referenceUrl: string;
  deadline: string | null;
  modality: string;
  status: string;
  isOpen: boolean;
  createdAt: string;
  clientId: number;
  clientName: string;
  clientDisplayName: string;
  enterpriseName: string;
  applicationsCount: number;
  favoriteCount: number;
  hasApplied: boolean;
  isFavorite: boolean;
  assignedFreelancer: {
    id: number;
    profileId: number;
    name: string;
    displayName: string;
  } | null;
  review: {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
  } | null;
  applications: ProjectApplication[];
}

export interface ProjectsSummary {
  projectCount: number;
  openCount: number;
  inProgressCount: number;
  completedCount: number;
  applicationsCount?: number | null;
}

export interface ApplicationsSummary {
  total: number;
  pending: number;
  reviewing: number;
  accepted: number;
  rejected: number;
}

export interface ProjectListResponse {
  projects: Project[];
  favorites: Project[];
  summary: ProjectsSummary;
}

export interface ApplicationsResponse {
  applications: ProjectApplication[];
  summary: ApplicationsSummary;
}

export interface CreateProjectPayload {
  clientId: string | number;
  title: string;
  description: string;
  category: string;
  budget: string;
  timeline: string;
  location: string;
  skills: string;
  referenceUrl: string;
  modality: string;
  deadline: string;
}

export interface ApplyToProjectPayload {
  freelancerId: string | number;
  coverLetter: string;
  proposedBudget: string;
}

export interface ProjectFilters {
  freelancerId?: string | number;
  clientId?: string | number;
  category?: string;
  modality?: string;
  status?: string;
  search?: string;
  favoriteOnly?: boolean;
  minBudget?: string;
  maxBudget?: string;
}

const handleJsonResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo completar la solicitud");
  }

  return payload as T;
};

export const fetchProjects = async (params?: ProjectFilters) => {
  const searchParams = new URLSearchParams();

  if (params?.freelancerId) searchParams.set("freelancer_id", String(params.freelancerId));
  if (params?.clientId) searchParams.set("client_id", String(params.clientId));
  if (params?.category && params.category !== "all") searchParams.set("category", params.category);
  if (params?.modality && params.modality !== "all") searchParams.set("modality", params.modality);
  if (params?.status && params.status !== "all") searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.favoriteOnly) searchParams.set("favorite_only", "true");
  if (params?.minBudget) searchParams.set("min_budget", params.minBudget);
  if (params?.maxBudget) searchParams.set("max_budget", params.maxBudget);

  const query = searchParams.toString();
  const response = await apiFetch(`${PROJECTS_API_BASE}/${query ? `?${query}` : ""}`, {
    method: "GET",
  });
  return handleJsonResponse<ProjectListResponse>(response);
};

export const createProject = async (payload: CreateProjectPayload) => {
  const response = await apiFetch(`${PROJECTS_API_BASE}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ project: Project }>(response);
};

export const updateProjectStatus = async (projectId: number, userId: string | number, status: string) => {
  const response = await apiFetch(`${PROJECTS_API_BASE}/${projectId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, status }),
  });

  return handleJsonResponse<{ project: Project }>(response);
};

export const deleteProject = async (projectId: number, userId: string | number) => {
  const response = await apiFetch(`${PROJECTS_API_BASE}/${projectId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  return handleJsonResponse<{ message: string }>(response);
};

export const applyToProject = async (projectId: number, payload: ApplyToProjectPayload) => {
  const response = await apiFetch(`${PROJECTS_API_BASE}/${projectId}/apply/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ project: Project; application: ProjectApplication }>(response);
};

export const fetchMyApplications = async (freelancerId: string | number) => {
  const response = await apiFetch(`${PROJECTS_API_BASE}/applications/?freelancer_id=${freelancerId}`, {
    method: "GET",
  });
  return handleJsonResponse<ApplicationsResponse>(response);
};

export const updateApplicationStatus = async (applicationId: number, userId: string | number, status: string) => {
  const response = await apiFetch(`${PROJECTS_API_BASE}/applications/${applicationId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, status }),
  });

  return handleJsonResponse<{ application: ProjectApplication; project: Project; conversationId?: number }>(response);
};

export const toggleProjectFavorite = async (projectId: number, freelancerId: string | number) => {
  const response = await apiFetch(`${PROJECTS_API_BASE}/${projectId}/favorite/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ freelancerId }),
  });

  return handleJsonResponse<{ isFavorite: boolean; project: Project }>(response);
};
