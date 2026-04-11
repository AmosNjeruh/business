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
}

export interface AssistantRequestBody {
  messages: AssistantMessage[];
  context: AssistantContextPayload;
}

/** Pre-completed tool outputs from the API (e.g. vendor_workspace_snapshot). Merge before client-only tools. */
export interface AssistantServerToolResult {
  tool_call_id: string;
  content: string;
}

export interface AssistantResponseBody {
  message: {
    role: AssistantRole;
    content: string | null;
    tool_calls?: AssistantToolCall[];
    tool_call_id?: string;
  };
  /** Present when the API ran server-side data tools in the same turn as client tools. */
  serverToolResults?: AssistantServerToolResult[];
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
