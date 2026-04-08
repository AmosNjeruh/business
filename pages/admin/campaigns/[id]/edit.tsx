// Business Suite – Edit Campaign (Multi-step)
// Route: /admin/campaigns/[id]/edit
// Self-contained multi-step form for editing existing campaigns

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { getCampaign, updateCampaign } from "@/services/vendor";
import {
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaSpinner,
  FaBullseye, FaMoneyBillWave, FaCalendarAlt, FaListUl,
  FaEye, FaGlobe, FaLock, FaBullhorn,
} from "react-icons/fa";

type Objective = "BRAND_AWARENESS" | "TRAFFIC" | "LEADS" | "SALES";
type PayStructure = "INFLUENCER" | "CPC" | "CPA" | "COMMISSION_PER_SALE";

const OBJECTIVES: { value: Objective; label: string; desc: string; emoji: string }[] = [
  { value: "BRAND_AWARENESS", label: "Brand Awareness", desc: "Grow visibility and reach for a brand", emoji: "📣" },
  { value: "TRAFFIC", label: "Drive Traffic", desc: "Send audiences to a website or landing page", emoji: "🌐" },
  { value: "LEADS", label: "Generate Leads", desc: "Capture contact info from potential customers", emoji: "🎯" },
  { value: "SALES", label: "Drive Sales", desc: "Directly convert audiences into customers", emoji: "💰" },
];

const PAY_STRUCTURES: { value: PayStructure; label: string; desc: string }[] = [
  { value: "INFLUENCER", label: "Pay per Post", desc: "Fixed amount paid per influencer post/deliverable" },
  { value: "CPC", label: "Pay per Click", desc: "Pay creators for each unique click they drive" },
  { value: "CPA", label: "Pay per Action", desc: "Pay when a specific action (sign-up, purchase) is completed" },
  { value: "COMMISSION_PER_SALE", label: "Commission on Sales", desc: "Percentage or fixed commission on each sale" },
];

const CAMPAIGN_SOCIAL_PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'Twitter/X', manual: true },
  { value: 'linkedin', label: 'LinkedIn' },
] as const;

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  title: string;
  description: string;
  objective: Objective;
  targetUrl: string;
  budget: string;
  paymentStructure: PayStructure;
  paymentPerInfluencer: string;
  paymentAmount: string;
  startDate: string;
  endDate: string;
  requirements: string[];
  isPublic: boolean;
  socialPlatforms: string[];
  hashtags: string[];
  contentStyle: 'CREATOR_CREATIVITY' | 'AS_BRIEFED';
}

const STEPS = [
  { num: 1 as Step, label: "Goal" },
  { num: 2 as Step, label: "Details" },
  { num: 3 as Step, label: "Budget" },
  { num: 4 as Step, label: "Schedule" },
  { num: 5 as Step, label: "Review" },
];

