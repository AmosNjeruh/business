// AI assistant: docked third column (wide viewports) like Shopify; bottom sheet below breakpoint.
// Docking uses JS (matchMedia) so the panel is never `position: fixed` when it should sit in the flex row.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FaPaperPlane, FaRobot, FaSpinner, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { askAssistant, type AssistantMessage } from "@/services/assistant";
import { matchBusinessAssistantScreen } from "@/lib/assistantRegistry";
import { runBusinessNavigateTool } from "@/lib/businessAssistantNavigate";

/** Align with Tailwind `lg` — dock as a real flex column at this width and up */
const DOCK_MIN_WIDTH_PX = 1024;

type Role = "system" | "user" | "assistant";

interface ChatMessage {
  role: Role;
  content: string;
}

interface BusinessAssistantPanelProps {
  onClose: () => void;
}

function buildClientScreenSummary(pathname: string, asPath: string): string {
  const lines = [
    "Workspace: Trend360 Business Suite (/admin).",
    `Next.js route template: ${pathname}`,
    `Current URL (asPath): ${asPath}`,
  ];
  if (typeof window !== "undefined") {
    try {
      const brand =
        window.localStorage.getItem("t360:business:selectedBrandId") ||
        window.localStorage.getItem("selectedVendorId");
      if (brand?.trim()) {
        lines.push(
          `Active brand context (sent as x-selected-vendor on API calls): ${brand.trim()}`
        );
      }
    } catch {
      /* ignore */
    }
  }
  return lines.join("\n");
}

