/**
 * Canonical Business Suite copilot registry for the Next.js app (bundled here).
 * Duplicate: `api/controllers/assistant/businessRouteRegistry/businessScreens.ts` — update both when changing screens.
 */

export interface BusinessAssistantScreen {
  pathname: string;
  title: string;
  /** Injected into the system prompt so the model understands this screen deeply. */
  modelBrief: string;
  suggestedQuestions: string[];
}

export const ADMIN_UNKNOWN_FALLBACK: BusinessAssistantScreen = {
  pathname: '/admin/*',
  title: 'Business Suite',
  modelBrief:
    'The user is somewhere in the Trend360 Business Suite (/admin). Data is scoped to the brand selected in the workspace (sent as x-selected-vendor to vendor APIs). Explain navigation, workflows, and KPIs without inventing numbers. If the exact page is unclear, ask what they are trying to accomplish.',
  suggestedQuestions: [
    'What should I sanity-check first when data looks “wrong”?',
    'How do I decide between a standard campaign and a challenge?',
    'What’s a good workflow from brief → creators → payout?',
    'Ask the assistant to open the page I need next.',
  ],
};

const q = (items: string[]) => items;

export const BUSINESS_ASSISTANT_SCREENS: BusinessAssistantScreen[] = [
  {
    pathname: '/admin',
    title: 'Workspace home',
    modelBrief:
      'Business Suite home summarizes the selected brand: key KPIs, shortcuts to campaigns, challenges, applications, and recent activity. Brand switcher lives in the header; all list/detail APIs are vendor-scoped via x-selected-vendor. Help interpret tiles and suggest next actions (e.g. pending applications, low budget).',
    suggestedQuestions: q([
      'Which KPIs deserve attention today vs what can wait until Friday?',
      'How do I spot early warning signs before budget or applications blow up?',
      'When is “good enough” to keep spending vs when should I pause?',
      'How does the active brand change what I should prioritize this week?',
    ]),
  },
  {
    pathname: '/admin/brands',
    title: 'Brands',
    modelBrief:
      'Brands (agencies operate multiple vendor/brand profiles). Users pick which brand context to work in; that drives x-selected-vendor. Explain creating/switching brands, permissions, and how downstream pages (campaigns, finance) filter by the active brand.',
    suggestedQuestions: q([
      'When does it make sense to split work across multiple brands vs one?',
      'How do I keep messaging and budgets consistent when teams share brands?',
      'What operational risks show up when brand context is wrong?',
      'How should I structure brands for reporting to leadership?',
    ]),
  },
  {
    pathname: '/admin/campaigns',
    title: 'Campaigns list',
    modelBrief:
      'List of campaigns for the active brand: statuses, budgets, performance summaries, filters. Actions lead to create flow, detail `/admin/campaigns/[id]`, analytics `/admin/campaigns/[id]/analytics`, edit `/admin/campaigns/[id]/edit`. Help with interpreting columns, filters, and what “active / draft / ended” means operationally.',
    suggestedQuestions: q([
      'How should I balance experimental campaigns vs proven performers in my portfolio?',
      'Which status patterns usually mean “fix creative” vs “fix targeting”?',
      'When is it smarter to end a campaign than to keep optimizing?',
      'What’s a healthy mix of spend across stages of the funnel?',
    ]),
  },
  {
    pathname: '/admin/campaigns/create',
    title: 'Create campaign',
    modelBrief:
      'Multi-step campaign creation: goals, audience, creative, budget/payment, schedule, products/links, preview. User may be mid-flow; guide field-by-field, validation, and payment/top-up expectations. After publish, campaign appears on list and detail pages.',
    suggestedQuestions: q([
      'What should be nailed in the brief before I commit budget?',
      'How do I sanity-check budget vs expected reach and conversions?',
      'What often breaks at review—creative, compliance, or audience?',
      'How tight should milestones be between draft, review, and launch?',
    ]),
  },
  {
    pathname: '/admin/campaigns/[id]',
    title: 'Campaign detail',
    modelBrief:
      'Single campaign hub: metadata, status, budget, and tabs such as **applications**, **work** / deliverables, and **partners** as implemented. Explain the funnel: applications → approved creators → submitted work → vendor validation → payouts. When the user asks **who fits the requirements**, connect the **brief** to (1) triaging **Applications** (already interested creators), (2) **Partners** discovery (keyword search for more outreach), and (3) **Work** status (what is in review). Vendor campaign APIs power this view; never invent live numbers—use on-screen fields or Campaign Analytics.',
    suggestedQuestions: q([
      'Who among current applicants best matches this campaign’s requirements?',
      'Should I widen recruitment—what keywords should I search on Partners?',
      'What signals on this page mean the campaign is healthy vs slipping?',
      'How do I move stuck applications or pending work forward?',
    ]),
  },
  {
    pathname: '/admin/campaigns/[id]/analytics',
    title: 'Campaign analytics',
    modelBrief:
      'Deep performance for one campaign: time ranges, conversions, spend, cohorts, charts/tables as implemented. Help read charts, compare periods, and translate metrics into actions (optimize creative, adjust budget, pause underperformers).',
    suggestedQuestions: q([
      'Which metric tells the truth about ROI when others look “good”?',
      'How do I separate seasonality from a real performance change?',
      'What cohort view would expose creative fatigue earliest?',
      'How should approved work and payouts line up with these charts?',
    ]),
  },
  {
    pathname: '/admin/campaigns/[id]/edit',
    title: 'Edit campaign',
    modelBrief:
      'Edit existing campaign fields, assets, schedule, or targeting depending on product rules. Warn that some changes may be restricted after launch or payment; suggest verifying validation messages and preview before saving.',
    suggestedQuestions: q([
      'Which mid-flight edits are usually safe vs risky for performance?',
      'How do I avoid breaking tracking when I change links or UTMs?',
      'When is a “big edit” worth resetting learnings?',
      'What should I communicate to creators after a material change?',
    ]),
  },
  {
    pathname: '/admin/challenges',
    title: 'Challenges list',
    modelBrief:
      'Challenge-style programs (gamified / goal-based) for the brand. List shows statuses; detail at `/admin/challenges/[id]`, analytics at `.../analytics`, edit at `.../edit`, create at `/admin/challenges/create`. Differences vs standard campaigns: tiers, metrics, prize structures—explain conceptually.',
    suggestedQuestions: q([
      'When is a challenge the right format vs a standard campaign?',
      'How do I design tiers so top performers feel fair, not gamed?',
      'What vanity metrics should I ignore for challenges?',
      'How do I know participation is quality, not just volume?',
    ]),
  },
  {
    pathname: '/admin/challenges/create',
    title: 'Create challenge',
    modelBrief:
      'Challenge creation: metric type, goals, dates, content direction, prize/tiers, hero imagery, payment if applicable. User may be on review/pay step. Guide through validation and what happens after publish.',
    suggestedQuestions: q([
      'How do I pick a metric that creators can’t easily fake?',
      'What prize structure avoids demotivating the middle 80%?',
      'How tight should dates be given creative turnaround time?',
      'What should the brief spell out to reduce disputes later?',
    ]),
  },
  {
    pathname: '/admin/challenges/[id]',
    title: 'Challenge detail',
    modelBrief:
      'Single challenge overview: rules, timeline, participation, status, links to edit/analytics. Help interpret progress indicators and next steps for operators.',
    suggestedQuestions: q([
      'What does healthy participation velocity look like mid-challenge?',
      'When should I intervene with comms vs rule tweaks?',
      'How do I spot collusion or low-quality bulk entries?',
      'What’s a clean way to wind down without burning trust?',
    ]),
  },
  {
    pathname: '/admin/challenges/[id]/analytics',
    title: 'Challenge analytics',
    modelBrief:
      'Analytics for one challenge: leaderboard-style or KPI views depending on implementation. Explain how to interpret engagement, submissions, and outcomes; tie to work validation if relevant.',
    suggestedQuestions: q([
      'How do I interpret leaderboard changes vs noise?',
      'What submission patterns should trigger manual review?',
      'How do I explain these results to non-technical stakeholders?',
      'Why might challenge numbers diverge from standard campaign analytics?',
    ]),
  },
  {
    pathname: '/admin/challenges/[id]/edit',
    title: 'Edit challenge',
    modelBrief:
      'Edit challenge configuration; some fields may lock after start or payment. Align guidance with campaign edit patterns and brand policy.',
    suggestedQuestions: q([
      'Which post-launch edits rebuild trust vs erode it?',
      'How do I change prizes without creating legal/PR risk?',
      'What must creators be told when rules shift?',
      'If payment already happened, what’s the safest rollback path?',
    ]),
  },
  {
    pathname: '/admin/challenges/payment-success',
    title: 'Challenge payment success',
    modelBrief:
      'Post-payment confirmation for a challenge. User should verify receipt, next steps (monitoring, comms), and where to track the challenge (detail/analytics).',
    suggestedQuestions: q([
      'What verification steps should I take before announcing publicly?',
      'What’s a tight launch checklist for the next 24 hours?',
      'How do I monitor for payment or activation issues early?',
      'If the amount looks off, what should I document before support?',
    ]),
  },
  {
    pathname: '/admin/applications',
    title: 'Applications',
    modelBrief:
      'Inbound **creator applications** to the brand’s campaigns: statuses PENDING / APPROVED / REJECTED; filter by **campaign**, **status**, and **text search** (partner/campaign). Each row links an applicant to a campaign—use this screen to judge **fit vs brief** before decisions. **Partner-matching playbook**: (1) Extract must-haves from the campaign (audience, tone, platforms, compliance). (2) Score applicants on brand fit, content consistency, reach vs engagement quality, and risk—do not invent metrics. (3) If they need **additional** creators, move to **Partners** with **keyword search** derived from the same brief. Vendor APIs: GET/PATCH applications; explain queues clearly.',
    suggestedQuestions: q([
      'Turn my brief into a scoring rubric for these applicants.',
      'Which pending applications are safest to approve first?',
      'Compare two applicants for the same campaign—what should break the tie?',
      'Open Partners and search for more creators like my top applicant.',
    ]),
  },
  {
    pathname: '/admin/work-validation',
    title: 'Work validation queue',
    modelBrief:
      'Queue of **completed work** partners submitted for **vendor approval** before earnings settle—downstream of **approved applications**. User can filter by **campaign**, **search**, and **work status** (pending approval, approved, rejected). Bulk and row-level approve/reject affect **payouts**; stress accuracy and evidence. **Your role**: help check **brief alignment**, **live proof** (URLs, posts, UTMs), **brand safety**, and consistency with what was approved in Applications. Relate to **Partners** (identity/reach) when explaining risk. Deep review: `/admin/work-validation/[id]`.',
    suggestedQuestions: q([
      'What should I verify on each row before bulk approving?',
      'How do I reject professionally while keeping the partner relationship?',
      'What quality bar protects both brand safety and creator trust?',
      'Open the pending queue filtered to this campaign only.',
    ]),
  },
  {
    pathname: '/admin/work-validation/[id]',
    title: 'Work validation detail',
    modelBrief:
      'Focused review of **one application’s submitted work**: media embeds, posts, captions, partner context, approve/reject with reasons. **Accuracy matters**—approval typically triggers **earnings**. Guide the vendor through a **checklist**: correct campaign/brief, required platforms/format, disclosure/compliance, working links, UTM or tracking if required, and authenticity vs slop. Connect decisions to **Applications** (what was promised) and **Partners** (ongoing relationship).',
    suggestedQuestions: q([
      'What evidence is non-negotiable before I approve this submission?',
      'Does this deliverable meet the original brief—what is missing?',
      'What’s a professional rejection reason I can paste?',
      'What happens financially if I approve vs reject?',
    ]),
  },
  {
    pathname: '/admin/partners',
    title: 'Partners',
    modelBrief:
      'Partner/creator discovery: **text search** (bios, skills, niches, socials) is separate from **structured filters**—min/max **total followers**, **platform** dropdown (instagram, tiktok, etc.), **engagement** tier, category/niche. The AI copilot must map “over 5k followers” to **follower fields**, not the search box; map “on TikTok” to **platform**, not search alone. Detail at `/admin/partners/[id]`; curated at `/admin/partners/curated`, commissions at `/admin/partners/commissions`.',
    suggestedQuestions: q([
      'Show me partners with at least 10,000 followers on Instagram.',
      'Find TikTok creators in beauty—combine platform, topic search, and follower range.',
      'What signals suggest authentic engagement vs inflated numbers?',
      'How do I shortlist for my niche without mistyping reach into search?',
    ]),
  },
  {
    pathname: '/admin/partners/[id]',
    title: 'Partner profile',
    modelBrief:
      'Individual partner: social accounts, history with brand, stats, actions (favorite, invite, etc. as implemented). Help interpret follower counts, engagement, past campaigns—no fabricated stats.',
    suggestedQuestions: q([
      'How do I judge fit from audience demographics I can’t fully see?',
      'What negotiation angles work when their rates feel high?',
      'How do I sanity-check past performance claims?',
      'What should I log after a first campaign for next time?',
    ]),
  },
  {
    pathname: '/admin/partners/curated',
    title: 'Curated partners',
    modelBrief:
      'Brand-curated lists of partners for faster outreach or whitelisting. Explain list management and how curated sets interact with campaigns.',
    suggestedQuestions: q([
      'How do I keep curated lists fresh without endless manual work?',
      'When is a curated list a strategic moat vs overhead?',
      'How should I segment lists for different campaign types?',
      'What governance avoids biased or stale rosters?',
    ]),
  },
  {
    pathname: '/admin/partners/commissions',
    title: 'Partner commissions',
    modelBrief:
      'Commission structures or earnings splits relevant to partners (as implemented). Clarify concepts without inventing rates—user should read on-screen values.',
    suggestedQuestions: q([
      'How do I structure commissions to reward quality, not spam?',
      'What’s fair when returns or chargebacks hit after payout?',
      'How transparent should I be with partners about tiers?',
      'When do flat fees beat percentage deals?',
    ]),
  },
  {
    pathname: '/admin/messages',
    title: 'Messages',
    modelBrief:
      'In-workspace messaging with partners: threads, read state, compose. Help with navigation (mobile vs desktop layout), notifications, and professional comms tips.',
    suggestedQuestions: q([
      'What tone and detail reduce back-and-forth in DMs?',
      'When should I move from chat to a formal brief or contract?',
      'How do I de-escalate a frustrated creator professionally?',
      'What should always be written, not only said in chat?',
    ]),
  },
  {
    pathname: '/admin/emails',
    title: 'Emails',
    modelBrief:
      'Outbound email tools for the brand: compose, templates, sends, links to history. Align with vendor email capabilities; no spam or policy violations.',
    suggestedQuestions: q([
      'How do I avoid burning the list with too many blasts?',
      'What subject lines respect inbox fatigue but still convert?',
      'How should I segment so messages feel personal at scale?',
      'What metrics mean the creative worked vs the audience was wrong?',
    ]),
  },
  {
    pathname: '/admin/emails/history',
    title: 'Email history',
    modelBrief:
      'Log of sent emails: status, timestamps, recipients batches. Help troubleshoot failed sends and interpret delivery states.',
    suggestedQuestions: q([
      'How do I triage bounces vs blocks vs spam placement?',
      'When is a resend helpful vs harmful to reputation?',
      'What should I change before retrying a failed batch?',
      'How long should I keep proof of sends for disputes?',
    ]),
  },
  {
    pathname: '/admin/analytics',
    title: 'Workspace analytics',
    modelBrief:
      'Cross-campaign / brand analytics dashboards: aggregates, trends, breakdowns. Connect insights to actions (budget shifts, partner mix, creative tests).',
    suggestedQuestions: q([
      'What single narrative ties these charts together for my CEO?',
      'How do I separate correlation from causation in trends?',
      'Where would I look first if revenue is flat but traffic is up?',
      'How should workspace analytics reconcile with finance snapshots?',
    ]),
  },
  {
    pathname: '/admin/finance',
    title: 'Finance',
    modelBrief:
      'Brand financial overview: balances, transactions, payouts context, top-ups as implemented. Stress reconciliation with campaign budgets and work validation.',
    suggestedQuestions: q([
      'How do I reconcile wallet balance with live campaign commitments?',
      'What timing gaps usually explain “missing” funds?',
      'How do I plan runway so launches don’t stall?',
      'How should approved work, payouts, and tax reporting line up mentally?',
    ]),
  },
  {
    pathname: '/admin/finance/success',
    title: 'Finance payment success',
    modelBrief:
      'Confirmation after a finance/top-up action. Next steps: verify ledger, return to finance dashboard, monitor campaign funding.',
    suggestedQuestions: q([
      'What should I verify in the ledger before funding new campaigns?',
      'How long should I wait before assuming a top-up failed?',
      'What do I screenshot or export if finance disputes the amount?',
      'How do I decide allocation across active campaigns after a top-up?',
    ]),
  },
  {
    pathname: '/admin/team',
    title: 'Team',
    modelBrief:
      'Business Suite team members for the workspace: invites, roles, active users. Deeper role matrix at `/admin/team/roles`.',
    suggestedQuestions: q([
      'Who needs broad access vs who should be tightly scoped?',
      'How do I offboard someone without breaking automations?',
      'What’s a sensible review cadence for dormant accounts?',
      'How do I document who can spend money vs who can only view?',
    ]),
  },
  {
    pathname: '/admin/team/roles',
    title: 'Team roles',
    modelBrief:
      'Permission templates: which areas (campaigns, finance, partners, etc.) each role can access. Explain least-privilege and who should get which role.',
    suggestedQuestions: q([
      'What’s the smallest set of permissions that still lets finance operate?',
      'How do I avoid “admin for everyone” creep?',
      'When should permissions differ by brand?',
      'How do Business Suite roles differ from platform super-admin powers?',
    ]),
  },
  {
    pathname: '/admin/api-access',
    title: 'API access',
    modelBrief:
      'Developer/API keys and documentation entry for integrating the brand with external systems. Security: rotation, scopes, never expose keys in chat.',
    suggestedQuestions: q([
      'What rotation and storage practices keep keys out of leaks?',
      'How do I test in staging without touching production data?',
      'What belongs in headers vs body for multi-brand safety?',
      'When should I prefer webhooks over polling?',
    ]),
  },
  {
    pathname: '/admin/settings',
    title: 'Settings',
    modelBrief:
      'Account and workspace preferences: profile, notifications, integrations as available. Distinguish from brand list and from FinalBoss global settings.',
    suggestedQuestions: q([
      'How do I cut notification noise without missing payouts?',
      'What security baseline should every operator meet?',
      'Which settings should be standardized across the team?',
      'What’s worth revisiting quarterly in settings?',
    ]),
  },
  {
    pathname: '/admin/auth',
    title: 'Sign in',
    modelBrief:
      'Business Suite authentication. Help with login errors, password reset links to forgot-password flow, session/token issues—without bypassing security.',
    suggestedQuestions: q([
      'What’s a sensible checklist before assuming the product is broken?',
      'How do I tell account lockout from a bad password?',
      'When should I involve IT vs reset myself?',
      'What session behavior is normal on shared devices?',
    ]),
  },
  {
    pathname: '/admin/auth/forgot-password',
    title: 'Forgot password',
    modelBrief:
      'Password reset request: email link flow. Set expectations on email delay, spam folder, rate limits.',
    suggestedQuestions: q([
      'What delivery issues are usually spam-folder vs wrong email?',
      'How long should I wait before requesting another reset?',
      'What info should I give support if email never arrives?',
      'How do I avoid locking myself out with rapid retries?',
    ]),
  },
  {
    pathname: '/admin/auth/reset-password',
    title: 'Reset password',
    modelBrief:
      'User lands with a token from email to set a new password. Explain strength requirements and success path back to login.',
    suggestedQuestions: q([
      'Why do tokens fail—expiry, reuse, or wrong device?',
      'How strong should a password be for a finance-capable account?',
      'What should I do immediately after a successful reset?',
      'How do I avoid password-manager paste mistakes?',
    ]),
  },
];