const ensureHashPrefix = (raw: string): string => {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return "";
  const withoutHashes = trimmed.replace(/^#+/, "");
  return withoutHashes ? `#${withoutHashes.toLowerCase()}` : "";
};

const allPlatformsSelected = (platforms: string[]) =>
  CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.every((p) => platforms.includes(p.value));

export default function EditCampaignPage() {
  const router = useRouter();
  const { id } = router.query;
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    objective: "BRAND_AWARENESS",
    targetUrl: "",
    budget: "",
    paymentStructure: "INFLUENCER",
    paymentPerInfluencer: "",
    paymentAmount: "",
    startDate: "",
    endDate: "",
    requirements: [""],
    isPublic: true,
    socialPlatforms: CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.map((p) => p.value),
    hashtags: [],
    contentStyle: "CREATOR_CREATIVITY",
  });
  const [showIndividualPlatforms, setShowIndividualPlatforms] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");

  // Get today in YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  const USD_TO_NGN = 1600; // Conversion rate

  // Load campaign data
  useEffect(() => {
    if (!id || typeof id !== "string") return;
    (async () => {
      try {
        setIsLoading(true);
        const campaign = await getCampaign(id);
        
        // Format dates for input fields
        const formattedStartDate = campaign.startDate
          ? new Date(campaign.startDate).toISOString().split("T")[0]
          : "";
        const formattedEndDate = campaign.endDate
          ? new Date(campaign.endDate).toISOString().split("T")[0]
          : "";

        // Convert USD to NGN for display
        const budgetNGN = campaign.budget ? (campaign.budget * USD_TO_NGN).toString() : "";
        const payPerInfluencerNGN = campaign.paymentPerInfluencer
          ? (campaign.paymentPerInfluencer * USD_TO_NGN).toString()
          : "";
        const payAmountNGN = campaign.paymentAmount
          ? (campaign.paymentAmount * USD_TO_NGN).toString()
          : "";

        // Format requirements
        const requirementsArray =
          Array.isArray(campaign.requirements) && campaign.requirements.length > 0
            ? campaign.requirements
            : [""];

        setForm({
          title: campaign.title || "",
          description: campaign.description || "",
          objective: (campaign.objective as Objective) || "BRAND_AWARENESS",
          targetUrl: campaign.targetUrl || "",
          budget: budgetNGN,
          paymentStructure: (campaign.paymentStructure as PayStructure) || "INFLUENCER",
          paymentPerInfluencer: payPerInfluencerNGN,
          paymentAmount: payAmountNGN,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          requirements: requirementsArray,
          isPublic: campaign.isPublic !== false,
          socialPlatforms: Array.isArray((campaign as any).socialPlatforms) && (campaign as any).socialPlatforms.length > 0
            ? (campaign as any).socialPlatforms
            : CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.map((p) => p.value),
          hashtags: Array.isArray((campaign as any).hashtags)
            ? (campaign as any).hashtags.map((t: string) => ensureHashPrefix(t)).filter(Boolean)
            : [],
          contentStyle: (campaign as any).contentStyle === 'AS_BRIEFED' ? 'AS_BRIEFED' : 'CREATOR_CREATIVITY',
        });
      } catch (err: any) {
        toast.error(err?.response?.data?.error || "Failed to load campaign");
        router.push("/admin/campaigns");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, router]);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 2) {
      if (!form.title.trim()) e.title = "Title is required";
      if (!form.description.trim()) e.description = "Description is required";
      if (form.objective === "TRAFFIC" && !form.targetUrl.trim()) e.targetUrl = "Target URL is required for traffic campaigns";
      if (!form.socialPlatforms.length) e.socialPlatforms = "Select at least one social platform";
      if (!form.hashtags.length) e.hashtags = "Add at least one hashtag";
    }
    if (step === 3) {
      if (form.paymentStructure === "INFLUENCER" && (!form.paymentPerInfluencer || parseFloat(form.paymentPerInfluencer) <= 0))
        e.paymentPerInfluencer = "Payment per post is required";
      if (["CPC", "CPA"].includes(form.paymentStructure) && (!form.paymentAmount || parseFloat(form.paymentAmount) <= 0))
        e.paymentAmount = "Payment amount is required";
    }
    if (step === 4) {
      if (!form.startDate) e.startDate = "Start date is required";
      if (!form.endDate) e.endDate = "End date is required";
      if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate))
        e.endDate = "End date must be after start date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(5, s + 1) as Step); };
  const back = () => { setErrors({}); setStep((s) => Math.max(1, s - 1) as Step); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      // Convert NGN to USD for backend
      const payPerInfluencerUSD = form.paymentPerInfluencer
        ? parseFloat(form.paymentPerInfluencer) / USD_TO_NGN : undefined;
      const payAmtUSD = form.paymentAmount
        ? parseFloat(form.paymentAmount) / USD_TO_NGN : undefined;

      await updateCampaign(id as string, {
        title: form.title.trim(),
        description: form.description.trim(),
        objective: form.objective,
        paymentStructure: form.paymentStructure,
        paymentPerInfluencer: payPerInfluencerUSD,
        paymentAmount: payAmtUSD,
        targetUrl: form.targetUrl.trim() || null,
        startDate: form.startDate,
        endDate: form.endDate,
        requirements: form.requirements.filter((r) => r.trim()),
        socialPlatforms: form.socialPlatforms,
        hashtags: form.hashtags.map(ensureHashPrefix).filter(Boolean),
        contentStyle: form.contentStyle,
        isPublic: form.isPublic,
      });
      toast.success("Campaign updated successfully!");
      router.push(`/admin/campaigns/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to update campaign";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Link href={`/admin/campaigns/${id}`} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <FaArrowLeft className="h-3 w-3" /> Campaign Details
          </Link>
          <span className="text-slate-400 dark:text-slate-500">/</span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Edit Campaign</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Campaign</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update your campaign details</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map(({ num, label }, i) => (
            <React.Fragment key={num}>
              <div className="flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step > num ? "border-emerald-400 dark:border-emerald-400 bg-emerald-400 dark:bg-emerald-400 text-slate-950 dark:text-slate-950" :
                  step === num ? "border-emerald-400 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" :
                  "border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-500"
                }`}>
                  {step > num ? <FaCheckCircle className="h-3.5 w-3.5" /> : num}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${step === num ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-500"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${step > num ? "bg-emerald-400 dark:bg-emerald-400" : "bg-slate-200 dark:border-white/10"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step panels */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 space-y-6 shadow-lg">

            {/* ── STEP 1: Goal ── */}
            {step === 1 && (
              <div className="space-y-4">
                <StepHeading icon={FaBullseye} title="Choose your campaign goal" hint="What outcome does this campaign need to achieve?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OBJECTIVES.map(({ value, label, desc, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("objective", value)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        form.objective === value
                          ? "border-emerald-400 dark:border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 hover:bg-slate-100 dark:hover:bg-white/6 hover:border-slate-300 dark:hover:border-white/20"
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{emoji}</span>
                      <p className={`text-sm font-semibold ${form.objective === value ? "text-emerald-600 dark:text-emerald-300" : "text-slate-900 dark:text-white"}`}>{label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: Details ── */}
            {step === 2 && (
              <div className="space-y-4">
                <StepHeading icon={FaBullhorn} title="Campaign details" hint="Give your campaign a strong title and clear description" />
                <LabelInput label="Campaign title *" id="title" type="text"
                  value={form.title} onChange={(v) => set("title", v)}
                  placeholder="e.g. Ramadan 2025 Influencer Wave" error={errors.title} />
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description *</label>
                  <textarea
                    value={form.description} onChange={(e) => set("description", e.target.value)}
                    rows={4} placeholder="Describe the campaign, deliverables, and what creators should know…"
                    className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 resize-none ${errors.description ? "border-red-500 dark:border-red-500/50" : "border-slate-200 dark:border-white/10"}`}
                  />
                  {errors.description && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.description}</p>}
                </div>
                {form.objective === "TRAFFIC" && (
                  <LabelInput label="Target URL *" id="targetUrl" type="url"
                    value={form.targetUrl} onChange={(v) => set("targetUrl", v)}
                    placeholder="https://yoursite.com/landing" error={errors.targetUrl} />
                )}
                {form.objective !== "TRAFFIC" && (
                  <LabelInput label="Target URL (optional)" id="targetUrl" type="url"
                    value={form.targetUrl} onChange={(v) => set("targetUrl", v)}
                    placeholder="https://yoursite.com/landing" />
                )}

                {/* Requirements */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <FaListUl className="h-3 w-3" /> Requirements (optional)
                  </label>
                  {form.requirements.map((req, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        value={req} onChange={(e) => {
                          const r = [...form.requirements]; r[i] = e.target.value; set("requirements", r);
                        }}
                        placeholder={`Requirement ${i + 1}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50"
                      />
                      {form.requirements.length > 1 && (
                        <button type="button" onClick={() => set("requirements", form.requirements.filter((_, j) => j !== i))}
                          className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-100 dark:hover:bg-red-500/20">×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => set("requirements", [...form.requirements, ""])}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-1">+ Add requirement</button>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-4 space-y-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Content Direction
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => set("contentStyle", "CREATOR_CREATIVITY")}
                      className={`text-left p-3 rounded-lg border ${
                        form.contentStyle === "CREATOR_CREATIVITY"
                          ? "border-emerald-400 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-400/10"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">Creator Creativity</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Recommended for better authenticity and conversion.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => set("contentStyle", "AS_BRIEFED")}
                      className={`text-left p-3 rounded-lg border ${
                        form.contentStyle === "AS_BRIEFED"
                          ? "border-emerald-400 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-400/10"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">Post As Briefed</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Creators should follow your exact campaign messaging.</p>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-4 space-y-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Allowed Platforms *
                  </label>
                  <button
                    type="button"
                    onClick={() => set("socialPlatforms", allPlatformsSelected(form.socialPlatforms) ? [] : CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.map((p) => p.value))}
                    className={`w-full text-left px-3 py-3 rounded-lg border-2 transition-all ${
                      allPlatformsSelected(form.socialPlatforms)
                        ? "border-emerald-400 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-400/10"
                        : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">All Platforms</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">Recommended</span>
                    </div>
                  </button>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {allPlatformsSelected(form.socialPlatforms) ? "Using all platforms (recommended)" : `Selected ${form.socialPlatforms.length} platform(s)`}
                    </p>
                    <button type="button" onClick={() => setShowIndividualPlatforms((v) => !v)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {showIndividualPlatforms ? "Hide individual selection" : "Choose individual platforms"}
                    </button>
                  </div>
                  {showIndividualPlatforms && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.map((platform) => {
                        const selected = form.socialPlatforms.includes(platform.value);
                        return (
                          <button
                            key={platform.value}
                            type="button"
                            onClick={() => set("socialPlatforms", selected ? form.socialPlatforms.filter((p) => p !== platform.value) : [...form.socialPlatforms, platform.value])}
                            className={`text-left px-3 py-2 rounded-lg border ${
                              selected
                                ? "border-emerald-400 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-400/10"
                                : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-900 dark:text-white">{platform.label}</span>
                              {platform.manual ? <span className="text-[10px] text-amber-600 dark:text-amber-400">Manual</span> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {errors.socialPlatforms && <p className="text-xs text-red-600 dark:text-red-400">{errors.socialPlatforms}</p>}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Required Hashtags *</label>
                    <div className="flex gap-2">
                      <input
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const normalized = ensureHashPrefix(hashtagInput);
                            if (!normalized || form.hashtags.includes(normalized)) return;
                            set("hashtags", [...form.hashtags, normalized]);
                            setHashtagInput("");
                          }
                        }}
                        placeholder="#brandcampaign"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white"
                      />
                      <button type="button" onClick={() => {
                        const normalized = ensureHashPrefix(hashtagInput);
                        if (!normalized || form.hashtags.includes(normalized)) return;
                        set("hashtags", [...form.hashtags, normalized]);
                        setHashtagInput("");
                      }} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                        Add
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">If `#` is missing, we add it automatically.</p>
                    {form.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.hashtags.map((tag) => (
                          <button key={tag} type="button" onClick={() => set("hashtags", form.hashtags.filter((t) => t !== tag))}
                            className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            {tag} ×
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.hashtags && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.hashtags}</p>}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Campaign visibility</label>
                  <div className="flex gap-2">
                    {[
                      { val: true, icon: FaGlobe, label: "Public", hint: "Visible to all partners" },
                      { val: false, icon: FaLock, label: "Private", hint: "Invite-only partners" },
                    ].map(({ val, icon: Icon, label, hint }) => (
                      <button key={String(val)} type="button" onClick={() => set("isPublic", val)}
                        className={`flex-1 flex items-center gap-2 p-3 rounded-xl border text-left ${form.isPublic === val ? "border-emerald-400 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-400/10" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 hover:bg-slate-100 dark:hover:bg-white/6"}`}>
                        <Icon className={`h-4 w-4 ${form.isPublic === val ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`} />
                        <div>
                          <p className={`text-xs font-semibold ${form.isPublic === val ? "text-emerald-600 dark:text-emerald-300" : "text-slate-900 dark:text-white"}`}>{label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{hint}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Budget ── */}
            {step === 3 && (
              <div className="space-y-5">
                <StepHeading icon={FaMoneyBillWave} title="Budget & payment" hint="Set how creators get paid (budget cannot be changed)" />
                <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-4">
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">Campaign Budget</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {form.budget ? `₦${parseFloat(form.budget).toLocaleString()}` : "—"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Budget cannot be modified after campaign creation</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Payment structure *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PAY_STRUCTURES.map(({ value, label, desc }) => (
                      <button key={value} type="button" onClick={() => set("paymentStructure", value)}
                        className={`rounded-xl border p-3 text-left ${form.paymentStructure === value ? "border-emerald-400 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-400/10" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 hover:bg-slate-100 dark:hover:bg-white/6"}`}>
                        <p className={`text-xs font-semibold ${form.paymentStructure === value ? "text-emerald-600 dark:text-emerald-300" : "text-slate-900 dark:text-white"}`}>{label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {form.paymentStructure === "INFLUENCER" && (
                  <LabelInput label="Payment per post/deliverable (₦) *" id="paymentPerInfluencer" type="number"
                    value={form.paymentPerInfluencer} onChange={(v) => set("paymentPerInfluencer", v)}
                    placeholder="e.g. 15000" error={errors.paymentPerInfluencer} />
                )}
                {["CPC", "CPA"].includes(form.paymentStructure) && (
                  <LabelInput label={`Amount per ${form.paymentStructure === "CPC" ? "click" : "action"} (₦) *`}
                    id="paymentAmount" type="number"
                    value={form.paymentAmount} onChange={(v) => set("paymentAmount", v)}
                    placeholder="e.g. 500" error={errors.paymentAmount} />
                )}
              </div>
            )}

            {/* ── STEP 4: Schedule ── */}
            {step === 4 && (
              <div className="space-y-4">
                <StepHeading icon={FaCalendarAlt} title="Campaign schedule" hint="Set when this campaign starts and ends" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start date *</label>
                    <input type="date" value={form.startDate}
                      onChange={(e) => set("startDate", e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${errors.startDate ? "border-red-500 dark:border-red-500/50" : "border-slate-200 dark:border-white/10"}`}
                    />
                    {errors.startDate && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">End date *</label>
                    <input type="date" value={form.endDate} min={form.startDate || today}
                      onChange={(e) => set("endDate", e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${errors.endDate ? "border-red-500 dark:border-red-500/50" : "border-slate-200 dark:border-white/10"}`}
                    />
                    {errors.endDate && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.endDate}</p>}
                  </div>
                </div>
                {form.startDate && form.endDate && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Duration:{" "}
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000)} days
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: Review ── */}
            {step === 5 && (
              <div className="space-y-5">
                <StepHeading icon={FaEye} title="Review & save" hint="Double-check your changes before saving" />
                <div className="space-y-3">
                  {[
                    { label: "Goal", val: OBJECTIVES.find((o) => o.value === form.objective)?.label },
                    { label: "Title", val: form.title },
                    { label: "Objective URL", val: form.targetUrl || "—" },
                    { label: "Budget", val: form.budget ? `₦${parseFloat(form.budget).toLocaleString()}` : "—" },
                    { label: "Payment Structure", val: PAY_STRUCTURES.find((p) => p.value === form.paymentStructure)?.label },
                    { label: "Pay per post", val: form.paymentPerInfluencer ? `₦${parseFloat(form.paymentPerInfluencer).toLocaleString()}` : "—" },
                    { label: "Pay per action/click", val: form.paymentAmount ? `₦${parseFloat(form.paymentAmount).toLocaleString()}` : "—" },
                    { label: "Start", val: form.startDate },
                    { label: "End", val: form.endDate },
                    { label: "Visibility", val: form.isPublic ? "Public" : "Private" },
                    { label: "Requirements", val: form.requirements.filter(Boolean).length > 0 ? `${form.requirements.filter(Boolean).length} listed` : "None" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-200 dark:border-white/6 last:border-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                      <span className="text-xs font-medium text-slate-900 dark:text-white text-right max-w-[60%] truncate">{val || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 mt-4">
            {step > 1 ? (
              <button type="button" onClick={back}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <FaArrowLeft className="h-3 w-3" /> Back
              </button>
            ) : (
              <Link href={`/admin/campaigns/${id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <FaArrowLeft className="h-3 w-3" /> Cancel
              </Link>
            )}

            {step < 5 ? (
              <button type="button" onClick={next}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all">
                Continue <FaArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? (
                  <><FaSpinner className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                ) : (
                  <><FaCheckCircle className="h-3.5 w-3.5" /> Save Changes</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function StepHeading({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-2.5 mt-0.5 flex-shrink-0">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

interface LabelInputProps {
  label: string; id: string; type: string;
  value: string; onChange: (v: string) => void;
  placeholder: string; error?: string;
}
function LabelInput({ label, id, type, value, onChange, placeholder, error }: LabelInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 transition-all ${error ? "border-red-500 dark:border-red-500/50" : "border-slate-200 dark:border-white/10"}`}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}
