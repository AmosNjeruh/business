/**
 * Fetches vendor API data for the Business Suite copilot so the model can answer
 * with real numbers (analytics, campaigns, etc.) instead of asking what the user sees.
 */

export type RouterQuery = Record<string, string | string[] | undefined>;
import {
  getAnalytics,
  getApplication,
  getApplications,
  getCampaign,
  getCampaignAnalytics,
  getCampaignMetricsDto,
  getCampaignMetricsTimeSeries,
  getCampaigns,
  getPartner,
  getTimeSeriesAnalytics,
  getVendorBalance,
  getWorkSubmissions,
  getInfluencers,
} from "@/services/vendor";
import {
  vendorGetChallenge,
  vendorGetChallengeSocialMetrics,
  vendorGetChallengeSocialMetricsTimeSeries,
  vendorGetLeaderboard,
  vendorListChallenges,
} from "@/services/challenges";

export function queryParam(q: RouterQuery, key: string): string | undefined {
  const v = q[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && v[0] != null && String(v[0]).trim()) return String(v[0]).trim();
  return undefined;
}

function sliceTs(ts: unknown, maxPoints: number): Array<{ date?: string; value?: number }> {
  const pts = (ts as { dataPoints?: unknown[] } | null)?.dataPoints;
  if (!Array.isArray(pts)) return [];
  return pts.slice(-maxPoints).map((p: any) => ({
    date: p?.date != null ? String(p.date) : undefined,
    value: typeof p?.value === "number" ? p.value : Number(p?.value ?? 0) || 0,
  }));
}

function compactCampaign(c: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!c || typeof c !== "object") return null;
  const apps = c["applications"];
  return {
    id: c["id"],
    title: c["title"],
    status: c["status"],
    budget: c["budget"],
    remainingBudget: c["remainingBudget"],
    startDate: c["startDate"],
    endDate: c["endDate"],
    applicationCount: Array.isArray(apps) ? apps.length : undefined,
  };
}

function trimByPlatform(rows: unknown, max = 14): unknown[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, max).map((r: any) => ({
    platform: r?.platform,
    posts: r?.posts,
    views: r?.views,
    impressions: r?.impressions,
    reach: r?.reach,
    likes: r?.likes,
    comments: r?.comments,
    shares: r?.shares,
    engagementRate: r?.engagementRate,
  }));
}

function compactWorkspaceAnalytics(a: Record<string, unknown>): Record<string, unknown> {
  const topCampaigns = Array.isArray(a.topCampaigns) ? a.topCampaigns : [];
  const topPartners = Array.isArray(a.topPartners) ? a.topPartners : [];
  return {
    totalCampaigns: a.totalCampaigns,
    activeCampaigns: a.activeCampaigns,
    totalBudget: a.totalBudget,
    spentBudget: a.spentBudget,
    remainingBudget: a.remainingBudget,
    totalApplications: a.totalApplications,
    pendingApplications: a.pendingApplications,
    approvedApplications: a.approvedApplications,
    rejectedApplications: a.rejectedApplications,
    totalWorkSubmissions: a.totalWorkSubmissions,
    approvedWork: a.approvedWork,
    rejectedWork: a.rejectedWork,
    activePartners: a.activePartners,
    totalConversions: a.totalConversions,
    totalEarned: a.totalEarned,
    conversionRate: a.conversionRate,
    pendingReviewsCount: a.pendingReviewsCount,
    topCampaigns: topCampaigns.slice(0, 6).map((c: any) => ({
      title: c?.title ?? c?.name,
      id: c?.id,
      spent: c?.spent ?? c?.spentBudget,
      applications: c?.applications ?? c?.applicationCount,
    })),
    topPartners: topPartners.slice(0, 6).map((p: any) => ({
      name: p?.name ?? p?.partnerName,
      id: p?.id,
      earned: p?.earned ?? p?.totalEarned,
    })),
  };
}

