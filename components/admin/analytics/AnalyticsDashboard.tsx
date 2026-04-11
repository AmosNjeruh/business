/**
 * Shared layout + primitives for advanced analytics pages (campaign / challenge).
 * Visual language aligned with pages/admin/finance/index.tsx (slate surfaces, emerald accents).
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaBolt,
  FaBullseye,
  FaChartLine,
  FaClock,
  FaEye,
  FaHeart,
  FaMousePointer,
  FaPercentage,
  FaShareAlt,
  FaUsers,
} from "react-icons/fa";

/** Social platforms shown in vendor analytics (matches product scope). */
export const ANALYTICS_SOCIAL_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "YOUTUBE", "TWITTER"] as const;

export const ANALYTICS_PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#FF2D92",
  TIKTOK: "#FE2C55",
  YOUTUBE: "#FF0000",
  TWITTER: "#1D9BF0",
  X: "#1D9BF0",
};

export function isAnalyticsSocialPlatform(platform: string): boolean {
  const u = String(platform).toUpperCase();
  return (ANALYTICS_SOCIAL_PLATFORMS as readonly string[]).includes(u) || u === "X";
}

export function filterRowsByAllowedPlatforms<T extends { platform?: string }>(rows: readonly T[]): T[] {
  return rows.filter((r) => r.platform != null && isAnalyticsSocialPlatform(String(r.platform)));
}

/** Donut / bar X-axis order; X (Twitter) manual entry shown last. */
export const ANALYTICS_PLATFORM_CHART_ORDER = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "YOUTUBE", "TWITTER"] as const;

export function isAnalyticsTwitterPlatform(id: string): boolean {
  const u = String(id).toUpperCase();
  return u === "TWITTER" || u === "X";
}

export function sortAnalyticsPlatformRows<T extends { platform?: string }>(rows: readonly T[]): T[] {
  const order = ANALYTICS_PLATFORM_CHART_ORDER as readonly string[];
  return [...rows].sort((a, b) => {
    const pa = String(a.platform ?? "").toUpperCase();
    const pb = String(b.platform ?? "").toUpperCase();
    const ta = isAnalyticsTwitterPlatform(pa);
    const tb = isAnalyticsTwitterPlatform(pb);
    if (ta !== tb) return ta ? 1 : -1;
    const ia = order.indexOf(pa);
    const ib = order.indexOf(pb);
    return (ia === -1 ? 50 : ia) - (ib === -1 ? 50 : ib);
  });
}

/** Hide internal IDs from flattened API objects shown as stat tiles. */
export function isHiddenAnalyticsMetricKey(key: string): boolean {
  const k = key.replace(/\s+/g, "").toLowerCase();
  if (k === "id" || k === "campaignid" || k === "challengeid") return true;
  if (k.includes("campaignid") || k.includes("challengeid")) return true;
  return false;
}

/** Donut centre label — same pattern as finalboss/analytics.tsx */
export function AnalyticsDonutCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">{children}</div>
  );
}

export function useAnalyticsChartPalette() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return {
    isDark,
    tick: isDark ? "#94a3b8" : "#64748b",
    tickSm: isDark ? "#94a3b8" : "#64748b",
    grid: isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(226,232,240,1)",
    tooltipText: isDark ? "#f8fafc" : "#0f172a",
    tooltipMuted: isDark ? "#94a3b8" : "#64748b",
  };
}

