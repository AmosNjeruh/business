/**
 * Assistant chat: strip legacy thinking tags, resolve /admin URLs to screen titles, tokenize links.
 */

import { BUSINESS_ASSISTANT_SCREENS } from "@/lib/assistantRegistry/businessScreens";

const THINK_OPEN = "<t360-thinking>";
const THINK_CLOSE = "</t360-thinking>";

/** Remove `<t360-thinking>` from the visible reply; keep only the answer portion. */
export function stripAssistantThinkingFromReply(raw: string): string {
  const s = raw.trim();
  const lower = s.toLowerCase();
  const open = lower.indexOf(THINK_OPEN);
  const closeIdx = lower.indexOf(THINK_CLOSE);
  if (open === -1 || closeIdx === -1 || closeIdx < open) {
    return raw;
  }
  const after = s.slice(closeIdx + THINK_CLOSE.length).trim();
  if (after.length > 0) return after;
  const before = s.slice(0, open).trim();
  return before.length > 0 ? before : s.replace(/<t360-thinking>[\s\S]*?<\/t360-thinking>/i, "").trim();
}

/** Map a concrete `/admin/...` path to the Business Suite screen title when possible. */
export function getScreenTitleForAdminPath(href: string): string {
  const pathOnly = href.split("?")[0].split("#")[0].replace(/\/$/, "") || "/admin";
  const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  for (const s of BUSINESS_ASSISTANT_SCREENS) {
    const regexStr = `^${s.pathname.replace(/\//g, "\\/").replace(/\[(\w+)\]/g, "[^/]+")}$`;
    try {
      if (new RegExp(regexStr).test(normalized)) return s.title;
    } catch {
      /* skip bad pattern */
    }
  }

  if (normalized === "/admin") return "Workspace home";

  const seg = normalized.split("/").filter(Boolean);
  const last = seg[seg.length - 1] ?? "page";
  if (/^[a-f0-9-]{20,}$/i.test(last)) return "Open in workspace";
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type RichToken =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string; external: boolean };

function mergeAdjacentText(tokens: RichToken[]): RichToken[] {
  const out: RichToken[] = [];
  for (const t of tokens) {
    const prev = out[out.length - 1];
    if (t.type === "text" && prev?.type === "text") {
      prev.value += t.value;
    } else if (t.type === "text") {
      out.push({ type: "text", value: t.value });
    } else {
      out.push({ type: "link", href: t.href, label: t.label, external: t.external });
    }
  }
  return out;
}

const BARE_ADMIN_PATH = /(\/admin(?:\/[a-zA-Z0-9_%.\-]+)*)/g;

/** Split a string into text + markdown / bare /admin links. */
export function tokenizeInlineWithLinks(text: string): RichToken[] {
  const out: RichToken[] = [];
  let last = 0;
  const mdRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdRe.exec(text)) !== null) {
    if (m.index > last) {
      out.push(...tokenizeBareAdminPathsOnly(text.slice(last, m.index)));
    }
    const label = (m[1] ?? "").trim();
    const href = (m[2] ?? "").trim();
    const external = /^https?:\/\//i.test(href);
    const pageLabel =
      label ||
      (!external ? getScreenTitleForAdminPath(href) : href.replace(/^https?:\/\//i, "").split("/")[0] || "Link");
    out.push({ type: "link", href, label: pageLabel, external });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(...tokenizeBareAdminPathsOnly(text.slice(last)));
  }
  return mergeAdjacentText(out);
}

function tokenizeBareAdminPathsOnly(fragment: string): RichToken[] {
  const out: RichToken[] = [];
  let last = 0;
  BARE_ADMIN_PATH.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BARE_ADMIN_PATH.exec(fragment)) !== null) {
    if (m.index > last) {
      out.push({ type: "text", value: fragment.slice(last, m.index) });
    }
    const href = m[1];
    out.push({
      type: "link",
      href,
      label: getScreenTitleForAdminPath(href),
      external: false,
    });
    last = m.index + m[1].length;
  }
  if (last < fragment.length) {
    out.push({ type: "text", value: fragment.slice(last) });
  }
  return out;
}

/** Human line for pipeline log when a navigate tool runs. */
export function describeNavigateToolArguments(rawArgs: string): { path: string; title: string } | null {
  try {
    const args = JSON.parse(rawArgs) as { path?: string };
    let p = (args.path ?? "").trim().split("?")[0];
    if (!p) return null;
    if (!p.startsWith("/")) p = `/${p}`;
    if (!p.startsWith("/admin")) p = `/admin${p}`;
    p = p.replace(/\/+/g, "/");
    return { path: p, title: getScreenTitleForAdminPath(p) };
  } catch {
    return null;
  }
}
