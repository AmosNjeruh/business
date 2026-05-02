// Challenge Analytics — dedicated deep-dive page for brands/vendors.
// Shows only approved-post data for rankings & platform metrics, matching
// the same approval-gate enforced in management (finalboss) portal.
// Route: /admin/challenges/[id]/analytics

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/Layout';
import {
  vendorGetChallenge,
  vendorGetChallengeSocialMetrics,
  vendorGetChallengeSocialMetricsTimeSeries,
  vendorGetLeaderboard,
  vendorGetSubmissions,
  type Challenge,
  type ChallengeMetricsTimeSeriesWindow,
  type LeaderboardEntry,
  type ChallengeSubmission,
  type PlatformMetrics,
} from '@/services/challenges';
import { useCurrency } from '@/hooks/useCurrency';
import {
  FaSpinner, FaTrophy, FaUsers, FaChartBar, FaCheckCircle, FaArrowLeft,
  FaSyncAlt, FaExternalLinkAlt, FaInstagram, FaTiktok, FaYoutube, FaTwitter,
  FaFacebook, FaLinkedin, FaCoins, FaBolt, FaCalendarAlt, FaFilter,
} from 'react-icons/fa';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const USD_TO_KES_RATE = 130;

const TS_WINDOWS: ChallengeMetricsTimeSeriesWindow[] = ['30m', '1h', '2h', '12h', '24h'];

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: '#E4405F', FACEBOOK: '#1877F2', YOUTUBE: '#FF0000',
  TIKTOK: '#000000', TWITTER: '#1DA1F2', X: '#1DA1F2',
  LINKEDIN: '#0A66C2', OTHER: '#6B7280',
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <FaInstagram />, facebook: <FaFacebook />, youtube: <FaYoutube />,
  tiktok: <FaTiktok />, twitter: <FaTwitter />, x: <FaTwitter />,
  linkedin: <FaLinkedin />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function platformColor(p: string): string {
  return PLATFORM_COLORS[String(p).toUpperCase()] ?? '#6B7280';
}