export function AnalyticsChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
      {label != null && <p className="font-semibold mb-1 text-slate-700 dark:text-slate-200">{String(label)}</p>}
      {payload.map((row) => (
        <div key={String(row.dataKey ?? row.name)} className="flex items-center gap-2">
          {row.color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />}
          <span className="text-slate-500 dark:text-slate-400">{row.name}:</span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{Number(row.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/** Same content width rhythm as Finance — relies on AdminLayout bg-slate-50 / dark:bg-slate-950 */
export function AnalyticsPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full w-full min-w-0 max-w-7xl mx-auto space-y-6 box-border">
      {children}
    </div>
  );
}

/** Hero KPI strip from Finance — emerald / cyan / indigo gradient + decorative orbs */
export function AnalyticsSummaryBanner({
  columns,
}: {
  columns: readonly {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    /** First finance tile spans 2 on small grids */
    wide?: boolean;
  }[];
}) {
  return (
    <div className="bg-gradient-to-br from-emerald-900 via-cyan-900 to-indigo-900 rounded-2xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="relative z-10 bus-responsive-stat-grid gap-4 sm:gap-8">
        {columns.map((col) => (
          <div key={col.label} className={col.wide ? "col-span-full @lg/bus-main:col-span-1" : undefined}>
            <p className="text-emerald-200 text-xs font-medium mb-1 uppercase tracking-wide">{col.label}</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{col.value}</p>
            {col.sub != null && col.sub !== "" && <p className="text-emerald-300 text-xs mt-1">{col.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsHero({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  statusLabel,
  statusTone = "live",
  rightSlot,
}: {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  lastUpdated: string;
  statusLabel?: string;
  statusTone?: "live" | "draft" | "muted";
  rightSlot?: React.ReactNode;
}) {
  const statusRing =
    statusTone === "live"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
      : statusTone === "draft"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600";

  return (
    <header className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
          <Link
            href={backHref}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 mt-0.5"
            title={backLabel}
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{eyebrow}</p>
            <div className="flex flex-wrap items-center gap-2 gap-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
              {statusLabel && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusRing}`}>{statusLabel}</span>
              )}
            </div>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">{subtitle}</p>}
            <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums pt-0.5">
              <FaClock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              Last updated {lastUpdated}
            </p>
          </div>
        </div>
        {rightSlot && (
          <div className="flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-end lg:justify-end gap-2 shrink-0 w-full min-w-0 max-w-full lg:max-w-none">
            {rightSlot}
          </div>
        )}
      </div>
    </header>
  );
}

export function AnalyticsTierTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { id: T; label: string; hint?: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-full shadow-sm">
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={[
              "flex flex-col items-center justify-center min-w-[5.5rem] sm:min-w-[6rem] px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
              on
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
            ].join(" ")}
          >
            <span className="truncate w-full text-center">{t.label}</span>
            {t.hint && (
              <span className={`hidden sm:block text-[10px] font-normal truncate w-full text-center mt-0.5 ${on ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-slate-400 dark:text-slate-500"}`}>
                {t.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AnalyticsCard({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "emerald" | "indigo" | "cyan" | "amber" | "rose" | "none";
}) {
  const topClass =
    accent === "emerald"
      ? "border-t-emerald-500"
      : accent === "indigo"
        ? "border-t-indigo-500"
        : accent === "cyan"
          ? "border-t-cyan-500"
          : accent === "amber"
            ? "border-t-amber-500"
            : accent === "rose"
              ? "border-t-rose-500"
              : "";

  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden min-w-0 w-full",
        topClass,
        topClass ? "border-t-4" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function AnalyticsCardHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2 sm:gap-3 px-3 sm:px-4 pt-3 pb-2 border-b border-slate-200 dark:border-white/10">
      <div className="min-w-0 flex gap-2 sm:gap-2.5">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
          {description && <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{description}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0 flex flex-wrap gap-1 justify-end">{actions}</div>}
    </div>
  );
}

export function AnalyticsCardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-3 sm:px-4 py-2.5 sm:py-3 ${className}`}>{children}</div>;
}

/** Same stat cards as `pages/admin/campaigns/index.tsx` top metrics row */
const DASH_STAT_VARIANTS: readonly {
  light: string;
  dark: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { light: "border-blue-200 bg-blue-50 text-blue-600", dark: "dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-400", Icon: FaChartLine },
  { light: "border-green-200 bg-green-50 text-green-600", dark: "dark:border-green-500/20 dark:bg-green-500/5 dark:text-green-400", Icon: FaEye },
  { light: "border-yellow-200 bg-yellow-50 text-yellow-600", dark: "dark:border-yellow-500/20 dark:bg-yellow-500/5 dark:text-yellow-400", Icon: FaBolt },
  { light: "border-purple-200 bg-purple-50 text-purple-600", dark: "dark:border-purple-500/20 dark:bg-purple-500/5 dark:text-purple-400", Icon: FaBullseye },
  { light: "border-orange-200 bg-orange-50 text-orange-600", dark: "dark:border-orange-500/20 dark:bg-orange-500/5 dark:text-orange-400", Icon: FaHeart },
  { light: "border-indigo-200 bg-indigo-50 text-indigo-600", dark: "dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-400", Icon: FaShareAlt },
  { light: "border-cyan-200 bg-cyan-50 text-cyan-600", dark: "dark:border-cyan-500/20 dark:bg-cyan-500/5 dark:text-cyan-400", Icon: FaUsers },
  { light: "border-pink-200 bg-pink-50 text-pink-600", dark: "dark:border-pink-500/20 dark:bg-pink-500/5 dark:text-pink-400", Icon: FaPercentage },
];

/** Large CPM callout — indigo panel consistent with dashboard accents */
export function AnalyticsCpmCard({
  value,
  footnote,
}: {
  value: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 shadow-lg shadow-orange-500/10 dark:shadow-orange-900/20">
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-0.5">CPM · cost per 1,000 impressions</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</p>
            {footnote != null && footnote !== false && (
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-snug">{footnote}</div>
            )}
          </div>
          <FaMousePointer className="h-7 w-7 sm:h-8 sm:w-8 text-orange-500 dark:text-orange-400 opacity-40 shrink-0" aria-hidden />
        </div>
      </div>
    </div>
  );
}

/** Compact stat tiles — wrap to main column width. */
export function AnalyticsMiniStatGrid({
  cells,
}: {
  cells: readonly { label: string; value: React.ReactNode; sub?: string }[];
}) {
  return (
    <div className="bus-responsive-two-col gap-2 sm:gap-2.5">
      {cells.map((c, idx) => {
        const { light, dark, Icon } = DASH_STAT_VARIANTS[idx % DASH_STAT_VARIANTS.length];
        return (
          <div key={c.label} className={`rounded-xl border p-2.5 sm:p-3 ${light} ${dark}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold mb-0.5 leading-tight text-slate-700 dark:text-slate-200 break-words">
                  {c.label}
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight [overflow-wrap:anywhere]">
                  {c.value}
                </p>
                {c.sub && <p className="text-[10px] mt-1 opacity-75 leading-snug break-words">{c.sub}</p>}
              </div>
              <Icon className="h-3.5 w-3.5 opacity-35 shrink-0 mt-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsKpiStrip({
  items,
}: {
  items: { label: string; value: React.ReactNode; hint?: string }[];
}) {
  return (
    <div className="bus-responsive-stat-grid gap-2 sm:gap-2.5">
      {items.map((it, idx) => {
        const { light, dark, Icon } = DASH_STAT_VARIANTS[idx % DASH_STAT_VARIANTS.length];
        return (
          <div key={it.label} className={`rounded-xl border p-2.5 sm:p-3 ${light} ${dark}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold mb-0.5 leading-tight text-slate-700 dark:text-slate-200 break-words">{it.label}</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-none tracking-tight [overflow-wrap:anywhere]">
                  {it.value}
                </p>
                {it.hint && <p className="text-[10px] mt-1 opacity-75 leading-snug break-words">{it.hint}</p>}
              </div>
              <Icon className="h-4 w-4 opacity-35 shrink-0 mt-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Platform filter chips — brand-colored dots when `colors` provided; optional `hint` under label (e.g. manual / not tracked). */
export function AnalyticsPlatformFilter({
  value,
  onChange,
  platforms,
  colors,
}: {
  value: string;
  onChange: (platformId: string) => void;
  platforms: readonly { id: string; label: string; hint?: string }[];
  colors?: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Platform</span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("ALL")}
          className={[
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all",
            value === "ALL"
              ? "bg-gradient-to-r from-orange-500 to-red-600 text-white border-transparent shadow-md shadow-orange-500/25"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-orange-400/60",
          ].join(" ")}
        >
          All platforms
        </button>
        {platforms.map((p) => {
          const dot = colors?.[p.id] ?? colors?.[p.id.toUpperCase()] ?? "#64748b";
          const on = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              title={p.hint}
              className={[
                "inline-flex items-start gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all text-left max-w-[220px]",
                on
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg"
                  : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
              ].join(" ")}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/20 mt-1" style={{ backgroundColor: dot }} />
              <span className="min-w-0 flex flex-col gap-0.5">
                <span className="leading-tight">{p.label}</span>
                {p.hint && (
                  <span
                    className={[
                      "text-[10px] font-normal leading-snug",
                      on ? "text-white/80 dark:text-slate-600" : "text-slate-500 dark:text-slate-400",
                    ].join(" ")}
                  >
                    {p.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AnalyticsPillToggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 items-stretch lg:items-end">
      {label && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 lg:text-right">{label}</span>}
      <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {options.map((opt) => {
          const on = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={[
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                on
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AnalyticsTableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto max-h-[min(420px,55vh)] overflow-y-auto">{children}</div>;
}

export function AnalyticsInsightList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-snug">
      {items.map((t, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-[10px] leading-5">▸</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
