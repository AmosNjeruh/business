import type { NextRouter } from "next/router";

/** Dispatched after copilot navigation so pages can apply filters without waiting on URL/debounce edge cases. */
export const BUSINESS_COPILOT_FILTER_EVENT = "t360:business-copilot:apply-filters" as const;

export type CopilotPartnersFilterDetail = {
  page: "partners";
  search: string;
  niche: string;
  category: string;
  /** Numeric strings for min/max total followers (matches Partners UI + influencer API). */
  minFollowers: string;
  maxFollowers: string;
  /** Lowercase platform id: instagram, tiktok, youtube, facebook, twitter, etc. */
  platform: string;
  /** all | high | medium | low — matches engagement dropdown. */
  engagement: string;
};

/** Avoid copying a follower-threshold phrase into text search (naive copilot mistake). */
function partnerSearchHintLooksLikeFollowerOnlyHint(hint: string): boolean {
  const t = hint.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return false;
  if (/^\d+\s*\+?$/.test(t)) return true;
  if (/^(over|above|at least|more than|>\s*|min\s+)\s*\d+/.test(t)) return true;
  if (/^\d+\s*(k|m)?\s*(followers?|subs?|following)?$/i.test(t)) return true;
  if (/^(micro|macro|mega)\s*(influencer)?s?$/i.test(t)) return false;
  return false;
}

export type CopilotApplicationsFilterDetail = {
  page: "applications";
  search: string;
  campaignId: string;
  status: string;
};

export type CopilotWorkValidationFilterDetail = {
  page: "workValidation";
  search: string;
  campaignId: string;
  workStatus: string;
};

export type CopilotFilterDetail =
  | CopilotPartnersFilterDetail
  | CopilotApplicationsFilterDetail
  | CopilotWorkValidationFilterDetail;

/**
 * Execute `business_navigate` tool from the copilot.
 * For `/admin/partners`, merges `search_hint` into `query.search` only when it is not a follower-count phrase; pushes URL; dispatches structured filters (followers, platform, engagement, etc.).
 */
export async function runBusinessNavigateTool(
  router: NextRouter,
  rawArguments: string
): Promise<string> {
  let args: {
    path?: string;
    query?: Record<string, string>;
    search_hint?: string;
  };
  try {
    args = JSON.parse(rawArguments) as typeof args;
  } catch {
    return JSON.stringify({ ok: false, error: "invalid_json_arguments" });
  }

  if (!args.path || typeof args.path !== "string") {
    return JSON.stringify({ ok: false, error: "missing_path" });
  }

  let rawPath = args.path.trim();
  let mergedQuery: Record<string, string> = { ...(args.query || {}) };

  if (rawPath.includes("?")) {
    const [p, queryString] = rawPath.split("?");
    rawPath = p;
    const sp = new URLSearchParams(queryString);
    sp.forEach((v, k) => {
      mergedQuery[k] = v;
    });
  }

  let path = rawPath;
  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.startsWith("/admin")) {
    path = `/admin${path.startsWith("/") ? path : `/${path}`}`.replace(
      /\/+/g,
      "/"
    );
  }

  const pathBase = path.split("?")[0];

  const hint = (args.search_hint || "").trim();
  if (pathBase === "/admin/partners") {
    if (hint && !mergedQuery.search && !mergedQuery.q) {
      if (!partnerSearchHintLooksLikeFollowerOnlyHint(hint)) {
        mergedQuery.search = hint;
      }
    }
  }
  if (pathBase === "/admin/applications") {
    if (hint && !mergedQuery.search && !mergedQuery.q) {
      mergedQuery.search = hint;
    }
  }
  if (pathBase === "/admin/work-validation") {
    if (hint && !mergedQuery.search && !mergedQuery.q) {
      mergedQuery.search = hint;
    }
  }

  const qs =
    Object.keys(mergedQuery).length > 0
      ? `?${new URLSearchParams(mergedQuery).toString()}`
      : "";
  const href = `${pathBase}${qs}`;

  try {
    await router.push(href);

    if (typeof window !== "undefined") {
      if (pathBase === "/admin/partners") {
        const search = (mergedQuery.search || mergedQuery.q || "").trim();
        const niche = (mergedQuery.niche || "").trim();
        const category = (mergedQuery.category || "").trim();
        const minFollowers = (mergedQuery.minFollowers || "").trim();
        const maxFollowers = (mergedQuery.maxFollowers || "").trim();
        let platform = (mergedQuery.platform || "").trim().toLowerCase();
        if (platform === "x") platform = "twitter";
        const engagement = (mergedQuery.engagement || "").trim().toLowerCase();
        if (
          search ||
          niche ||
          category ||
          minFollowers ||
          maxFollowers ||
          platform ||
          engagement
        ) {
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent<CopilotPartnersFilterDetail>(
                BUSINESS_COPILOT_FILTER_EVENT,
                {
                  detail: {
                    page: "partners",
                    search,
                    niche,
                    category,
                    minFollowers,
                    maxFollowers,
                    platform,
                    engagement,
                  },
                }
              )
            );
          });
        }
      }
      if (pathBase === "/admin/applications") {
        const search = (mergedQuery.search || mergedQuery.q || "").trim();
        const campaignId = (mergedQuery.campaignId || "").trim();
        const status = (mergedQuery.status || "").trim();
        if (search || campaignId || status) {
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent<CopilotApplicationsFilterDetail>(
                BUSINESS_COPILOT_FILTER_EVENT,
                {
                  detail: {
                    page: "applications",
                    search,
                    campaignId,
                    status,
                  },
                }
              )
            );
          });
        }
      }
      if (pathBase === "/admin/work-validation") {
        const search = (mergedQuery.search || mergedQuery.q || "").trim();
        const campaignId = (mergedQuery.campaignId || "").trim();
        const workStatus = (
          mergedQuery.workStatus ||
          mergedQuery.work_status ||
          ""
        ).trim();
        if (search || campaignId || workStatus) {
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent<CopilotWorkValidationFilterDetail>(
                BUSINESS_COPILOT_FILTER_EVENT,
                {
                  detail: {
                    page: "workValidation",
                    search,
                    campaignId,
                    workStatus,
                  },
                }
              )
            );
          });
        }
      }
    }

    return JSON.stringify({
      ok: true,
      navigatedTo: href,
      appliedSearch: mergedQuery.search || mergedQuery.q || null,
      search_hint: hint || null,
      appliedPartnersFilters:
        pathBase === "/admin/partners"
          ? {
              minFollowers: mergedQuery.minFollowers || null,
              maxFollowers: mergedQuery.maxFollowers || null,
              platform: mergedQuery.platform || null,
              engagement: mergedQuery.engagement || null,
              niche: mergedQuery.niche || null,
              category: mergedQuery.category || null,
            }
          : undefined,
    });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
  }
}
