import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type BusinessAssistantChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type BusinessAssistantContextValue = {
  aiAssistantOpen: boolean;
  setAiAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
  messages: BusinessAssistantChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<BusinessAssistantChatMessage[]>>;
  /** Last route template we synced for welcome / “you’re now on…” messages — lives for the session */
  routeHandledPathRef: React.MutableRefObject<string | null>;
  /** Clears the thread and route-sync ref; keeps the panel open (fresh welcome on next effect). */
  clearAssistantThread: () => void;
  resetAssistantSession: () => void;
};

const BusinessAssistantContext = createContext<BusinessAssistantContextValue | null>(null);

export function BusinessAssistantProvider({ children }: { children: ReactNode }) {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<BusinessAssistantChatMessage[]>([]);
  const routeHandledPathRef = useRef<string | null>(null);

  const clearAssistantThread = useCallback(() => {
    setMessages([]);
    routeHandledPathRef.current = null;
  }, []);

  const resetAssistantSession = useCallback(() => {
    setMessages([]);
    setAiAssistantOpen(false);
    routeHandledPathRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      aiAssistantOpen,
      setAiAssistantOpen,
      messages,
      setMessages,
      routeHandledPathRef,
      clearAssistantThread,
      resetAssistantSession,
    }),
    [aiAssistantOpen, clearAssistantThread, messages, resetAssistantSession]
  );

  return (
    <BusinessAssistantContext.Provider value={value}>{children}</BusinessAssistantContext.Provider>
  );
}

export function useBusinessAssistant(): BusinessAssistantContextValue {
  const ctx = useContext(BusinessAssistantContext);
  if (!ctx) {
    throw new Error("useBusinessAssistant must be used within BusinessAssistantProvider");
  }
  return ctx;
}
