import { getStoredUser } from "@/components/professionals-session";

const API_BASE_URL = "http://localhost:8000/messaging";

export interface ChatUserSummary {
  id: number;
  username: string;
  displayName: string;
  userType: string | null;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderDisplayName: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
  status: "sent" | "read";
}

export interface ConversationSummary {
  id: number;
  updatedAt: string;
  createdAt: string;
  otherUser: ChatUserSummary;
  lastMessage: ChatMessage | null;
  lastResponseAt: string | null;
  unreadCount: number;
  messageCount: number;
  hasMessages: boolean;
}

export interface MessagingStats {
  conversationCount: number;
  sentCount: number;
  receivedCount: number;
  unreadCount: number;
  lastActivity: string | null;
  role: string | null;
}

export const getCurrentUserId = () => {
  const user = getStoredUser();
  return user?.id ? Number(user.id) : null;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "No se pudo completar la solicitud");
  }
  return data as T;
}

export async function fetchConversations(userId: number) {
  const response = await fetch(`${API_BASE_URL}/conversations/?user_id=${userId}`);
  return parseJsonResponse<{ conversations: ConversationSummary[]; totalUnread: number }>(response);
}

export async function startConversation(currentUserId: number, otherUserId: number) {
  const response = await fetch(`${API_BASE_URL}/conversations/start/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentUserId, otherUserId }),
  });

  return parseJsonResponse<{ conversation: ConversationSummary }>(response);
}

export async function fetchConversationMessages(conversationId: number, userId: number) {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages/?user_id=${userId}`);
  return parseJsonResponse<{ conversation: ConversationSummary; messages: ChatMessage[] }>(response);
}

export async function sendMessage(conversationId: number, senderId: number, content: string) {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ senderId, content }),
  });

  return parseJsonResponse<{ message: ChatMessage }>(response);
}

export async function fetchMessagingStats(userId: number) {
  const response = await fetch(`${API_BASE_URL}/dashboard/?user_id=${userId}`);
  return parseJsonResponse<{ stats: MessagingStats }>(response);
}
