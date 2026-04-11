import Api from "./api";

export type AssistantPageContext = "business";

export type AssistantRole = "system" | "user" | "assistant" | "tool";

export interface AssistantToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AssistantMessage {
  role: AssistantRole;
  content: string | null;
  tool_calls?: AssistantToolCall[];
  tool_call_id?: string;
}

export interface AssistantContextPayload {
  page: AssistantPageContext;
  routeTemplate?: string;
  pathname?: string;
  asPath?: string;
  query?: Record<string, unknown>;
  summary?: string;
  keyMetrics?: Record<string, unknown>;
  /** API-backed snapshot for the current route (campaign analytics, workspace KPIs, etc.) */
  pageSnapshot?: Record<string, unknown>;
}

export interface AssistantRequestBody {
  messages: AssistantMessage[];
  context: AssistantContextPayload;
}

export interface AssistantResponseBody {
  message: {
    role: AssistantRole;
    content: string | null;
    tool_calls?: AssistantToolCall[];
    tool_call_id?: string;
  };
}

export const askAssistant = async (
  payload: AssistantRequestBody
): Promise<AssistantResponseBody> => {
  const response = await Api.post<{ data: AssistantResponseBody }>(
    "/assistant",
    payload
  );
  return response.data.data;
};
