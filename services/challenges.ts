import Api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChallengeStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'SCHEDULED'
  | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED' | 'REJECTED';

export type ChallengeType = 'PLATFORM_RUN' | 'BRAND_SPONSORED';

export type ChallengeMetricType =
  | 'REFERRALS' | 'LIKES' | 'SHARES' | 'VIEWS' | 'CONVERSIONS' | 'SIGN_UPS' | 'CUSTOM';

export type PrizeStructure = 'WINNER_TAKES_ALL' | 'TIERED' | 'POOL' | 'RAFFLE';

export type ParticipationStatus =
  | 'JOINED' | 'IN_PROGRESS' | 'GOAL_REACHED' | 'DISQUALIFIED' | 'WITHDRAWN';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export type ChallengePrizePayoutStatus =
  | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ChallengePrize {
  id: string;
  rank: number;
  prizeAmount: number;
  structure: PrizeStructure;
  description?: string;
  winnerId?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  heroImage?: string;
  type: ChallengeType;
  status: ChallengeStatus;
  metricType: ChallengeMetricType;
  goalValue: number;
  startDate: string;
  endDate: string;
  prizeBudget: number;
  platformSetupFee: number;
  platformPercentageFee: number;
  totalParticipants: number;
  totalSubmissions: number;
  prizes: ChallengePrize[];
  createdByVendorId?: string;
  createdByVendor?: { id: string; name: string; picture?: string };
  moderatedById?: string;
  rejectionNote?: string;
  _count?: { participations: number; submissions: number };
  latestLeaderboard?: LeaderboardEntry[];
  socialPlatforms?: string[];
  hashtags?: string[];
  contentStyle?: 'CREATOR_CREATIVITY' | 'AS_BRIEFED';
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  partnerId: string;
  status: ParticipationStatus;
  currentMetricValue: number;
  goalValue: number;
  trackingCode?: string;
  trackingUrl?: string;
  joinedAt: string;
  challenge?: Challenge;
  currentRank?: number;
}

export interface LeaderboardEntry {
  rank: number;
  partnerId: string;
  partnerName: string;
  partnerPicture?: string;
  metricValue: number;
  goalValue: number;
  percentComplete: number;
  joinedAt: string;
  postUrl?: string | null;
}

export interface ChallengePayout {
  id: string;
  challengeId: string;
  rank: number;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: ChallengePrizePayoutStatus;
  transactionId?: string;
  createdAt: string;
  challenge?: { id: string; title: string; heroImage?: string };
  prize?: ChallengePrize;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  partnerId: string;
  postUrl?: string;
  screenshotUrls: string[];
  note?: string;
  status: SubmissionStatus;
  detectedMetricValue?: number;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  partner?: { id: string; name: string; picture?: string; email?: string };
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl?: string;
  color?: string;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  awardedAt: string;
  badge: Badge;
  challenge?: { id: string; title: string };
}