async function snapshotCampaignAnalytics(campaignId: string): Promise<Record<string, unknown>> {
  const workflowRange = "30d" as const;
  const [
    campaign,
    metricsDto,
    perf,
    tsApps,
    tsApprovals,
    tsCompletions,
    tsSpend,
    snap,
  ] = await Promise.all([
    getCampaign(campaignId).catch(() => null),
    getCampaignMetricsDto(campaignId).catch(() => null),
    getCampaignAnalytics({ campaignId, timeRange: workflowRange }).catch(() => null),
    getTimeSeriesAnalytics({
      metric: "applications",
      timeRange: workflowRange,
      groupBy: "day",
      campaignId,
    }).catch(() => null),
    getTimeSeriesAnalytics({
      metric: "approvals",
      timeRange: workflowRange,
      groupBy: "day",
      campaignId,
    }).catch(() => null),
    getTimeSeriesAnalytics({
      metric: "completions",
      timeRange: workflowRange,
      groupBy: "day",
      campaignId,
    }).catch(() => null),
    getTimeSeriesAnalytics({
      metric: "spend",
      timeRange: workflowRange,
      groupBy: "day",
      campaignId,
    }).catch(() => null),
    getCampaignMetricsTimeSeries(campaignId, "24h").catch(() => null),
  ]);

  const perfObj =
    perf && typeof perf === "object" && !Array.isArray(perf)
      ? Object.fromEntries(
          Object.entries(perf as object).filter(
            ([, v]) =>
              typeof v === "number" ||
              typeof v === "string" ||
              typeof v === "boolean" ||
              v === null
          )
        )
      : null;

  return {
    kind: "campaign_analytics",
    fetchedAt: new Date().toISOString(),
    campaignId,
    campaign: compactCampaign(campaign as Record<string, unknown>),
    socialMetrics: metricsDto
      ? {
          totals: (metricsDto as any).totals ?? null,
          byPlatform: trimByPlatform((metricsDto as any).byPlatform),
        }
      : null,
    programSummary: perfObj,
    workflowDaily30d: {
      applications: sliceTs(tsApps, 21),
      approvals: sliceTs(tsApprovals, 21),
      completions: sliceTs(tsCompletions, 21),
      spend: sliceTs(tsSpend, 21),
    },
    metricSnapshots24h: snap
      ? {
          window: (snap as any).window,
          bucketMinutes: (snap as any).bucketMinutes,
          points: Array.isArray((snap as any).points)
            ? (snap as any).points.slice(-40)
            : [],
        }
      : null,
  };
}

async function snapshotChallengeAnalytics(challengeId: string): Promise<Record<string, unknown>> {
  const raw = await vendorGetChallenge(challengeId).catch(() => null);
  if (!raw) return { kind: "challenge_analytics", challengeId, error: "load_failed" };
  const ch: any = (raw as any)?.challenge ?? raw;
  const stats = (raw as any)?.stats ?? null;
  const socialTypes = ["LIKES", "SHARES", "VIEWS"];
  const [social, lb, snap] = await Promise.all([
    socialTypes.includes(String(ch?.metricType))
      ? vendorGetChallengeSocialMetrics(challengeId).catch(() => null)
      : Promise.resolve(null),
    vendorGetLeaderboard(challengeId).catch(() => ({ entries: [] })),
    socialTypes.includes(String(ch?.metricType))
      ? vendorGetChallengeSocialMetricsTimeSeries(challengeId, "24h").catch(() => null)
      : Promise.resolve(null),
  ]);
  const entries = (lb as any)?.entries ?? [];
  return {
    kind: "challenge_analytics",
    fetchedAt: new Date().toISOString(),
    challengeId,
    challenge: {
      id: ch?.id,
      title: ch?.title,
      status: ch?.status,
      metricType: ch?.metricType,
      prizeBudget: ch?.prizeBudget,
      startDate: ch?.startDate,
      endDate: ch?.endDate,
    },
    stats: stats && typeof stats === "object" ? stats : null,
    socialTotals: social?.totals ?? null,
    byPlatform: trimByPlatform((social as any)?.byPlatform ?? []),
    leaderboardTop: entries.slice(0, 12).map((e: any) => ({
      partnerName: e?.partnerName,
      percentComplete: e?.percentComplete,
      rank: e?.rank,
    })),
    metricSnapshots24h: snap
      ? {
          window: (snap as any).window,
          bucketMinutes: (snap as any).bucketMinutes,
          points: Array.isArray((snap as any).points)
            ? (snap as any).points.slice(-40)
            : [],
        }
      : null,
  };
}

