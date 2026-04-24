import Api from "./api";

export interface ChatMessage {
  id: string;
  createdAt: string;
  content: string;
  senderId: string;
  isRead: boolean;
  sender?: {
    id: string;
    name?: string | null;
    picture?: string | null;
    role?: string;
  };
}

export async function getConversationMessages(conversationId: string, limit = 50, offset = 0) {
  const res = await Api.get(`/chat/conversations/${conversationId}/messages`, {
    params: { limit, offset },
  });
  return res.data?.data || res.data;
}

export async function sendChatMessage(conversationId: string, content: string) {
  const res = await Api.post("/chat/messages", { conversationId, content });
  return res.data?.data || res.data;
}