export interface CreateChallengePayload {
  title: string;
  description: string;
  heroImage?: string;
  startDate: string;
  endDate: string;
  metricType: ChallengeMetricType;
  goalValue: number;
  prizeBudget: number;
  prizes: { structure: PrizeStructure; rank: number; prizeAmount: number; description?: string }[];
  audienceTargeting?: any;
  fraudConfig?: any;
  socialPlatforms?: string[];
  hashtags?: string[];
  contentStyle?: 'CREATOR_CREATIVITY' | 'AS_BRIEFED';
  paymentMethod?: 'stripe' | 'paystack' | 'balance';
  transactionId?: string;
  sessionId?: string;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const listChallenges = async (params?: {
  type?: ChallengeType;
  status?: ChallengeStatus;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const response = await Api.get('/challenges', { params });
  return response.data;
};

export const getChallengeDetail = async (id: string) => {
  const response = await Api.get(`/challenges/${id}`);
  return response.data.data as Challenge;
};

export const getLeaderboard = async (challengeId: string, limit?: number) => {
  const response = await Api.get(`/challenges/${challengeId}/leaderboard`, {
    params: { limit },
  });
  return response.data.data as {
    challengeId: string;
    snapshotAt: string;
    entries: LeaderboardEntry[];
    isCached: boolean;
  };
};

// ─── Partner ──────────────────────────────────────────────────────────────────

export const joinChallenge = async (challengeId: string) => {
  const response = await Api.post(`/challenges/${challengeId}/join`);
  return response.data.data as ChallengeParticipation;
};

export const submitProof = async (
  challengeId: string,
  payload: { screenshotUrls: string[]; postUrl?: string; note?: string }
) => {
  const response = await Api.post(`/challenges/${challengeId}/submit-proof`, payload);
  return response.data.data;
};

export const getMyParticipations = async () => {
  const response = await Api.get('/challenges/my/participations');
  return response.data.data as ChallengeParticipation[];
};

export const getMyProgress = async (participationId: string) => {
  const response = await Api.get(`/challenges/my/participations/${participationId}/progress`);
  return response.data.data as ChallengeParticipation & { metricLogs: any[] };
};

export const getMyBadges = async () => {
  const response = await Api.get('/challenges/my/badges');
  return response.data.data as UserBadge[];
};

export const getMySubmissions = async (challengeId: string) => {
  const response = await Api.get(`/challenges/${challengeId}/my-submissions`);
  return response.data.data as ChallengeSubmission[];
};

export const getMyPayoutHistory = async () => {
  const response = await Api.get('/challenges/my/payout-history');
  return response.data.data as ChallengePayout[];
};

/**
 * Re-fetch live social metrics for a specific proof submission.
 * Mirrors getPostMetrics() in the campaign flow — call this when the partner
 * clicks ↻ on a submitted proof to pull fresh likes/shares/views from the platform.
 */
export const refreshSubmissionMetrics = async (challengeId: string, submissionId: string) => {
  const response = await Api.post(`/challenges/${challengeId}/submissions/${submissionId}/refresh-metrics`);
  return response.data;
};

// ─── Vendor ───────────────────────────────────────────────────────────────────

export const vendorListChallenges = async (params?: {
  status?: ChallengeStatus;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const response = await Api.get('/vendor/challenges', { params });
  return response.data;
};

export const vendorCreateChallenge = async (payload: CreateChallengePayload) => {
  const response = await Api.post('/vendor/challenges', payload);
  return response.data.data as Challenge;
};

export const vendorGetChallenge = async (challengeId: string) => {
  const response = await Api.get(`/vendor/challenges/${challengeId}`);
  return response.data.data;
};

export const vendorUpdateChallenge = async (challengeId: string, payload: Partial<CreateChallengePayload>) => {
  const response = await Api.put(`/vendor/challenges/${challengeId}`, payload);
  return response.data.data as Challenge;
};

export const vendorUpdateChallengeStatus = async (
  challengeId: string,
  status: 'ACTIVE' | 'PAUSED'
) => {
  const response = await Api.put(`/vendor/challenges/${challengeId}/status`, { status });
  return response.data.data as Challenge;
};

export const vendorGetLeaderboard = async (challengeId: string, limit = 50) => {
  // Use the live public leaderboard endpoint which has a 2-minute cache
  // with automatic fallback to a direct DB query — same data source as the
  // partner view, so both sides always show consistent rankings.
  const response = await Api.get(`/challenges/${challengeId}/leaderboard`, {
    params: { limit },
  });
  return response.data.data as {
    challengeId: string;
    snapshotAt: string;
    entries: LeaderboardEntry[];
    isCached: boolean;
  };
};

export const vendorGetSubmissions = async (
  challengeId: string,
  params?: { status?: SubmissionStatus; page?: number; limit?: number }
) => {
  const response = await Api.get(`/vendor/challenges/${challengeId}/submissions`, { params });
  return response.data.data as { submissions: ChallengeSubmission[]; total: number; page: number; limit: number };
};

// ── Social-post metrics (same CampaignMetricsDTO shape as campaign charts) ──

export interface PlatformMetrics {
  platform: string;
  posts: number;
  views: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface ChallengeMetricsDTO {
  campaignId: string;
  totals: PlatformMetrics | null;
  byPlatform: PlatformMetrics[];
}

/** Partner: fetch validated post metrics for the current partner within the challenge window */
export const getChallengePostMetrics = async (challengeId: string): Promise<ChallengeMetricsDTO> => {
  const response = await Api.get(`/challenges/${challengeId}/my-post-metrics`);
  return response.data.data as ChallengeMetricsDTO;
};

/** Vendor: fetch aggregate validated post metrics across all participants */
export const vendorGetChallengeSocialMetrics = async (challengeId: string): Promise<ChallengeMetricsDTO> => {
  const response = await Api.get(`/vendor/challenges/${challengeId}/social-metrics`);
  return response.data.data as ChallengeMetricsDTO;
};

export type ChallengeMetricsTimeSeriesWindow = '30m' | '1h' | '2h' | '12h' | '24h';

/** ChallengeMetricSnapshot time series (metric value mapped to views/reach per bucket). */
export const vendorGetChallengeSocialMetricsTimeSeries = async (
  challengeId: string,
  window: ChallengeMetricsTimeSeriesWindow = '24h',
  bucket?: number,
) => {
  const response = await Api.get(`/vendor/challenges/${challengeId}/social-metrics/timeseries`, {
    params: { window, ...(bucket != null ? { bucket } : {}) },
  });
  return response.data.data as {
    window: ChallengeMetricsTimeSeriesWindow;
    bucketMinutes: number;
    points: Array<{
      timestamp: string;
      likes: number;
      comments: number;
      shares: number;
      views: number;
      impressions: number;
      reach: number;
    }>;
  };
};

// ─── FinalBoss (Admin) ────────────────────────────────────────────────────────

export const adminListChallenges = async (params?: {
  type?: ChallengeType;
  status?: ChallengeStatus;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const response = await Api.get('/finalboss/challenges', { params });
  return response.data;
};

export const adminCreateChallenge = async (payload: CreateChallengePayload) => {
  const response = await Api.post('/finalboss/challenges', payload);
  return response.data.data as Challenge;
};

export const adminGetChallenge = async (challengeId: string) => {
  const response = await Api.get(`/finalboss/challenges/${challengeId}`);
  return response.data.data as Challenge;
};

export const adminUpdateChallengeStatus = async (
  challengeId: string,
  status: ChallengeStatus,
  note?: string
) => {
  const response = await Api.put(`/finalboss/challenges/${challengeId}/status`, { status, note });
  return response.data.data as Challenge;
};

export const adminTriggerPayout = async (challengeId: string) => {
  const response = await Api.post(`/finalboss/challenges/${challengeId}/trigger-payout`);
  return response.data.data;
};

export const adminGetChallengePayouts = async (challengeId: string) => {
  const response = await Api.get(`/finalboss/challenges/${challengeId}/payouts`);
  return response.data.data as ChallengePayout[];
};

export const adminInitiateAllPayouts = async (challengeId: string) => {
  const response = await Api.post(`/finalboss/challenges/${challengeId}/payouts/initiate-all`);
  return response.data.data;
};

export const adminListSubmissions = async (
  challengeId: string,
  params?: { status?: SubmissionStatus; page?: number; limit?: number }
) => {
  const response = await Api.get(`/finalboss/challenges/${challengeId}/submissions`, { params });
  return response.data.data;
};

export const adminReviewSubmission = async (
  submissionId: string,
  payload: { status: SubmissionStatus; rejectionReason?: string; detectedMetricValue?: number }
) => {
  const response = await Api.post(`/finalboss/challenges/submissions/${submissionId}/review`, payload);
  return response.data.data;
};

export const adminGetFraudFlags = async (challengeId: string) => {
  const response = await Api.get(`/finalboss/challenges/${challengeId}/fraud-flags`);
  return response.data.data;
};

export const adminRefreshLeaderboard = async (challengeId: string) => {
  const response = await Api.post(`/finalboss/challenges/${challengeId}/leaderboard/refresh`);
  return response.data.data;
};