/**
 * Load a compact, API-backed snapshot for the current Business Suite route.
 */
export async function loadBusinessAssistantLiveSnapshot(
  pathname: string,
  query: RouterQuery
): Promise<Record<string, unknown> | null> {
  try {
    if (pathname === "/admin" || pathname === "/admin/") {
      const a = await getAnalytics({ timeRange: "7d" }).catch(() => null);
      if (!a) return { kind: "workspace_home", fetchedAt: new Date().toISOString(), analytics: null };
      return {
        kind: "workspace_home",
        fetchedAt: new Date().toISOString(),
        analytics: compactWorkspaceAnalytics(a as unknown as Record<string, unknown>),
      };
    }

    if (pathname === "/admin/analytics") {
      const a = await getAnalytics({ timeRange: "30d" }).catch(() => null);
      if (!a) return { kind: "workspace_analytics", fetchedAt: new Date().toISOString(), analytics: null };
      return {
        kind: "workspace_analytics",
        fetchedAt: new Date().toISOString(),
        analytics: compactWorkspaceAnalytics(a as unknown as Record<string, unknown>),
      };
    }

    if (pathname === "/admin/finance") {
      const b = await getVendorBalance().catch(() => null);
      return {
        kind: "finance",
        fetchedAt: new Date().toISOString(),
        balance: b?.balance ?? null,
      };
    }

    if (pathname === "/admin/campaigns") {
      const res = await getCampaigns({ limit: 30 }).catch(() => ({ data: [] }));
      const rows = (res as any)?.data ?? [];
      return {
        kind: "campaigns_list",
        fetchedAt: new Date().toISOString(),
        campaigns: rows.map((c: any) => ({
          id: c?.id,
          title: c?.title,
          status: c?.status,
          budget: c?.budget,
          remainingBudget: c?.remainingBudget,
        })),
      };
    }

    if (pathname === "/admin/challenges") {
      const res = await vendorListChallenges({ limit: 30 }).catch(() => ({ data: [] }));
      const rows = (res as any)?.data ?? [];
      return {
        kind: "challenges_list",
        fetchedAt: new Date().toISOString(),
        challenges: rows.map((c: any) => ({
          id: c?.id,
          title: c?.title,
          status: c?.status,
          metricType: c?.metricType,
        })),
      };
    }

    if (pathname === "/admin/applications") {
      const res = await getApplications({ limit: 50 }).catch(() => ({ data: [] }));
      const rows = (res as any)?.data ?? [];
      const byStatus: Record<string, number> = {};
      for (const a of rows) {
        const s = String((a as any)?.status ?? "UNKNOWN");
        byStatus[s] = (byStatus[s] ?? 0) + 1;
      }
      return {
        kind: "applications",
        fetchedAt: new Date().toISOString(),
        statusCounts: byStatus,
        sample: rows.slice(0, 15).map((a: any) => ({
          id: a?.id,
          status: a?.status,
          campaignTitle: a?.campaign?.title,
          partnerName: a?.partner?.name,
        })),
      };
    }

    if (pathname === "/admin/partners") {
      const res = await getInfluencers({ limit: 24 }).catch(() => ({ data: [] }));
      const rows = (res as any)?.data ?? [];
      return {
        kind: "partners_discovery",
        fetchedAt: new Date().toISOString(),
        resultCount: rows.length,
        sample: rows.slice(0, 20).map((p: any) => ({
          id: p?.id,
          name: p?.name ?? p?.displayName,
          totalFollowers: p?.totalFollowers,
          primaryPlatform: p?.primaryPlatform,
        })),
      };
    }

    if (pathname === "/admin/work-validation") {
      const res = await getWorkSubmissions({ limit: 40 }).catch(() => ({ data: [] }));
      const rows = (res as any)?.data ?? [];
      return {
        kind: "work_validation_queue",
        fetchedAt: new Date().toISOString(),
        count: rows.length,
        sample: rows.slice(0, 18).map((w: any) => ({
          applicationId: w?.applicationId ?? w?.id,
          status: w?.workStatus ?? w?.status,
          campaignTitle: w?.campaign?.title,
          partnerName: w?.partner?.name ?? w?.partnerName,
        })),
      };
    }

    const id = queryParam(query, "id");

    if (pathname === "/admin/campaigns/[id]/analytics" && id) {
      return await snapshotCampaignAnalytics(id);
    }

    if (
      (pathname === "/admin/campaigns/[id]" || pathname === "/admin/campaigns/[id]/edit") &&
      id
    ) {
      const c = await getCampaign(id).catch(() => null);
      const apps = (c as any)?.applications ?? [];
      return {
        kind: pathname.includes("edit") ? "campaign_edit" : "campaign_detail",
        fetchedAt: new Date().toISOString(),
        campaign: compactCampaign(c as Record<string, unknown>),
        applicationsSummary: {
          total: apps.length,
          pending: apps.filter((a: any) => String(a?.status) === "PENDING").length,
          approved: apps.filter((a: any) => String(a?.status) === "APPROVED").length,
          rejected: apps.filter((a: any) => String(a?.status) === "REJECTED").length,
        },
      };
    }

    if (pathname === "/admin/challenges/[id]/analytics" && id) {
      return await snapshotChallengeAnalytics(id);
    }

    if (
      (pathname === "/admin/challenges/[id]" ||
        pathname === "/admin/challenges/[id]/edit") &&
      id
    ) {
      const raw = await vendorGetChallenge(id).catch(() => null);
      const ch: any = raw ? ((raw as any)?.challenge ?? raw) : null;
      return {
        kind: pathname.includes("edit") ? "challenge_edit" : "challenge_detail",
        fetchedAt: new Date().toISOString(),
        challenge: ch
          ? {
              id: ch.id,
              title: ch.title,
              status: ch.status,
              metricType: ch.metricType,
              prizeBudget: ch.prizeBudget,
              startDate: ch.startDate,
              endDate: ch.endDate,
            }
          : null,
        stats: raw && (raw as any).stats ? (raw as any).stats : null,
      };
    }

    if (pathname === "/admin/partners/[id]" && id) {
      const p = await getPartner(id).catch(() => null);
      if (!p) return { kind: "partner_profile", partnerId: id, error: "load_failed" };
      const accounts = (p as any).socialMediaAccounts ?? [];
      return {
        kind: "partner_profile",
        fetchedAt: new Date().toISOString(),
        partnerId: id,
        name: (p as any).name ?? (p as any).displayName,
        bio:
          typeof (p as any).bio === "string"
            ? String((p as any).bio).slice(0, 600)
            : undefined,
        socialAccounts: accounts.slice(0, 10).map((a: any) => ({
          platform: a?.platform,
          followers: a?.followers,
          engagementRate: a?.engagementRate,
          handle: a?.handle ?? a?.username,
        })),
      };
    }

    if (pathname === "/admin/work-validation/[id]" && id) {
      const app = await getApplication(id).catch(() => null);
      const posts = (app as any)?.posts ?? [];
      return {
        kind: "work_validation_detail",
        fetchedAt: new Date().toISOString(),
        applicationId: id,
        status: (app as any)?.status,
        partnerName: (app as any)?.partner?.name,
        campaignTitle: (app as any)?.campaign?.title,
        postsCount: posts.length,
        postsSample: posts.slice(0, 8).map((post: any) => ({
          platform: post?.platform,
          validated: post?.validated,
          views: post?.views,
          likes: post?.likes,
        })),
      };
    }

    return null;
  } catch (e) {
    return {
      kind: "snapshot_error",
      route: pathname,
      message: e instanceof Error ? e.message : "unknown_error",
      fetchedAt: new Date().toISOString(),
    };
  }
}
