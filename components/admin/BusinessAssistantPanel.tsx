// AI assistant: docked third column (wide viewports) like Shopify; bottom sheet below breakpoint.
// Docking uses JS (matchMedia) so the panel is never `position: fixed` when it should sit in the flex row.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaCheck, FaCopy, FaPaperPlane, FaRobot, FaSpinner, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { askAssistant, type AssistantMessage } from "@/services/assistant";
import { matchBusinessAssistantScreen } from "@/lib/assistantRegistry";
import { runBusinessNavigateTool } from "@/lib/businessAssistantNavigate";
import { useBusinessAssistantLivePageSnapshot } from "@/hooks/useBusinessAssistantLivePageSnapshot";
import {
  describeNavigateToolArguments,
  stripAssistantThinkingFromReply,
  tokenizeInlineWithLinks,
} from "@/lib/businessAssistantChatFormat";
import {
  useBusinessAssistant,
  type BusinessAssistantChatMessage,
} from "@/contexts/BusinessAssistantContext";

/** Align with Tailwind `lg` — dock as a real flex column at this width and up */
const DOCK_MIN_WIDTH_PX = 1024;
const MAX_SUGGESTED_QUESTIONS = 2;

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

const dockedAsideClass =
  "flex h-full min-h-0 flex-shrink-0 flex-col border-l border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950 " +
  "relative z-0 w-[min(100%,22rem)] xl:w-96 " +
  "shadow-[-6px_0_20px_-6px_rgba(15,23,42,0.06)] dark:shadow-[-6px_0_24px_-8px_rgba(0,0,0,0.35)]";

const overlayAsideClass =
  "fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-w-lg flex-col bg-white dark:bg-slate-950 " +
  "h-[72dvh] max-h-[72dvh] min-h-0 w-full min-w-0 flex-shrink-0 " +
  "rounded-t-2xl border border-b-0 border-slate-200 dark:border-white/10 " +
  "shadow-[0_-8px_32px_-6px_rgba(15,23,42,0.12)] dark:shadow-[0_-8px_36px_-8px_rgba(0,0,0,0.5)]";