function platformLabel(p: string): string {
  if (!p) return '—';
  const lower = p.toLowerCase();
  if (lower === 'youtube') return 'YouTube';
  if (lower === 'tiktok') return 'TikTok';
  if (lower === 'twitter' || lower === 'x') return 'X / Twitter';
  if (lower === 'instagram') return 'Instagram';
  if (lower === 'facebook') return 'Facebook';
  if (lower === 'linkedin') return 'LinkedIn';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function platformIcon(p: string): React.ReactNode {
  return PLATFORM_ICONS[p.toLowerCase()] ?? <FaChartBar />;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Small reusable components ────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ReactNode; accent: string;
}> = ({ label, value, sub, icon, accent }) => (
  <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm bg-gradient-to-br ${accent}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">{value}</p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="text-2xl opacity-70 shrink-0">{icon}</div>
    </div>
  </div>
);

const Section: React.FC<{
  title: string; subtitle?: string; icon?: React.ReactNode;
  right?: React.ReactNode; children: React.ReactNode; className?: string;
}> = ({ title, subtitle, icon, right, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm ${className}`}>
    <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          {icon && <span className="text-indigo-500">{icon}</span>}
          {title}
        </h3>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const PlatformBadge: React.FC<{ platform: string }> = ({ platform }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
    style={{ backgroundColor: platformColor(platform) }}
  >
    {platformIcon(platform)}
    {platformLabel(platform)}
  </span>
);

const PillToggle: React.FC<{
  options: string[]; value: string; onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-1">
    {options.map((o) => (
      <button
        key={o}
        onClick={() => onChange(o)}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
          value === o
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {o}
      </button>
    ))}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

type ActiveSection = 'overview' | 'platforms' | 'approved' | 'leaderboard' | 'timeline';

export default function ChallengeAnalyticsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { formatPrice, formatFromUSD } = useCurrency();

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [social, setSocial] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [approvedSubs, setApprovedSubs] = useState<ChallengeSubmission[]>([]);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [approvedPage, setApprovedPage] = useState(1);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [refreshingLb, setRefreshingLb] = useState(false);
  const [snapWindow, setSnapWindow] = useState<ChallengeMetricsTimeSeriesWindow>('24h');
  const [snapshotTs, setSnapshotTs] = useState<any>(null);
  const [section, setSection] = useState<ActiveSection>('overview');

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadApproved = useCallback(async (page = 1) => {
    if (!id || typeof id !== 'string') return;
    setLoadingApproved(true);
    try {
      const res = await vendorGetSubmissions(id, { status: 'APPROVED', page, limit: 20 });
      setApprovedSubs(res?.submissions ?? []);
      setApprovedTotal(res?.total ?? 0);
      setApprovedPage(page);
    } catch {
      setApprovedSubs([]);
    } finally {
      setLoadingApproved(false);
    }
  }, [id]);

  const loadLeaderboard = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const res = await vendorGetLeaderboard(id);
      setLeaderboard(res?.entries ?? []);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [challengeRes, lbRes, approvedRes] = await Promise.allSettled([
          vendorGetChallenge(id),
          vendorGetLeaderboard(id),
          vendorGetSubmissions(id, { status: 'APPROVED', page: 1, limit: 20 }),
        ]);

        if (challengeRes.status === 'fulfilled') {
          const raw = challengeRes.value as any;
          const ch: Challenge = raw?.challenge ?? raw;
          const st = raw?.stats ?? null;
          if (!cancelled) { setChallenge(ch); setStats(st); }

          // Always load social metrics regardless of metric type
          vendorGetChallengeSocialMetrics(id)
            .then((soc) => { if (!cancelled) setSocial(soc); })
            .catch(() => {});
        }
        if (lbRes.status === 'fulfilled' && !cancelled) {
          setLeaderboard(lbRes.value?.entries ?? []);
        }
        if (approvedRes.status === 'fulfilled' && !cancelled) {
          setApprovedSubs(approvedRes.value?.submissions ?? []);
          setApprovedTotal(approvedRes.value?.total ?? 0);
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.error || 'Failed to load challenge analytics');
        router.push('/admin/challenges');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, router]);

  // Timeseries whenever window or challenge changes
  useEffect(() => {
    if (!id || typeof id !== 'string' || !challenge) return;
    let cancelled = false;
    (async () => {
      const snap = await vendorGetChallengeSocialMetricsTimeSeries(id, snapWindow).catch(() => null);
      if (!cancelled) setSnapshotTs(snap);
    })();
    return () => { cancelled = true; };
  }, [id, snapWindow, challenge?.metricType]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const totals = social?.totals ?? null;

  const byPlatform: PlatformMetrics[] = useMemo(
    () => (social?.byPlatform ?? []).filter((p: any) => p.platform),
    [social]
  );

  // Per-platform stats from the current page of approved submissions (fallback when social metrics unavailable)
  const approvedByPlatform = useMemo(() => {
    const map: Record<string, { platform: string; posts: number; totalMetric: number; partners: Set<string> }> = {};
    for (const s of approvedSubs) {
      const p = (s as any).detectedPlatform || 'other';
      if (!map[p]) map[p] = { platform: p, posts: 0, totalMetric: 0, partners: new Set() };
      map[p]!.posts++;
      map[p]!.totalMetric += s.detectedMetricValue ?? 0;
      if (s.partner?.id) map[p]!.partners.add(s.partner.id);
    }
    return Object.values(map).sort((a, b) => b.totalMetric - a.totalMetric);
  }, [approvedSubs]);

  // Prefer full social-metrics byPlatform (all approved, from DB) over the paginated approvedSubs slice
  const platformPostCounts = useMemo(() => {
    if (byPlatform.length > 0) {
      return byPlatform.map((p) => ({
        platform: String(p.platform),
        posts: p.posts ?? 0,
        totalMetric: Math.max(
          (p as any).reach ?? 0,
          (p as any).views ?? 0,
          (p as any).impressions ?? 0,
          (p as any).likes ?? 0,
        ),
      })).filter((p) => p.posts > 0).sort((a, b) => b.posts - a.posts);
    }
    return approvedByPlatform.map((p) => ({
      platform: p.platform,
      posts: p.posts,
      totalMetric: p.totalMetric,
    }));
  }, [byPlatform, approvedByPlatform]);

  const pieData = useMemo(() => {
    // Prefer social-metrics byPlatform for reach/views; fall back to approved-subs platform split
    const source = byPlatform.length > 0 ? byPlatform : approvedByPlatform.map((p) => ({
      platform: p.platform,
      posts: p.posts,
      reach: p.totalMetric,
      views: 0, impressions: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0,
    }));
    return source
      .map((p) => ({
        name: platformLabel(String(p.platform)),
        platform: String(p.platform).toUpperCase(),
        value: Math.max(
          Number((p as any).reach ?? 0),
          Number((p as any).views ?? 0),
          Number((p as any).impressions ?? 0),
          Number((p as any).likes ?? 0),
          Number(p.posts ?? 0),
        ),
      }))
      .filter((e) => e.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [byPlatform, approvedByPlatform]);

  const snapChartData = useMemo(() => {
    return (snapshotTs?.points ?? []).map((p: any) => ({
      t: new Date(p.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      reach: p.reach ?? 0,
      views: p.views ?? 0,
    }));
  }, [snapshotTs]);

  const platformBarData = useMemo(() => {
    const source = byPlatform.length > 0 ? byPlatform : approvedByPlatform.map((p) => ({
      platform: p.platform, posts: p.posts,
      reach: 0, likes: 0, comments: 0, shares: 0,
    }));
    return source
      .filter((p) => (p.posts ?? 0) > 0)
      .map((p) => ({
        name: platformLabel(String(p.platform)),
        Posts: p.posts ?? 0,
        Reach: (p as any).reach ?? 0,
        Likes: (p as any).likes ?? 0,
        Comments: (p as any).comments ?? 0,
        Shares: (p as any).shares ?? 0,
      }));
  }, [byPlatform, approvedByPlatform]);

  const budget = useMemo(() => {
    if (!challenge) return { prize: 0, setup: 0, cut: 0, net: 0 };
    const prize = Number(challenge.prizeBudget ?? 0);
    const setup = Number(challenge.platformSetupFee ?? 0);
    const cutFromStats = stats?.platformCut != null ? Number(stats.platformCut) : NaN;
    const netFromStats = stats?.netPrizePool != null ? Number(stats.netPrizePool) : NaN;
    const pct = Number(challenge.platformPercentageFee ?? 0);
    const cut = Number.isFinite(cutFromStats) ? cutFromStats : setup + (prize * pct) / 100;
    const net = Number.isFinite(netFromStats) ? netFromStats : Math.max(0, prize - cut);
    return { prize, setup, cut, net };
  }, [challenge, stats]);

  const participants = stats?.totalParticipants ?? challenge?._count?.participations ?? challenge?.totalParticipants ?? 0;
  const goalReached = stats?.goalReachedCount ?? 0;
  const completionRate = participants > 0 ? Math.round((goalReached / participants) * 100) : 0;

  // CPM: prize budget / (impressions / 1000)
  const cpm = useMemo(() => {
    const impressions = totals?.impressions > 0 ? totals.impressions : totals?.reach > 0 ? totals.reach : 0;
    if (!budget.prize || !impressions) return null;
    return formatFromUSD((budget.prize / impressions) * 1000);
  }, [budget.prize, totals, formatFromUSD]);

  // Insights
  const insights = useMemo(() => {
    const out: string[] = [];
    if (leaderboard[0]) {
      const top = leaderboard[0];
      out.push(`Top performer: ${top.partnerName} at ${top.percentComplete?.toFixed(1) ?? 0}% of goal.`);
    }
    if (approvedTotal > 0) {
      out.push(`${approvedTotal} approved post${approvedTotal !== 1 ? 's' : ''} across ${platformPostCounts.length} platform${platformPostCounts.length !== 1 ? 's' : ''}.`);
    }
    if (platformPostCounts.length > 0) {
      const best = platformPostCounts[0]!;
      out.push(`${platformLabel(best.platform)} leads with ${best.posts} approved post${best.posts !== 1 ? 's' : ''}${best.totalMetric > 0 ? ` and ${fmtNum(best.totalMetric)} metric units` : ''}.`);
    }
    if (cpm) out.push(`Estimated CPM: ${cpm} (prize budget vs aggregate impressions from approved posts).`);
    if (completionRate > 0) out.push(`${completionRate}% of participants hit their goal (${goalReached}/${participants}).`);
    return out.slice(0, 5);
  }, [leaderboard, approvedTotal, platformPostCounts, cpm, completionRate, goalReached, participants]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || !challenge) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-indigo-600" />
        </div>
      </AdminLayout>
    );
  }

  const SECTIONS: { id: ActiveSection; label: string }[] = [
    { id: 'overview',    label: 'Overview' },
    { id: 'platforms',   label: 'Platforms' },
    { id: 'approved',    label: `Approved posts (${approvedTotal})` },
    { id: 'leaderboard', label: `Leaderboard (${leaderboard.length})` },
    { id: 'timeline',    label: 'Timeline' },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

        {/* ── Header ── */}
        <div className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={`/admin/challenges/${challenge.id}`}>
                <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <FaArrowLeft size={13} />
                </button>
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Challenge Analytics</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    challenge.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                    challenge.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>{challenge.status}</span>
                </div>
                <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">{challenge.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 shrink-0 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-semibold text-[10px]">
                <FaCheckCircle size={8} /> Approved posts only
              </span>
              <FaBolt size={10} className="text-orange-400" />
              {challenge.metricType}
              <span className="hidden sm:inline">·</span>
              <FaCalendarAlt size={10} className="hidden sm:inline" />
              <span className="hidden sm:inline">{formatDate(challenge.startDate)} → {formatDate(challenge.endDate)}</span>
            </div>
          </div>

          {/* Section nav */}
          <div className="max-w-6xl mx-auto px-3 sm:px-6 flex gap-1 pb-1 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  section === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">

          {/* ── KPI strip (always visible) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Participants" value={participants.toLocaleString()}
              sub={`${goalReached} hit goal (${completionRate}%)`}
              icon={<FaUsers className="text-blue-500" />}
              accent="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
            />
            <StatCard
              label="Approved posts" value={approvedTotal.toLocaleString()}
              sub={`${approvedByPlatform.length} platform${approvedByPlatform.length !== 1 ? 's' : ''} covered`}
              icon={<FaCheckCircle className="text-green-500" />}
              accent="from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800"
            />
            <StatCard
              label={totals ? 'Total reach' : 'Leaderboard entries'}
              value={totals ? fmtNum(totals.reach ?? totals.views ?? totals.impressions) : leaderboard.length}
              sub={totals ? `${fmtNum(totals.engagementRate ?? 0)}% engagement` : 'Ranked by metric'}
              icon={<FaChartBar className="text-purple-500" />}
              accent="from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
            />
            <StatCard
              label="Prize pool" value={formatFromUSD(budget.prize)}
              sub={cpm ? `CPM: ${cpm}` : `Net: ${formatFromUSD(budget.net)}`}
              icon={<FaCoins className="text-yellow-500" />}
              accent="from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800"
            />
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SECTION: OVERVIEW
          ════════════════════════════════════════════════════════════════ */}
          {section === 'overview' && (
            <div className="space-y-5">

              {/* Insights */}
              {insights.length > 0 && (
                <Section title="Key insights" subtitle="Auto-generated from live data" icon={<FaTrophy size={13} />}>
                  <ul className="space-y-2">
                    {insights.map((ins, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-1 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Fee breakdown */}
                <Section title="Budget & fees" icon={<FaCoins size={13} />}>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Prize budget',   value: formatFromUSD(budget.prize),  bold: false },
                      { label: 'Platform fees',  value: formatFromUSD(budget.cut),    bold: false, muted: true },
                      { label: 'Net prize pool', value: formatFromUSD(budget.net),    bold: true },
                    ].map((row) => (
                      <div key={row.label} className={`flex justify-between text-sm ${row.bold ? 'font-bold pt-2 border-t border-gray-100 dark:border-gray-700' : ''}`}>
                        <span className={row.muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}>{row.label}</span>
                        <span className={row.bold ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}>{row.value}</span>
                      </div>
                    ))}
                    {cpm && (
                      <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Effective CPM </span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">{cpm}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(prize ÷ 1K impressions)</span>
                      </div>
                    )}
                  </div>
                </Section>

                {/* Completion rate */}
                <Section title="Completion rate" subtitle="Partners who hit the goal">
                  <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-3">{completionRate}%</div>
                  <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {goalReached} of {participants} partners reached the {challenge.metricType.toLowerCase()} goal of{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">{challenge.goalValue?.toLocaleString()}</span>
                  </p>

                  {/* Approved-posts platform mini-bar — uses full social-metrics data when available */}
                  {platformPostCounts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Approved posts by platform</p>
                      {platformPostCounts.map((p) => {
                        const max = platformPostCounts[0]!.posts;
                        return (
                          <div key={p.platform} className="flex items-center gap-3">
                            <PlatformBadge platform={p.platform} />
                            <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.round((p.posts / max) * 100)}%`, backgroundColor: platformColor(p.platform) }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white w-6 text-right">{p.posts}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Section>
              </div>

              {/* Social totals strip */}
              {totals && (totals.posts > 0 || totals.reach > 0 || totals.likes > 0) && (
                <Section title="Social aggregate" subtitle="Approved posts only — all metrics are gated to moderation-approved submissions" icon={<FaChartBar size={13} />}>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {[
                      { label: 'Posts',        value: totals.posts },
                      { label: 'Reach',        value: totals.reach },
                      { label: 'Impressions',  value: totals.impressions },
                      { label: 'Likes',        value: totals.likes },
                      { label: 'Comments',     value: totals.comments },
                      { label: 'Shares',       value: totals.shares },
                      { label: 'Views',        value: totals.views },
                    ]
                      .filter((m) => m.value > 0)
                      .map((m) => (
                        <div key={m.label} className="text-center min-w-[64px]">
                          <div className="text-xl font-extrabold text-gray-900 dark:text-white">{fmtNum(m.value)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{m.label}</div>
                        </div>
                      ))}
                    {(totals.engagementRate ?? 0) > 0 && (
                      <div className="text-center min-w-[64px]">
                        <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{totals.engagementRate}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Eng. rate</div>
                      </div>
                    )}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION: PLATFORMS
          ════════════════════════════════════════════════════════════════ */}
          {section === 'platforms' && (
            <div className="space-y-5">

              {/* Platform donut */}
              {pieData.length > 0 && (
                <Section title="Platform distribution" subtitle="Approved posts only — strongest signal per platform (reach / views / impressions / likes / post count)" icon={<FaChartBar size={13} />}>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-full max-w-[240px] h-[240px] mx-auto sm:mx-0 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2}>
                            {pieData.map((e) => (
                              <Cell key={e.name} fill={platformColor(e.platform)} stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => fmtNum(Number(v))} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center total */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-gray-900 dark:text-gray-100">{fmtNum(pieData.reduce((s, e) => s + e.value, 0))}</span>
                        <span className="text-[10px] text-gray-400">total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      {pieData.map((e) => {
                        const tot = pieData.reduce((s, x) => s + x.value, 0);
                        const pct = tot > 0 ? Math.round((e.value / tot) * 100) : 0;
                        return (
                          <div key={e.name} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: platformColor(e.platform) }} />
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{e.name}</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums shrink-0">{pct}%</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums shrink-0">{fmtNum(e.value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Section>
              )}

              {/* Platform bar chart */}
              {platformBarData.length > 0 && (
                <Section title="Platform metrics comparison" subtitle="Approved posts only — posts, reach, likes, comments, shares per platform">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformBarData} margin={{ top: 8, right: 16, left: -8, bottom: 8 }} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.2)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={fmtNum} width={42} />
                        <Tooltip formatter={(v: any) => Number(v).toLocaleString()} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Posts"    fill="#6366f1" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Reach"    fill="#f97316" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Likes"    fill="#ec4899" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Comments" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Shares"   fill="#06b6d4" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Section>
              )}

              {/* Platform detail table */}
              {byPlatform.length > 0 && (
                <Section title="Platform data table" subtitle="Approved posts only — full metrics from social API">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                          {['Platform', 'Posts', 'Reach', 'Views', 'Impr.', 'Likes', 'Comments', 'Shares', 'Eng.%'].map((h) => (
                            <th key={h} className="pb-2 pr-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {byPlatform.map((p) => (
                          <tr key={String(p.platform)} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="py-3 pr-4 font-medium whitespace-nowrap">
                              <PlatformBadge platform={String(p.platform)} />
                            </td>
                            {[p.posts, (p as any).reach, (p as any).views, (p as any).impressions,
                              (p as any).likes, (p as any).comments, (p as any).shares].map((v, i) => (
                              <td key={i} className="py-3 pr-4 tabular-nums text-gray-700 dark:text-gray-300">{fmtNum(v)}</td>
                            ))}
                            <td className="py-3 pr-4 tabular-nums text-gray-700 dark:text-gray-300">{(p as any).engagementRate ?? 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}

              {byPlatform.length === 0 && platformPostCounts.length === 0 && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
                  Platform data will appear once approved posts are available.
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION: APPROVED POSTS
          ════════════════════════════════════════════════════════════════ */}
          {section === 'approved' && (
            <div className="space-y-5">
              <Section
                title={`Approved posts — ${approvedTotal} total`}
                subtitle="Only posts approved by the moderation team count toward rankings and metrics"
                icon={<FaCheckCircle size={13} />}
                right={
                  <button
                    onClick={() => loadApproved(approvedPage)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FaSyncAlt size={10} className={loadingApproved ? 'animate-spin' : ''} /> Refresh
                  </button>
                }
              >
                {/* Platform summary chips — uses full approved data from social metrics when available */}
                {platformPostCounts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    {platformPostCounts.map((p) => (
                      <span key={p.platform} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <PlatformBadge platform={p.platform} />
                        <span className="font-bold">{p.posts}</span> approved
                        {p.totalMetric > 0 && <span className="text-gray-400">· {fmtNum(p.totalMetric)} metric</span>}
                      </span>
                    ))}
                  </div>
                )}

                {loadingApproved ? (
                  <div className="flex items-center justify-center py-12">
                    <FaSpinner className="animate-spin text-2xl text-indigo-600" />
                  </div>
                ) : approvedSubs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                    No approved posts yet. Posts appear here once the moderation team approves them.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvedSubs.map((sub) => {
                      const platform = (sub as any).detectedPlatform || 'other';
                      return (
                        <div key={sub.id} className="flex flex-wrap items-start gap-4 p-4 rounded-xl border border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10">
                          {/* Partner */}
                          <div className="flex items-center gap-2 min-w-[140px]">
                            {sub.partner?.picture ? (
                              <img src={sub.partner.picture} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {sub.partner?.name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{sub.partner?.name ?? 'Partner'}</span>
                          </div>

                          {/* Platform */}
                          <PlatformBadge platform={platform} />

                          {/* Metric */}
                          {sub.detectedMetricValue != null && (
                            <div className="text-sm">
                              <span className="text-gray-500 dark:text-gray-400">{challenge.metricType.toLowerCase()}: </span>
                              <span className="font-bold text-gray-900 dark:text-white">{sub.detectedMetricValue.toLocaleString()}</span>
                            </div>
                          )}

                          {/* Post URL */}
                          {sub.postUrl && (
                            <a
                              href={sub.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[220px]"
                            >
                              <FaExternalLinkAlt size={9} className="shrink-0" />
                              View post
                            </a>
                          )}

                          {/* Date */}
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto shrink-0">
                            {new Date(sub.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {approvedTotal > 20 && (
                  <div className="flex items-center justify-center gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => loadApproved(approvedPage - 1)}
                      disabled={approvedPage <= 1 || loadingApproved}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page {approvedPage} of {Math.ceil(approvedTotal / 20)}
                    </span>
                    <button
                      onClick={() => loadApproved(approvedPage + 1)}
                      disabled={approvedPage >= Math.ceil(approvedTotal / 20) || loadingApproved}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION: LEADERBOARD
          ════════════════════════════════════════════════════════════════ */}
          {section === 'leaderboard' && (
            <Section
              title="Leaderboard"
              subtitle={`Ranked by ${challenge.metricType.toLowerCase()} · only partners with approved posts qualify`}
              icon={<FaTrophy size={13} />}
              right={
                <button
                  onClick={async () => {
                    setRefreshingLb(true);
                    await loadLeaderboard();
                    setRefreshingLb(false);
                    toast.success('Leaderboard refreshed');
                  }}
                  disabled={refreshingLb}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                >
                  <FaSyncAlt size={10} className={refreshingLb ? 'animate-spin' : ''} /> Refresh
                </button>
              }
            >
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <FaTrophy className="text-4xl text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No ranked participants yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Rankings appear once participants submit approved posts</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                        {['#', 'Partner', `${challenge.metricType} (now)`, 'Goal', '% done', 'Joined'].map((h) => (
                          <th key={h} className="pb-3 pr-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {leaderboard.map((e, idx) => (
                        <tr
                          key={e.partnerId}
                          className={idx < 3 ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors'}
                        >
                          <td className="py-3 pr-4 font-bold tabular-nums text-gray-900 dark:text-white w-8">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : e.rank}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {e.partnerPicture ? (
                                <img src={e.partnerPicture} alt="" className="w-7 h-7 rounded-full object-cover border border-white dark:border-gray-700" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                  {e.partnerName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{e.partnerName}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 tabular-nums font-semibold text-gray-900 dark:text-white">{e.metricValue?.toLocaleString?.() ?? e.metricValue}</td>
                          <td className="py-3 pr-4 tabular-nums text-gray-500 dark:text-gray-400">{e.goalValue?.toLocaleString?.() ?? e.goalValue}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${e.percentComplete >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${Math.min(100, e.percentComplete)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold tabular-nums ${e.percentComplete >= 100 ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {e.percentComplete?.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {e.joinedAt ? new Date(e.joinedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION: TIMELINE
          ════════════════════════════════════════════════════════════════ */}
          {section === 'timeline' && (
            <div className="space-y-5">
              <Section
                title="Metric motion over time"
                subtitle="Snapshots from the social metrics timeseries API"
                right={<PillToggle options={TS_WINDOWS} value={snapWindow} onChange={(v) => setSnapWindow(v as ChallengeMetricsTimeSeriesWindow)} />}
              >
                {snapChartData.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-10">
                    No snapshots in this time window yet. Try a wider window or check back once the challenge is active.
                  </p>
                ) : (
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={snapChartData} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.2)" />
                        <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={fmtNum} width={38} />
                        <Tooltip formatter={(v: any) => fmtNum(Number(v))} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="reach" name="Reach" stroke="#059669" dot={false} strokeWidth={2.5} />
                        <Line type="monotone" dataKey="views" name="Views" stroke="#0891b2" dot={false} strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 leading-snug">
                  The timeseries maps challenge goal metrics into reach/views fields. Available for all metric types once posts have been synced.
                </p>
              </Section>

              {/* Challenge parameters */}
              <Section title="Challenge parameters">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  {[
                    ['Status',        challenge.status],
                    ['Metric',        challenge.metricType],
                    ['Goal / partner', challenge.goalValue?.toLocaleString() ?? '—'],
                    ['Start',         formatDate(challenge.startDate)],
                    ['End',           formatDate(challenge.endDate)],
                    ['Prize (USD)',   String(challenge.prizeBudget ?? '—')],
                    ['Type',          challenge.type?.replace(/_/g, ' ') ?? '—'],
                    ['Platforms',     (challenge.socialPlatforms || []).join(', ') || 'All'],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">{k}</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-right truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
