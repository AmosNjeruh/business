// Business Suite – Enterprise API Access & Developer Portal
// Route: /admin/api-access

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/Layout";
import { getToken } from "@/services/auth";
import Api from "@/services/api";
import { getApiKeys, createApiKey, deleteApiKey, regenerateApiKey, ApiKeyData } from "@/services/vendor";
import toast from "react-hot-toast";
import {
  FaCode, FaCopy, FaEye, FaEyeSlash, FaCheck, FaBook,
  FaKey, FaGlobe, FaPlug, FaShieldAlt, FaBolt, FaChevronDown,
  FaPlus, FaTrash, FaRedo, FaClock, FaInfoCircle, FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiKey {
  id: string;
  name: string;
  prefix?: string;
  keyPrefix?: string;
  key?: string; // only returned once on creation
  rawKey?: string; // only returned once on creation
  lastUsed?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
  scopes?: string[];
  permissions?: string[];
  isActive: boolean;
  expiresAt?: string | null;
}

// ─── Endpoint reference ───────────────────────────────────────────────────────
const ENDPOINTS = [
  {
    group: "Campaigns",
    color: "emerald",
    endpoints: [
      { method: "GET", path: "/vendor/campaigns", desc: "List campaigns with pagination & filters" },
      { method: "POST", path: "/vendor/campaigns", desc: "Create a new campaign" },
      { method: "GET", path: "/vendor/campaigns/:id", desc: "Get campaign by ID" },
      { method: "PUT", path: "/vendor/campaigns/:id", desc: "Update a campaign" },
      { method: "DELETE", path: "/vendor/campaigns/:id", desc: "Delete a campaign" },
    ],
  },
  {
    group: "Applications",
    color: "blue",
    endpoints: [
      { method: "GET", path: "/vendor/applications", desc: "List applications (filter by campaignId, status)" },
      { method: "PUT", path: "/vendor/applications/:id", desc: "Update application status (APPROVED / REJECTED)" },
      { method: "POST", path: "/vendor/applications/:id/approve-work", desc: "Approve submitted work" },
    ],
  },
  {
    group: "Partners",
    color: "purple",
    endpoints: [
      { method: "GET", path: "/vendor/partners", desc: "List partners who have worked with you" },
      { method: "GET", path: "/vendor/influencers", desc: "Browse all influencers on the platform" },
      { method: "POST", path: "/vendor/invitations", desc: "Invite influencers to a campaign" },
    ],
  },
  {
    group: "Balance & Analytics",
    color: "indigo",
    endpoints: [
      { method: "GET", path: "/vendor/balance", desc: "Get your vendor wallet balance" },
      { method: "GET", path: "/vendor/balance/transactions", desc: "Transaction history" },
      { method: "GET", path: "/vendor/dashboard", desc: "Full dashboard stats and KPIs" },
      { method: "GET", path: "/vendor/analytics", desc: "Campaign analytics with date range" },
    ],
  },
];

const CODE_EXAMPLES: Record<string, string> = {
  curl: `# List your campaigns
curl -X GET "${API_BASE_URL}/vendor/campaigns" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Create a campaign
curl -X POST "${API_BASE_URL}/vendor/campaigns" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Summer 2026","budget":500,"startDate":"2026-06-01","endDate":"2026-06-30"}'`,

  javascript: `import axios from 'axios';

const trend360 = axios.create({
  baseURL: '${API_BASE_URL}',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
});

// List campaigns
const { data } = await trend360.get('/vendor/campaigns', {
  params: { status: 'ACTIVE', page: 1, limit: 20 },
});

// Create campaign
const campaign = await trend360.post('/vendor/campaigns', {
  title: 'Summer Launch 2026',
  budget: 500,
  paymentPerInfluencer: 50,
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  objective: 'BRAND_AWARENESS',
});`,

  typescript: `// Full type-safe integration
const BASE = '${API_BASE_URL}';

interface Campaign {
  id: string;
  title: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'PAUSED';
  budget: number;
  remainingBudget: number;
}

async function getCampaigns(apiKey: string): Promise<Campaign[]> {
  const res = await fetch(\`\${BASE}/vendor/campaigns\`, {
    headers: { Authorization: \`Bearer \${apiKey}\` },
  });
  return (await res.json()).data;
}

// Usage with env variable
const campaigns = await getCampaigns(process.env.TREND360_API_KEY!);`,

  python: `import requests

BASE = "${API_BASE_URL}"
HEADERS = {"Authorization": "Bearer YOUR_API_KEY"}

# List active campaigns
campaigns = requests.get(
    f"{BASE}/vendor/campaigns",
    headers=HEADERS,
    params={"status": "ACTIVE", "page": 1}
).json()["data"]

# Approve an application
requests.put(
    f"{BASE}/vendor/applications/{{app_id}}",
    headers=HEADERS,
    json={"status": "APPROVED"}
)`,
};

const METHOD_COLORS: Record<string, string> = {
  GET: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
  POST: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20",
  PUT: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
  DELETE: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
};

const SCOPES = ["campaigns:read", "campaigns:write", "applications:read", "applications:write", "partners:read", "analytics:read", "balance:read"];

function timeAgo(d: string | null): string {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ApiAccessPage() {
  const [sessionToken, setSessionToken] = useState("");
  const [showSessionToken, setShowSessionToken] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["campaigns:read", "applications:read"]);
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedNew, setCopiedNew] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [selectedLang, setSelectedLang] = useState<keyof typeof CODE_EXAMPLES>("javascript");
  const [copiedCode, setCopiedCode] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>("Campaigns");

  useEffect(() => {
    const t = getToken() || "";
    setSessionToken(t);
    fetchApiKeys();
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      setIsLoadingKeys(true);
      const res = await getApiKeys();
      setApiKeys(res.data || []);
    } catch {
      setApiKeys([]);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) { toast.error("Key name is required"); return; }
    setIsCreating(true);
    try {
      const key = await createApiKey({
        name: newKeyName.trim(),
        permissions: newKeyScopes,
      });
      setApiKeys((prev) => [key as any, ...prev]);
      setNewlyCreatedKey(key.rawKey || null);
      setNewKeyName("");
      setNewKeyScopes(["campaigns:read", "applications:read"]);
      toast.success("API key created successfully");
    } catch (err: any) {
      // If endpoint doesn't exist yet, show a useful message
      if (err?.response?.status === 404) {
        toast.error("API key management endpoint is not available yet. Use your session token below.");
      } else {
        toast.error(err?.response?.data?.error || "Failed to create API key");
      }
      setShowCreateModal(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Revoke "${keyName}"? This action cannot be undone.`)) return;
    setRevokingId(keyId);
    try {
      await deleteApiKey(keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast.success("API key revoked");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = async (text: string, onSuccess: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess();
    } catch { toast.error("Copy failed"); }
  };

  const displaySessionToken = showSessionToken
    ? sessionToken
    : sessionToken ? `${sessionToken.slice(0, 14)}${"•".repeat(36)}${sessionToken.slice(-4)}` : "No token";

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-white/8 p-6 sm:p-8">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-16 h-32 w-32 rounded-full bg-indigo-500/8 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center">
                  <FaCode className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">API Access</h1>
                  <p className="text-xs text-slate-400">Developer Portal — integrate Trend360 into your projects</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 max-w-full">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300"><FaBolt className="h-2.5 w-2.5" /> REST API</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300"><FaShieldAlt className="h-2.5 w-2.5" /> JWT Bearer Auth</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300"><FaGlobe className="h-2.5 w-2.5" /> JSON Responses</span>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all whitespace-nowrap flex-shrink-0">
              <FaPlus className="h-3.5 w-3.5" /> New API Key
            </button>
          </div>
        </div>

        {/* ── API Keys Management ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/8">
            <div className="flex items-center gap-2">
              <FaKey className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">API Keys</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">— generate long-lived keys for production use</span>
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
              <FaPlus className="h-3 w-3" /> Create Key
            </button>
          </div>

          {isLoadingKeys ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin h-5 w-5 text-emerald-500" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FaKey className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No API keys yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
                Create a named API key for your server or integration. Keys persist between sessions.
              </p>
              <button onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold text-xs">
                <FaPlus className="h-3 w-3" /> Create First Key
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {apiKeys.map((key) => (
                <div key={key.id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 ${!key.isActive ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${key.isActive ? "bg-amber-100 dark:bg-amber-500/10" : "bg-slate-100 dark:bg-white/5"}`}>
                      <FaKey className={`h-3.5 w-3.5 ${key.isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{key.name}</p>
                        {!key.isActive && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full border border-red-300 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">Revoked</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <code className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{(key.keyPrefix || key.prefix || 'sk_')}••••••••</code>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <FaClock className="h-2.5 w-2.5" /> Last used: {timeAgo(key.lastUsedAt || key.lastUsed || null)}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Created {fmtDate(key.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(key.permissions || key.scopes || []).slice(0, 4).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-[9px] font-mono font-medium rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/8">
                            {s}
                          </span>
                        ))}
                        {((key.permissions || key.scopes || []).length || 0) > 4 && (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">+{(key.permissions || key.scopes || []).length - 4} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {key.isActive && (
                    <button onClick={() => handleRevokeKey(key.id, key.name)} disabled={revokingId === key.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/15 disabled:opacity-50 transition-all flex-shrink-0">
                      {revokingId === key.id ? <FaSpinner className="animate-spin h-3 w-3" /> : <FaTrash className="h-3 w-3" />}
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Session Token ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Session Token</h2>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full border border-slate-200 dark:border-white/8">Expires with session</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Use this for quick testing. For production, use a named API key above.
          </p>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 p-3 flex items-center gap-2 min-h-[48px]">
            <code className="flex-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all leading-relaxed">{displaySessionToken}</code>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => setShowSessionToken((v) => !v)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                {showSessionToken ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => copyToClipboard(sessionToken, () => { setCopiedSession(true); toast.success("Copied"); setTimeout(() => setCopiedSession(false), 2000); })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                {copiedSession ? <FaCheck className="h-3.5 w-3.5 text-emerald-500" /> : <FaCopy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-3">
            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mb-1">⚠ Security</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400">Never commit tokens or keys to source control. Use environment variables: <code className="font-mono">TREND360_API_KEY</code></p>
          </div>
        </div>

        {/* ── Base URL ──────────────────────────────────────────────────────────── */}
        <div className="bus-responsive-two-col gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FaGlobe className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Connection Details</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Base URL</p>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5">
                  <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{API_BASE_URL}</code>
                  <button onClick={() => { navigator.clipboard.writeText(API_BASE_URL); toast.success("Copied"); }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors flex-shrink-0">
                    <FaCopy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Authorization Header</p>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5">
                  <code className="text-xs font-mono text-slate-700 dark:text-slate-300">Authorization: Bearer &lt;YOUR_KEY&gt;</code>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 p-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-800 dark:text-white">Response format:</strong>{" "}
                <code className="font-mono bg-slate-100 dark:bg-white/10 px-1 rounded">{"{ data, pagination?, error? }"}</code>
                <br />HTTP codes: <span className="text-green-600 dark:text-green-400">200/201</span> success,{" "}
                <span className="text-amber-600 dark:text-amber-400">400</span> bad request,{" "}
                <span className="text-red-600 dark:text-red-400">401</span> unauthorized.
              </div>
            </div>
          </div>

          {/* Rate Limits */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FaShieldAlt className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Rate Limits</h2>
            </div>
            <div className="space-y-2">
              {[
                { endpoint: "GET endpoints", limit: "1,000 req / 15 min", color: "green" },
                { endpoint: "POST / PUT endpoints", limit: "200 req / 15 min", color: "yellow" },
                { endpoint: "DELETE endpoints", limit: "100 req / 15 min", color: "red" },
                { endpoint: "File uploads", limit: "20 req / 15 min", color: "orange" },
              ].map(({ endpoint, limit, color }) => (
                <div key={endpoint} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{endpoint}</span>
                  <span className={`text-xs font-semibold ${
                    color === "green" ? "text-green-600 dark:text-green-400" :
                    color === "yellow" ? "text-amber-600 dark:text-amber-400" :
                    color === "red" ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
                  }`}>{limit}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3">
              Headers: <code className="font-mono text-[10px]">X-RateLimit-Remaining</code>, <code className="font-mono text-[10px]">X-RateLimit-Reset</code>
            </p>
          </div>
        </div>

        {/* ── Code Examples ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/8">
            <div className="flex items-center gap-2">
              <FaBook className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quick Start Examples</h2>
            </div>
            <button onClick={() => copyToClipboard(CODE_EXAMPLES[selectedLang], () => { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              {copiedCode ? <FaCheck className="h-3 w-3 text-emerald-500" /> : <FaCopy className="h-3 w-3" />}
              {copiedCode ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-0 border-b border-slate-200 dark:border-white/8">
            {(Object.keys(CODE_EXAMPLES) as Array<keyof typeof CODE_EXAMPLES>).map((lang) => (
              <button key={lang} onClick={() => setSelectedLang(lang)}
                className={`px-4 py-2.5 text-xs font-semibold capitalize whitespace-nowrap transition-colors border-b-2 ${
                  selectedLang === lang
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}>{lang}</button>
            ))}
          </div>
          <pre className="overflow-x-auto p-5 text-[12px] font-mono leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 max-h-96">
            <code>{CODE_EXAMPLES[selectedLang]}</code>
          </pre>
        </div>

        {/* ── API Reference ─────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FaPlug className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">API Reference</h2>
          </div>
          {ENDPOINTS.map((group) => {
            const isOpen = openGroup === group.group;
            const groupColors: Record<string, string> = {
              emerald: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5",
              blue: "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5",
              purple: "border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5",
              indigo: "border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5",
            };
            const labelColors: Record<string, string> = {
              emerald: "text-emerald-700 dark:text-emerald-400",
              blue: "text-blue-700 dark:text-blue-400",
              purple: "text-purple-700 dark:text-purple-400",
              indigo: "text-indigo-700 dark:text-indigo-400",
            };
            return (
              <div key={group.group} className={`rounded-2xl border overflow-hidden ${groupColors[group.color]}`}>
                <button onClick={() => setOpenGroup(isOpen ? null : group.group)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:opacity-80 transition-opacity">
                  <span className={`text-sm font-semibold ${labelColors[group.color]}`}>
                    {group.group}
                    <span className="ml-2 text-[10px] font-normal text-slate-400 dark:text-slate-500">{group.endpoints.length} endpoint{group.endpoints.length !== 1 ? "s" : ""}</span>
                  </span>
                  <FaChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-200 dark:border-white/8 divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900/60">
                    {group.endpoints.map((ep) => (
                      <div key={ep.path} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono flex-shrink-0 min-w-[46px] justify-center ${METHOD_COLORS[ep.method] || METHOD_COLORS.GET}`}>{ep.method}</span>
                          <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all sm:break-normal">{ep.path}</code>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 sm:flex-1">{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── SDK note ──────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/5 p-5">
          <div className="flex items-start gap-3">
            <FaCode className="h-5 w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">TypeScript SDK (coming soon)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">First-party SDK with full types, React hooks, and pagination helpers.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 text-xs font-mono text-cyan-700 dark:text-cyan-300">@trend360/sdk</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">React hooks</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">TypeScript types</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Key Modal ──────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => { if (!isCreating && !newlyCreatedKey) setShowCreateModal(false); }} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            {newlyCreatedKey ? (
              <>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Key Created 🎉</h2>
                <p className="text-xs text-red-600 dark:text-red-400 mb-4 font-medium">
                  <FaExclamationTriangle className="inline h-3 w-3 mr-1" />
                  Copy this key now — it will not be shown again.
                </p>
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-3 mb-4 flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-slate-800 dark:text-slate-200 break-all">{newlyCreatedKey}</code>
                  <button onClick={() => copyToClipboard(newlyCreatedKey, () => { setCopiedNew(true); toast.success("Copied!"); setTimeout(() => setCopiedNew(false), 2000); })}
                    className="p-1.5 rounded-lg border border-amber-300 dark:border-amber-500/20 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors flex-shrink-0">
                    {copiedNew ? <FaCheck className="h-3.5 w-3.5" /> : <FaCopy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button onClick={() => { setNewlyCreatedKey(null); setShowCreateModal(false); }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm">
                  Done, I've saved my key
                </button>
              </>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Create API Key</h2>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Key name *</label>
                  <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} required
                    placeholder="e.g. Production Backend, My Next.js App"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Scopes</label>
                  <div className="flex flex-wrap gap-2">
                    {SCOPES.map((scope) => (
                      <button key={scope} type="button"
                        onClick={() => setNewKeyScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope])}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border transition-all ${
                          newKeyScopes.includes(scope)
                            ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}>{scope}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreating || !newKeyName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50">
                    {isCreating ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaKey className="h-3.5 w-3.5" />}
                    {isCreating ? "Creating…" : "Create Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