const BusinessAssistantPanel: React.FC<BusinessAssistantPanelProps> = ({
  onClose,
}) => {
  const { messages, setMessages, routeHandledPathRef } = useBusinessAssistant();
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

  const getLivePageSnapshot = useBusinessAssistantLivePageSnapshot();

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
      } else if (pathname.includes("/admin/challenges")) {
        m.challengeIdFromRoute = id;
      }
    }
    return m;
  }, [screen.title, pathname, router.query]);

  const [isDocked, setIsDocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${DOCK_MIN_WIDTH_PX}px)`).matches;
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pipelineLog, setPipelineLog] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pipelineLogEndRef = useRef<HTMLDivElement | null>(null);

  const pushPipeline = useCallback((line: string) => {
    setPipelineLog((prev) => [...prev, line]);
  }, []);

  /** Welcome on first paint; when the user navigates, append a short context note (do not wipe thread). State lives in BusinessAssistantProvider. */
  useEffect(() => {
    const ref = routeHandledPathRef;
    if (ref.current === null) {
      if (messages.length === 0) {
        ref.current = pathname;
        setMessages([{ role: "assistant", content: welcomeText }]);
      } else {
        ref.current = pathname;
      }
      return;
    }
    if (ref.current === pathname) return;
    ref.current = pathname;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `You're now on **${screen.title}** (\`${pathname}\`). Ask me anything about this screen—or tell me to open another part of the workspace.`,
      },
    ]);
  }, [pathname, screen.title, welcomeText, messages.length, routeHandledPathRef, setMessages]);

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
  }, [messages, scrollToBottom, isSending, pipelineLog]);

  useEffect(() => {
    if (!isSending || pipelineLog.length === 0) return;
    pipelineLogEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isSending, pipelineLog]);

  const runAssistant = useCallback(
    async (userContent: string, priorThread: BusinessAssistantChatMessage[]) => {
      const userMessage: BusinessAssistantChatMessage = { role: "user", content: userContent };
      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      setPipelineLog(["Connecting to assistant…"]);

      const liveSnap = getLivePageSnapshot();
      if (liveSnap && Object.keys(liveSnap).length > 0) {
        const kind = String((liveSnap as Record<string, unknown>).kind ?? "data");
        pushPipeline(`Loaded live API snapshot (${kind}).`);
      } else {
        pushPipeline("No route snapshot — using screen context only.");
      }

      const contextPayload = {
        page: "business" as const,
        routeTemplate: pathname,
        asPath,
        query: { ...router.query } as Record<string, unknown>,
        summary: clientSummary,
        keyMetrics,
        ...(liveSnap && Object.keys(liveSnap).length > 0
          ? { pageSnapshot: liveSnap }
          : {}),
      };

      const toApiMessages = (thread: BusinessAssistantChatMessage[]): AssistantMessage[] =>
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
          pushPipeline(
            round === 0
              ? "Assistant is reasoning over context & data…"
              : "Assistant is continuing after workspace actions…"
          );

          const res = await askAssistant({
            messages: apiMessages.slice(-24),
            context: contextPayload,
          });

          const msg = res.message;
          if (msg.tool_calls?.length) {
            pushPipeline("Choosing workspace actions…");
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
                const nav = describeNavigateToolArguments(tc.function.arguments);
                pushPipeline(
                  nav
                    ? `Opening “${nav.title}” in the workspace…`
                    : "Running navigation in the workspace…"
                );
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
                pushPipeline(`Running tool: ${tc.function.name}…`);
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

          pushPipeline("Drafting your reply…");
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
        setPipelineLog([]);
        setIsSending(false);
      }
    },
    [asPath, clientSummary, getLivePageSnapshot, keyMetrics, pathname, pushPipeline, router, router.query]
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
  const suggestedQuestionsTwo = useMemo(
    () => screen.suggestedQuestions.slice(0, MAX_SUGGESTED_QUESTIONS),
    [screen.suggestedQuestions]
  );

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
        <div className="flex-shrink-0 flex items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 px-3 py-2 dark:border-white/10 dark:from-emerald-500/15 dark:via-cyan-500/10 dark:to-indigo-500/15">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-sm">
              <FaRobot className="h-3.5 w-3.5 opacity-95" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[9px] font-semibold uppercase leading-none tracking-wide text-emerald-600 dark:text-emerald-400">
                AI assistant
              </p>
              <h2 className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-white">
                Business Suite Copilot
              </h2>
              <p
                className="mt-0.5 truncate text-[10px] text-slate-600 dark:text-slate-300"
                title={`${screen.title} — ${pathname}`}
              >
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {screen.title}
                </span>
                <span className="mx-1 text-slate-400 dark:text-slate-500">·</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {pathname}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            onClick={onClose}
            aria-label="Close assistant"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const body = message.content ?? "";
              const displayBody = !isUser ? stripAssistantThinkingFromReply(body) : body;
              const copyMain = displayBody;
              return (
                <div
                  key={index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[min(92%,100%)] items-start gap-1.5 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <MessageCopyButton
                      text={copyMain}
                      variant={isUser ? "onGradient" : "onCard"}
                    />
                    <div
                      className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? "rounded-br-md bg-gradient-to-r from-emerald-500 to-cyan-500 font-medium text-slate-950"
                          : "rounded-bl-md border border-slate-200/90 bg-white text-slate-800 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{body}</p>
                      ) : (
                        <AssistantStructuredMessage text={displayBody} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isSending && pipelineLog.length > 0 ? (
              <div className="flex justify-start">
                <div className="flex max-w-[min(92%,100%)] gap-2.5 rounded-xl border border-cyan-200/70 bg-gradient-to-r from-cyan-50/95 to-emerald-50/80 px-3 py-2.5 shadow-sm dark:border-cyan-800/40 dark:from-cyan-950/35 dark:to-emerald-950/25">
                  <span className="relative mt-0.5 flex h-2.5 w-2.5 shrink-0 self-start">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Working
                    </p>
                    <div className="mt-1 max-h-32 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {pipelineLog.map((line, i) => (
                        <p
                          key={i}
                          className={`text-[11px] leading-snug ${
                            i === pipelineLog.length - 1
                              ? "font-semibold text-slate-800 dark:text-slate-100"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <span className="mr-1.5 font-mono text-[9px] text-emerald-600/80 dark:text-emerald-500/80">
                            {i + 1}.
                          </span>
                          {line}
                        </p>
                      ))}
                      <div ref={pipelineLogEndRef} />
                    </div>
                  </div>
                  <FaSpinner className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestionChips && (
            <div className="flex-shrink-0 border-t border-slate-200 bg-slate-100/80 px-2 pb-1 pt-2 dark:border-white/10 dark:bg-slate-900/80">
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Try asking
              </p>
              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pb-2 [scrollbar-width:thin]">
                {suggestedQuestionsTwo.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isSending}
                    onClick={() => void sendSuggestion(q)}
                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[11px] leading-snug text-slate-700 shadow-sm transition-colors hover:border-emerald-400/60 hover:bg-emerald-50/80 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-emerald-950/30"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              type="text"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Ask about this page, brief fit, applications, or work…"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isSending}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/25 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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

type AssistantSegment =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

/** Split assistant prose into headings, bullet blocks, and paragraphs for clearer layout. */
function segmentAssistantText(raw: string): AssistantSegment[] {
  const lines = raw.split(/\r?\n/);
  const out: AssistantSegment[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    const t = para.join("\n").trim();
    if (t) out.push({ kind: "paragraph", text: t });
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push({ kind: "list", items: list.slice() });
    list = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushList();
      flushPara();
      continue;
    }
    if (/^[-*•]\s+/.test(t)) {
      flushPara();
      list.push(t.replace(/^[-*•]\s+/, ""));
      continue;
    }
    flushList();
    // Standalone section label, e.g. "Campaign overview:" — skip long intro sentences ending in ':'
    const wordCount = t.split(/\s+/).filter(Boolean).length;
    const sentenceLikeStart =
      /^(here'?s|this|these|those|thank|i\b|we\b|they\b|below|above|in summary|it\b|as a|below is|above is)\b/i.test(
        t
      );
    if (
      /^.{2,55}:$/.test(t) &&
      (t.match(/:/g) ?? []).length === 1 &&
      !/\.\s/.test(t) &&
      wordCount <= 10 &&
      !sentenceLikeStart
    ) {
      flushPara();
      out.push({ kind: "heading", text: t.slice(0, -1) });
      continue;
    }
    para.push(line);
  }
  flushList();
  flushPara();
  return out;
}

const linkChipClass =
  "inline-flex max-w-full items-center gap-0.5 rounded-md border border-emerald-300/80 bg-emerald-50/90 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 underline decoration-emerald-400/60 underline-offset-2 transition-colors hover:border-emerald-400 hover:bg-emerald-100/90 hover:text-emerald-950 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:decoration-emerald-600 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/50";

function AdminInlineLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkChipClass} align-baseline`}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className={`${linkChipClass} align-baseline`}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
    </Link>
  );
}

function renderInlineBoldOnly(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <strong
          key={`${keyPrefix}-s-${i}`}
          className="font-semibold text-slate-900 dark:text-white"
        >
          {m[1]}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-s-${i}`}>{part}</span>;
  });
}

function renderInlineRich(text: string, keyPrefix: string): React.ReactNode {
  const tokens = tokenizeInlineWithLinks(text);
  return tokens.map((tok, i) => {
    if (tok.type === "text") {
      return (
        <span key={`${keyPrefix}-r-${i}`}>
          {renderInlineBoldOnly(tok.value, `${keyPrefix}-b-${i}`)}
        </span>
      );
    }
    return (
      <AdminInlineLink
        key={`${keyPrefix}-r-${i}`}
        href={tok.href}
        label={tok.label}
        external={tok.external}
      />
    );
  });
}

function AssistantStructuredMessage({ text }: { text: string }) {
  const segments = useMemo(() => segmentAssistantText(text), [text]);
  if (segments.length === 0) {
    return text.trim() ? (
      <p className="whitespace-pre-wrap text-[13px] font-medium text-slate-800 dark:text-slate-100">
        {renderInlineRich(text, "fallback")}
      </p>
    ) : null;
  }

  let seenParagraph = false;
  return (
    <div className="space-y-3">
      {segments.map((seg, i) => {
        if (seg.kind === "heading") {
          return (
            <h3
              key={i}
              className="border-b border-emerald-200/60 pb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-800/50 dark:text-emerald-400"
            >
              {renderInlineRich(seg.text, `h-${i}`)}
            </h3>
          );
        }
        if (seg.kind === "list") {
          return (
            <div
              key={i}
              className="rounded-lg border border-emerald-200/70 bg-gradient-to-br from-emerald-50/95 via-white to-cyan-50/50 px-2.5 py-2 dark:border-emerald-800/45 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900/90"
            >
              <ul className="space-y-2">
                {seg.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex gap-2.5 text-[11px] leading-snug text-slate-700 dark:text-slate-200"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40"
                      aria-hidden
                    />
                    <span className="min-w-0">{renderInlineRich(item, `li-${i}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        const isIntro = !seenParagraph;
        seenParagraph = true;
        return (
          <p
            key={i}
            className={`whitespace-pre-wrap text-slate-700 dark:text-slate-200 ${
              isIntro
                ? "text-[13px] font-medium leading-snug text-slate-800 dark:text-slate-100"
                : "text-[11.5px] leading-relaxed"
            }`}
          >
            {renderInlineRich(seg.text, `p-${i}`)}
          </p>
        );
      })}
    </div>
  );
}

function MessageCopyButton({
  text,
  variant,
}: {
  text: string;
  variant: "onCard" | "onGradient";
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const t = text.trim();
    if (!t) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const base =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50";
  const card =
    "border border-slate-200/80 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300";
  const grad =
    "bg-white/20 text-slate-900/80 hover:bg-white/35 dark:bg-black/15 dark:text-white/90";

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className={`${base} ${variant === "onCard" ? card : grad}`}
      aria-label={copied ? "Copied" : "Copy message"}
      title="Copy"
    >
      {copied ? (
        <FaCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <FaCopy className="h-3 w-3" />
      )}
    </button>
  );
}

export default BusinessAssistantPanel;