const BusinessAssistantPanel: React.FC<BusinessAssistantPanelProps> = ({
  onClose,
}) => {
  const router = useRouter();
  const pathname = router.pathname ?? "";
  const asPath = router.asPath ?? pathname;

  const screen = useMemo(
    () => matchBusinessAssistantScreen(pathname),
    [pathname]
  );

  const clientSummary = useMemo(
    () => buildClientScreenSummary(pathname, asPath),
    [pathname, asPath]
  );

  const welcomeText = useMemo(() => {
    return `Hi! You're on **${screen.title}**. Ask for strategy, **who fits your campaign requirements**, how to **triage applications** or **validate work**, or tell me to **open** a page and run filters (e.g. pending applications, work queue for one campaign, Partners search for “eco skincare TikTok”).`;
  }, [screen.title]);

  const keyMetrics = useMemo(() => {
    const m: Record<string, unknown> = {
      businessScreen: screen.title,
      routeTemplate: pathname,
    };
    const id = router.query["id"];
    if (typeof id === "string" && id) {
      if (pathname.startsWith("/admin/work-validation")) {
        m.workValidationApplicationId = id;
      } else if (pathname.includes("/admin/campaigns")) {
        m.campaignIdFromRoute = id;
      }
    }
    return m;
  }, [screen.title, pathname, router.query]);

  const [isDocked, setIsDocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${DOCK_MIN_WIDTH_PX}px)`).matches;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const routeInitRef = useRef<string | null>(null);

  /** Welcome on first paint; when the user navigates with the panel open, append a short context note (do not wipe thread). */
  useEffect(() => {
    if (routeInitRef.current === null) {
      routeInitRef.current = pathname;
      setMessages([{ role: "assistant", content: welcomeText }]);
      return;
    }
    if (routeInitRef.current === pathname) return;
    routeInitRef.current = pathname;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `You're now on **${screen.title}** (\`${pathname}\`). Ask me anything about this screen—or tell me to open another part of the workspace.`,
      },
    ]);
  }, [pathname, screen.title, welcomeText]);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DOCK_MIN_WIDTH_PX}px)`);
    const apply = () => setIsDocked(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isDocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDocked]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const runAssistant = useCallback(
    async (userContent: string, priorThread: ChatMessage[]) => {
      const userMessage: ChatMessage = { role: "user", content: userContent };
      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);

      const contextPayload = {
        page: "business" as const,
        routeTemplate: pathname,
        asPath,
        query: { ...router.query } as Record<string, unknown>,
        summary: clientSummary,
        keyMetrics,
      };

      const toApiMessages = (thread: ChatMessage[]): AssistantMessage[] =>
        thread
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role as AssistantMessage["role"],
            content: m.content,
          }));

      try {
        let apiMessages: AssistantMessage[] = [
          ...toApiMessages(priorThread),
          { role: "user", content: userContent },
        ];

        const MAX_TOOL_ROUNDS = 6;
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const res = await askAssistant({
            messages: apiMessages.slice(-24),
            context: contextPayload,
          });

          const msg = res.message;
          if (msg.tool_calls?.length) {
            apiMessages = [
              ...apiMessages,
              {
                role: "assistant",
                content: msg.content,
                tool_calls: msg.tool_calls,
              },
            ];

            for (const tc of msg.tool_calls) {
              if (tc.function.name === "business_navigate") {
                const result = await runBusinessNavigateTool(
                  router,
                  tc.function.arguments
                );
                try {
                  const parsed = JSON.parse(result) as { ok?: boolean };
                  if (parsed.ok) toast.success("Opened in workspace");
                } catch {
                  /* ignore */
                }
                apiMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: result,
                });
              } else {
                apiMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: JSON.stringify({
                    ok: false,
                    error: `unknown_tool:${tc.function.name}`,
                  }),
                });
              }
            }
            continue;
          }

          const text = (msg.content ?? "").trim();
          if (text) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: text },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content:
                  "I couldn’t generate a reply. Try again shortly, or confirm the AI service is configured on the API.",
              },
            ]);
          }
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "That needed too many steps at once—try one action (e.g. “open Partners”) and we’ll continue from there.",
          },
        ]);
      } catch (e) {
        console.error("Business assistant error:", e);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Something went wrong contacting the assistant. Check your connection and that OPENAI_KEY is set on the API.",
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [asPath, clientSummary, keyMetrics, pathname, router, router.query]
  );

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input.trim();
    const prior = messages.filter((m) => m.role !== "system");
    setInput("");
    await runAssistant(text, prior);
  };

  const sendSuggestion = async (text: string) => {
    if (!text.trim() || isSending) return;
    const prior = messages.filter((m) => m.role !== "system");
    await runAssistant(text.trim(), prior);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const hasUserMessage = messages.some((m) => m.role === "user");
  const showSuggestionChips = !isSending && !hasUserMessage;

  const dockedAsideClass =
    "flex flex-col border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 " +
    "h-full min-h-0 max-h-full self-stretch min-w-0 flex-shrink-0 " +
    "relative z-0 w-[min(100%,22rem)] xl:w-96 shadow-none";

  const overlayAsideClass =
    "flex flex-col bg-white dark:bg-slate-950 " +
    "h-[75dvh] max-h-[75dvh] min-h-0 w-full min-w-0 flex-shrink-0 " +
    "fixed bottom-0 left-0 right-0 z-[60] " +
    "rounded-t-2xl border border-b-0 border-slate-200 dark:border-white/10 " +
    "shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.2)] dark:shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.45)]";

  return (
    <>
      {!isDocked && (
        <div
          className="fixed inset-0 z-[55] bg-slate-900/20 dark:bg-black/30 backdrop-blur-[1px]"
          aria-hidden={true}
          onClick={onClose}
        />
      )}

      <aside
        role="dialog"
        aria-modal={!isDocked}
        aria-label="AI assistant"
        className={isDocked ? dockedAsideClass : overlayAsideClass}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-start justify-between gap-3 px-4 py-4 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 dark:from-emerald-500/15 dark:via-cyan-500/10 dark:to-indigo-500/15">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-md">
              <FaRobot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                AI assistant
              </p>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Business Suite Copilot
              </h2>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
                On: {screen.title}
              </p>
              <p
                className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate"
                title={pathname}
              >
                {pathname}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Close assistant"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 rounded-br-sm font-medium"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-white/10 whitespace-pre-wrap"
                }`}
              >
                {message.role === "assistant" ? (
                  <AssistantBubbleText text={message.content ?? ""} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showSuggestionChips && (
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/80 px-2 pt-2 pb-1">
            <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ideas for this page
            </p>
            <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pb-2 [scrollbar-width:thin]">
              {screen.suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isSending}
                  onClick={() => void sendSuggestion(q)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-left text-[11px] leading-snug text-slate-700 dark:text-slate-200 shadow-sm hover:border-emerald-400/60 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-shrink-0 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              type="text"
              className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
              placeholder="Ask about this page, brief fit, applications, or work…"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isSending}
              className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/25"
              aria-label="Send message"
            >
              {isSending ? (
                <FaSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <FaPaperPlane className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

/** Lightweight **bold** rendering for welcome copy (no full markdown). */
function AssistantBubbleText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\*\*([^*]+)\*\*$/);
        if (m) {
          return (
            <strong key={i} className="font-semibold text-slate-900 dark:text-white">
              {m[1]}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default BusinessAssistantPanel;
