// Business Suite – Vendor/Agency service layer
// Mirrors frontend/services/vendor.ts but for the business app (localStorage-based auth)

import Api from './api';

// ─── Campaigns ───────────────────────────────────────────────────────────────

export interface GetCampaignsParams {
  status?: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'REJECTED';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCampaignData {
  title: string;
  description: string;
  objective: string;
  budget: number;
  remainingBudget?: number;
  paymentStructure?: string;
  paymentAmount?: number;
  paymentType?: string;
  paymentPerInfluencer?: number;
  maxInfluencers?: number;
  followerTiers?: any[];
  targetUrl?: string | null;
  startDate: string;
  endDate: string;
  requirements?: string[];
  videoLink?: string | null;
  isPublic?: boolean;
  requireConnectedSocialMedia?: boolean;
  audienceTargeting?: any;
  useBalance?: boolean;
}

export const getCampaigns = async (params: GetCampaignsParams = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/campaigns', { params });
  return response.data;
};

export const getCampaign = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/campaigns/${id}`);
  return response.data.data;
};

export const createCampaign = async (data: CreateCampaignData) => {
  const response = await Api.post<{ data: any }>('/vendor/campaigns', data);
  return response.data.data;
};

export const updateCampaign = async (id: string, data: Partial<CreateCampaignData>) => {
  const response = await Api.put<{ data: any }>(`/vendor/campaigns/${id}`, data);
  return response.data.data;
};

export const deleteCampaign = async (id: string): Promise<void> => {
  await Api.delete(`/vendor/campaigns/${id}`);
};

export const uploadCampaignImage = async (campaignId: string, imageBase64: string) => {
  const response = await Api.post<{ data: any }>(`/vendor/campaigns/${campaignId}/image`, {
    image: imageBase64,
  });
  return response.data.data;
};

export const uploadAdditionalImages = async (campaignId: string, images: string[]) => {
  const response = await Api.post<{ data: any }>(`/vendor/campaigns/${campaignId}/additional-images`, {
    images,
  });
  return response.data.data;
};

export const addFundsToCampaign = async (data: { campaignId: string; amount: number }) => {
  const response = await Api.post<{ data: any }>('/vendor/campaigns/add-funds', data);
  return response.data.data;
};

export const getCampaignInvitations = async (campaignId: string) => {
  const response = await Api.get<{ data: any[] }>(`/vendor/campaigns/${campaignId}/invitations`);
  return response.data.data;
};

export const addProductsToCampaign = async (
  campaignId: string,
  products: Array<{
    productId: string;
    commissionRate?: number;
    commissionAmount?: number;
    commissionType?: 'PERCENTAGE' | 'FIXED';
  }>
) => {
  const response = await Api.post<{ data: any }>(`/vendor/campaigns/${campaignId}/products`, { products });
  return response.data.data;
};

export const getCampaignProducts = async (campaignId: string) => {
  const response = await Api.get<{ data: any[] }>(`/vendor/campaigns/${campaignId}/products`);
  return response.data.data;
};

export const removeProductFromCampaign = async (campaignId: string, productId: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/campaigns/${campaignId}/products/${productId}`);
  return response.data.data;
};

export const verifyPaystackPayment = async (reference: string) => {
  const response = await Api.get<{ data: any }>('/vendor/payments/paystack/verify', { params: { reference } });
  return response.data.data;
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const getDashboard = async () => {
  const response = await Api.get<{ data: any }>('/vendor/dashboard');
  return response.data.data;
};

// ─── Balance ─────────────────────────────────────────────────────────────────

export const getVendorBalance = async () => {
  const response = await Api.get<{ data: { balance: number } }>('/vendor/balance');
  return response.data.data;
};

// ─── Applications ────────────────────────────────────────────────────────────

export interface GetApplicationsParams {
  campaignId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  page?: number;
  limit?: number;
}

export const getApplications = async (params: GetApplicationsParams = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/applications', { params });
  return response.data;
};

export const getApplication = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/applications/${id}`);
  return response.data.data;
};

export const updateApplicationStatus = async (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  notes?: string
) => {
  const response = await Api.put<{ data: any }>(`/vendor/applications/${id}/status`, {
    status,
    notes,
  });
  return response.data.data;
};

// ─── Partners ────────────────────────────────────────────────────────────────

export interface GetPartnersParams {
  search?: string;
  niche?: string;
  page?: number;
  limit?: number;
}

export const getPartners = async (params: GetPartnersParams = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/partners', { params });
  return response.data;
};

export const getPartner = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/partners/${id}`);
  return response.data.data;
};

export const getPartnerNiches = async () => {
  const response = await Api.get<{ data: any[] }>('/vendor/partners/niches');
  return response.data.data;
};

export const getFavoritePartners = async (params?: { page?: number; limit?: number; category?: string }) => {
  const response = await Api.get<{ data: any[]; pagination?: any }>('/vendor/partners/favorites', { params });
  return response.data;
};

export const getPartnersWorkedWith = async () => {
  const response = await Api.get<{ data: any[] }>('/vendor/partners/worked-with');
  return response.data.data;
};

export const getBookmarkCategories = async () => {
  const response = await Api.get<{ data: any }>('/vendor/partners/bookmarks/categories');
  return response.data.data;
};

export const addPartnerToFavorites = async (partnerId: string, category?: string) => {
  const response = await Api.post<{ data: any }>(`/vendor/partners/${partnerId}/favorite`, { category });
  return response.data.data;
};

export const removePartnerFromFavorites = async (partnerId: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/partners/${partnerId}/favorite`);
  return response.data.data;
};

export const updateBookmarkCategory = async (partnerId: string, category?: string) => {
  const response = await Api.put<{ data: any }>(`/vendor/partners/${partnerId}/bookmark`, { category });
  return response.data.data;
};

export const getPartnerSocialMetrics = async (partnerId: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/partners/${partnerId}/social-metrics`);
  return response.data.data;
};

// ─── Vendor Memberships ──────────────────────────────────────────────────────

export const getVendorMemberships = async () => {
  const response = await Api.get<{ data: any }>('/vendor/memberships');
  return response.data.data;
};

export const getMyPermissions = async (): Promise<{
  permissions: string[];
  isOwner: boolean;
  role?: any;
}> => {
  const response = await Api.get<{ data: { permissions: string[]; isOwner: boolean; role?: any } }>(
    '/vendor/my-permissions'
  );
  return response.data.data;
};

// ─── Work Submissions ────────────────────────────────────────────────────────

export const getWorkSubmissions = async (params: any = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/applications/work-submissions', { params });
  return response.data;
};

export const updateWorkSubmission = async (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) => {
  if (status === 'APPROVED') {
    const response = await Api.post<{ data: any }>(`/vendor/applications/${id}/approve-work`, { notes: reason });
    return response.data.data;
  } else {
    const response = await Api.post<{ data: any }>(`/vendor/applications/${id}/reject-work`, { reason });
    return response.data.data;
  }
};

// ─── Team (RBAC – mirror frontend vendor service) ─────────────────────────────

export const getTeamPermissions = async (): Promise<{
  permissions: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    category: string | null;
  }>;
}> => {
  const response = await Api.get<{ data: { permissions: any[] } }>('/vendor/team/permissions');
  return response.data.data;
};

export const getTeamRoles = async (): Promise<{ roles: any[] }> => {
  const response = await Api.get<{ data: { roles: any[] } }>('/vendor/team/roles');
  return response.data.data;
};

export const createTeamRole = async (data: {
  name: string;
  description?: string;
  permissionIds?: string[];
}): Promise<any> => {
  const response = await Api.post<{ data: any }>('/vendor/team/roles', data);
  return response.data.data;
};

export const updateTeamRole = async (
  id: string,
  data: { name?: string; description?: string; permissionIds?: string[] }
): Promise<any> => {
  const response = await Api.put<{ data: any }>(`/vendor/team/roles/${id}`, data);
  return response.data.data;
};

export const deleteTeamRole = async (id: string): Promise<void> => {
  await Api.delete(`/vendor/team/roles/${id}`);
};

export const getTeamStaff = async (): Promise<{ staff: any[]; invitations: any[] }> => {
  const response = await Api.get<{ data: { staff: any[]; invitations: any[] } }>('/vendor/team/staff');
  return response.data.data;
};

export const inviteTeamStaff = async (data: {
  email: string;
  roleId: string;
}): Promise<{ staff?: any; invitation?: any }> => {
  const response = await Api.post<{ data: { staff?: any; invitation?: any } }>('/vendor/team/staff', data);
  return response.data.data;
};

export const updateTeamStaffRole = async (
  staffId: string,
  roleId: string
): Promise<{ staff: any }> => {
  const response = await Api.put<{ data: { staff: any } }>(`/vendor/team/staff/${staffId}`, { roleId });
  return response.data.data;
};

export const removeTeamStaff = async (staffId: string): Promise<void> => {
  await Api.delete(`/vendor/team/staff/${staffId}`);
};

export const getInvitationByToken = async (token: string): Promise<{ invitation: any }> => {
  const response = await Api.get<{ data: { invitation: any } }>(`/vendor/team/invitations/${token}`);
  return response.data.data;
};

export const acceptInvitation = async (
  token: string
): Promise<{ token: string; needsPassword: boolean; email: string }> => {
  const response = await Api.post<{ data: { token: string; needsPassword: boolean; email: string } }>(
    '/vendor/team/invitations/accept',
    { token }
  );
  return response.data.data;
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  await Api.delete(`/vendor/team/invitations/${invitationId}`);
};

// ─── Stripe / Paystack ──────────────────────────────────────────────────────

export interface CreateCheckoutSessionData {
  email: string;
  amount: number;
  campaignTitle?: string;
  budget?: number;
  vendorId: string;
  vendorName?: string;
  type?: string;
}

export const createStripeCheckoutSession = async (data: CreateCheckoutSessionData) => {
  const response = await Api.post<{ data: { url: string } }>('/vendor/payments/stripe/checkout', {
    ...data,
    source: 'business', // Indicate this is from business suite
  });
  return response.data.data;
};

export const createPaystackSession = async (
  data: CreateCheckoutSessionData & { currency?: string }
) => {
  const response = await Api.post<{ data: { authorization_url: string } }>(
    '/vendor/payments/paystack/checkout',
    {
      ...data,
      source: 'business', // Indicate this is from business suite
    }
  );
  return response.data.data;
};

// ─── Influencer Discovery ────────────────────────────────────────────────────

export interface GetInfluencersParams {
  search?: string;
  niche?: string;
  platform?: string;
  minFollowers?: number;
  maxFollowers?: number;
  page?: number;
  limit?: number;
}

export const getInfluencers = async (params: GetInfluencersParams = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/influencers', { params });
  return response.data;
};

export const getInfluencer = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/influencers/${id}`);
  return response.data.data;
};

export const inviteInfluencer = async (data: {
  influencerId?: string;
  email?: string;
  campaignId?: string;
  message?: string;
}) => {
  const response = await Api.post<{ data: any }>('/vendor/invitations', data);
  return response.data.data;
};

// ─── Brands ──────────────────────────────────────────────────────────────────

export interface BrandData {
  name: string;
  email: string;
  phone?: string;
  description?: string;
  industry?: string;
  niche?: string;
}

export const getBrands = async () => {
  // Fetch brands without vendor context header
  // This allows fetching brands even if an invalid brand is stored in localStorage
  // The backend will default to authenticated user's own vendor
  const response = await Api.get<{ data: any[] }>('/vendor/brands', {
    headers: {
      'x-selected-vendor-disabled': 'true', // Signal to interceptor to not add vendor header
    } as any,
  });
  return response.data.data;
};

// ─── Emails ───────────────────────────────────────────────────────────────

export interface SendVendorEmailData {
  recipients: string[];
  subject: string;
  message: string;
  isHtml?: boolean;
  recipientType?: 'brand' | 'partner';
}

export interface GetVendorEmailHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'sent' | 'scheduled' | 'draft';
}

export interface GetVendorEmailRecipientsParams {
  type?: 'brand' | 'partner';
  search?: string;
}

export const sendVendorEmails = async (data: SendVendorEmailData) => {
  const response = await Api.post<{ success: boolean; data: any; message?: string }>('/vendor/emails/send', data);
  return response.data;
};

export const getVendorEmailHistory = async (params: GetVendorEmailHistoryParams = {}) => {
  const response = await Api.get<{ success: boolean; data: any; message?: string }>('/vendor/emails/history', { params });
  return response.data;
};

export const getVendorEmailRecipients = async (params: GetVendorEmailRecipientsParams = {}) => {
  const response = await Api.get<{ data: any }>('/vendor/emails/recipients', { params });
  return response.data;
};

export const getBrand = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/brands/${id}`);
  return response.data.data;
};

export const createBrand = async (data: BrandData) => {
  const response = await Api.post<{ data: any }>('/vendor/brands', data);
  return response.data.data;
};

export const updateBrand = async (id: string, data: Partial<BrandData>) => {
  const response = await Api.put<{ data: any }>(`/vendor/brands/${id}`, data);
  return response.data.data;
};

export const deleteBrand = async (id: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/brands/${id}`);
  return response.data.data;
};

// ─── Categories ──────────────────────────────────────────────────────────────────
export const getCategories = async () => {
  const response = await Api.get<{ data: { categories: Array<{ id: string; name: string; slug: string; description?: string; niches: Array<{ id: string; name: string; slug: string }> }> } }>('/vendor/categories');
  return response.data.data.categories;
};

// ─── WhatsApp ──────────────────────────────────────────────────────────────────

export const requestWhatsappCode = async (whatsappNumber: string) => {
  const response = await Api.post<{ data: any }>('/vendor/whatsapp/request-code', { whatsappNumber });
  return response.data.data;
};

export const verifyWhatsappCode = async (code: string) => {
  const response = await Api.post<{ data: any }>('/vendor/whatsapp/verify', { code });
  return response.data.data;
};

// ─── Products ───────────────────────────────────────────────────────────────────

export interface GetProductsParams {
  isActive?: boolean;
  isApproved?: boolean;
  showInMarketplace?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getProducts = async (params: GetProductsParams = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/products', { params });
  return response.data;
};

export const getProduct = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/products/${id}`);
  return response.data.data;
};

export const createProduct = async (data: any) => {
  const response = await Api.post<{ data: any }>('/vendor/products', data);
  return response.data.data;
};

export const bulkCreateProducts = async (products: any[]) => {
  const response = await Api.post<{ data: any }>('/vendor/products/bulk', { products });
  return response.data.data;
};

export const validateCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await Api.post<{ data: any }>('/vendor/products/validate-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const downloadCSVTemplate = async () => {
  const response = await Api.get('/vendor/products/csv-template', { responseType: 'blob' });
  return response.data;
};

export const updateProduct = async (id: string, data: any) => {
  const response = await Api.put<{ data: any }>(`/vendor/products/${id}`, data);
  return response.data.data;
};

export const deleteProduct = async (id: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/products/${id}`);
  return response.data.data;
};

export const uploadProductImage = async (productId: string, imageBase64: string) => {
  const response = await Api.post<{ data: any }>(`/vendor/products/${productId}/image`, { image: imageBase64 });
  return response.data.data;
};

export const getProductProfitability = async (productId: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/products/${productId}/profitability`);
  return response.data.data;
};

export const getCommissionForAffiliate = async (productId: string, partnerId: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/products/${productId}/commission/${partnerId}`);
  return response.data.data;
};

// ─── Commission Groups ──────────────────────────────────────────────────────────

export interface GetCommissionGroupsParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const getCommissionGroups = async (params: GetCommissionGroupsParams = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/commission-groups', { params });
  return response.data;
};

export const getCommissionGroup = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/commission-groups/${id}`);
  return response.data.data;
};

export const createCommissionGroup = async (data: any) => {
  const response = await Api.post<{ data: any }>('/vendor/commission-groups', data);
  return response.data.data;
};

export const updateCommissionGroup = async (id: string, data: any) => {
  const response = await Api.put<{ data: any }>(`/vendor/commission-groups/${id}`, data);
  return response.data.data;
};

export const deleteCommissionGroup = async (id: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/commission-groups/${id}`);
  return response.data.data;
};

export const addMemberToGroup = async (groupId: string, partnerId: string) => {
  const response = await Api.post<{ data: any }>(`/vendor/commission-groups/${groupId}/members`, { partnerId });
  return response.data.data;
};

export const removeMemberFromGroup = async (groupId: string, partnerId: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/commission-groups/${groupId}/members/${partnerId}`);
  return response.data.data;
};

export const createGroupOverride = async (groupId: string, data: any) => {
  const response = await Api.post<{ data: any }>(`/vendor/commission-groups/${groupId}/overrides`, data);
  return response.data.data;
};

export const deleteGroupOverride = async (overrideId: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/commission-groups/overrides/${overrideId}`);
  return response.data.data;
};

// ─── Sales ───────────────────────────────────────────────────────────────────────

export interface GetSalesParams {
  campaignId?: string;
  productId?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const getSales = async (params: GetSalesParams = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/sales', { params });
  return response.data;
};

export const getSale = async (id: string) => {
  const response = await Api.get<{ data: any }>(`/vendor/sales/${id}`);
  return response.data.data;
};

// ─── Reviews ─────────────────────────────────────────────────────────────────────

export const createCreatorReview = async (data: {
  creatorId: string;
  applicationId?: string;
  rating: number;
  comment?: string;
}) => {
  const response = await Api.post<{ data: any }>('/vendor/reviews', data);
  return response.data.data;
};

export const getVendorCreatorReviews = async () => {
  const response = await Api.get<{ data: any[] }>('/vendor/reviews');
  return response.data.data;
};

export const getCreatorReviews = async (creatorId: string) => {
  const response = await Api.get<{ data: any[] }>(`/vendor/creators/${creatorId}/reviews`);
  return response.data.data;
};

// ─── Ratings ────────────────────────────────────────────────────────────────────

export const getRatings = async () => {
  const response = await Api.get<{ data: any[] }>('/vendor/ratings');
  return response.data.data;
};

// ─── Donations ──────────────────────────────────────────────────────────────────

export const getDonations = async (page: number = 1, limit: number = 20) => {
  const response = await Api.get<{ data: any }>(`/vendor/donations?page=${page}&limit=${limit}`);
  return response.data.data;
};

// ─── Webhooks ────────────────────────────────────────────────────────────────────

export interface WebhookData {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    deliveries: number;
  };
}

export interface CreateWebhookData {
  url: string;
  events: string[];
  secret?: string;
}

export interface UpdateWebhookData {
  url?: string;
  events?: string[];
  isActive?: boolean;
}

export interface WebhookDelivery {
  id: string;
  eventType: string;
  payload: any;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  retryCount: number;
  attemptedAt: string;
  deliveredAt?: string;
}

export const getWebhooks = async (params: { isActive?: boolean } = {}) => {
  const response = await Api.get<{ data: WebhookData[] }>('/vendor/webhooks', { params });
  return response.data.data;
};

export const getWebhook = async (id: string) => {
  const response = await Api.get<{ data: WebhookData }>(`/vendor/webhooks/${id}`);
  return response.data.data;
};

export const createWebhook = async (data: CreateWebhookData) => {
  const response = await Api.post<{ data: WebhookData }>('/vendor/webhooks', data);
  return response.data.data;
};

export const updateWebhook = async (id: string, data: UpdateWebhookData) => {
  const response = await Api.put<{ data: WebhookData }>(`/vendor/webhooks/${id}`, data);
  return response.data.data;
};

export const deleteWebhook = async (id: string) => {
  await Api.delete(`/vendor/webhooks/${id}`);
  return { success: true };
};

export const testWebhook = async (id: string) => {
  const response = await Api.post<{ data: any }>(`/vendor/webhooks/${id}/test`, {});
  return response.data.data;
};

export const getWebhookDeliveries = async (id: string, params: { page?: number; limit?: number } = {}) => {
  const response = await Api.get<{ data: WebhookDelivery[]; pagination: any }>(`/vendor/webhooks/${id}/deliveries`, { params });
  return response.data;
};

// ─── Embeds ──────────────────────────────────────────────────────────────────

/**
 * Proxy TikTok oEmbed via the Express API (avoids browser CORS restrictions)
 * GET /api/public/tiktok-oembed?url=...
 */
export const getTikTokOembed = async (url: string): Promise<{ html?: string; error?: string }> => {
  const response = await Api.get('/public/tiktok-oembed', { params: { url } });
  return response.data;
};

// ─── Exports & Reports ──────────────────────────────────────────────────────────

export interface ExportOptions {
  format?: 'csv' | 'json';
  campaignId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
}

/**
 * Export campaigns to CSV/JSON
 * Returns blob URL for download
 */
export const exportCampaigns = async (options: ExportOptions = {}) => {
  const response = await Api.post('/vendor/exports/campaigns', options, {
    responseType: 'blob',
  });
  
  // Create blob URL for download
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `campaigns_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return { success: true };
};

/**
 * Export applications to CSV/JSON
 */
export const exportApplications = async (options: ExportOptions = {}) => {
  const response = await Api.post('/vendor/exports/applications', options, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return { success: true };
};

/**
 * Export partners to CSV/JSON
 */
export const exportPartners = async (options: ExportOptions = {}) => {
  const response = await Api.post('/vendor/exports/partners', options, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `partners_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return { success: true };
};

/**
 * Export analytics to CSV/JSON
 */
export const exportAnalytics = async (options: ExportOptions = {}) => {
  const response = await Api.post('/vendor/exports/analytics', options, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return { success: true };
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface GetAnalyticsParams {
  startDate?: string;
  endDate?: string;
  campaignId?: string;
  brandId?: string;
  groupBy?: 'day' | 'week' | 'month';
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
}

export interface AnalyticsSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalWorkSubmissions: number;
  approvedWork: number;
  rejectedWork: number;
  activePartners: number;
  totalConversions: number;
  totalEarned: number;
  influencerCampaigns: number;
  totalInfluencerPosts: number;
  topCampaigns: any[];
  topPartners: any[];
  topCreatorsInNiche: any[];
  recentApplications: any[];
  recentlyApprovedWork: any[];
  pendingReviewsCount: number;
  conversionRate: number;
  averageApplicationTime: number;
  averageApprovalTime: number;
}

export const getAnalytics = async (params: GetAnalyticsParams = {}) => {
  const response = await Api.get<{ data: AnalyticsSummary }>('/vendor/analytics', { params });
  return response.data.data;
};

export const getCampaignAnalytics = async (params: { campaignId?: string; timeRange?: string; status?: string; page?: number; limit?: number } = {}) => {
  if (params.campaignId) {
    const response = await Api.get<{ data: any }>(`/vendor/campaigns/${params.campaignId}/analytics`, { 
      params: { timeRange: params.timeRange } 
    });
    return response.data.data;
  }
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/analytics/campaigns', { params });
  return response.data;
};

export const getPartnerAnalytics = async (params: GetAnalyticsParams & { page?: number; limit?: number } = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/analytics/partners', { params });
  return response.data;
};

export const getFunnelAnalytics = async (params: GetAnalyticsParams & { campaignId?: string } = {}) => {
  const response = await Api.get<{ data: any }>('/vendor/analytics/funnel', { params });
  return response.data.data;
};

export const getTimeSeriesAnalytics = async (params: {
  metric: 'spend' | 'applications' | 'approvals' | 'completions';
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}) => {
  const response = await Api.get<{ data: any }>('/vendor/analytics/time-series', { params });
  return response.data.data;
};

// ─── Messages ────────────────────────────────────────────────────────────────

export interface GetMessagesParams {
  partnerId?: string;
  campaignId?: string;
  type?: 'APPLICATION' | 'CAMPAIGN' | 'PARTNER' | 'BROADCAST' | 'SYSTEM';
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface MessageThread {
  id: string;
  subject?: string;
  partner?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  campaign?: {
    id: string;
    title: string;
  };
  application?: {
    id: string;
    status: string;
  };
  type: 'APPLICATION' | 'CAMPAIGN' | 'PARTNER' | 'BROADCAST' | 'SYSTEM';
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface SendMessageData {
  recipientId?: string;
  recipientEmail?: string;
  subject?: string;
  content: string;
  campaignId?: string;
  applicationId?: string;
  type?: 'APPLICATION' | 'CAMPAIGN' | 'PARTNER' | 'BROADCAST' | 'SYSTEM';
}

export interface BroadcastMessageData {
  subject: string;
  content: string;
  targetGroup: 'all' | 'campaign' | 'brand';
  campaignId?: string;
  brandId?: string;
}

export const getMessages = async (params: GetMessagesParams = {}) => {
  const response = await Api.get<{ data: MessageThread[]; pagination: any }>('/vendor/messages', { params });
  return response.data;
};

export const getMessageThread = async (threadId: string, params: { page?: number; limit?: number } = {}) => {
  const response = await Api.get<{ data: MessageThread & { messages: any[]; pagination: any } }>(`/vendor/messages/${threadId}`, { params });
  return response.data.data;
};

export const sendMessage = async (data: SendMessageData) => {
  const response = await Api.post<{ data: any }>('/vendor/messages', data);
  return response.data.data;
};

export const broadcastMessage = async (data: BroadcastMessageData) => {
  const response = await Api.post<{ data: any }>('/vendor/messages/broadcast', data);
  return response.data.data;
};

export const markThreadRead = async (threadId: string) => {
  const response = await Api.put<{ data: any }>(`/vendor/messages/${threadId}/read`, {});
  return response.data.data;
};

export const markMessageRead = async (messageId: string) => {
  const response = await Api.put<{ data: any }>(`/vendor/messages/${messageId}/read`, {});
  return response.data.data;
};

export const deleteThread = async (threadId: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/messages/${threadId}`);
  return response.data.data;
};

// ─── API Keys Management ─────────────────────────────────────────────────────

export interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rawKey?: string; // Only shown once during creation
}

export interface CreateApiKeyData {
  name: string;
  permissions?: string[];
  expiresAt?: string;
}

export interface UpdateApiKeyData {
  name?: string;
  permissions?: string[];
  expiresAt?: string;
  isActive?: boolean;
}

export const getApiKeys = async (params: { isActive?: boolean; page?: number; limit?: number } = {}) => {
  const response = await Api.get<{ data: ApiKeyData[]; pagination: any }>('/vendor/api-keys', { params });
  return response.data;
};

export const getApiKey = async (id: string) => {
  const response = await Api.get<{ data: ApiKeyData }>(`/vendor/api-keys/${id}`);
  return response.data.data;
};

export const createApiKey = async (data: CreateApiKeyData) => {
  const response = await Api.post<{ data: ApiKeyData }>('/vendor/api-keys', data);
  return response.data.data;
};

export const updateApiKey = async (id: string, data: UpdateApiKeyData) => {
  const response = await Api.put<{ data: ApiKeyData }>(`/vendor/api-keys/${id}`, data);
  return response.data.data;
};

export const deleteApiKey = async (id: string) => {
  const response = await Api.delete<{ data: any }>(`/vendor/api-keys/${id}`);
  return response.data.data;
};

export const regenerateApiKey = async (id: string) => {
  const response = await Api.post<{ data: ApiKeyData }>(`/vendor/api-keys/${id}/regenerate`, {});
  return response.data.data;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotifications = async (params: { read?: boolean; type?: string; page?: number; limit?: number } = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/notifications', { params });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await Api.get<{ data: { count: number } }>('/vendor/notifications/unread-count');
  return response.data.data.count;
};

export const markNotificationRead = async (id: string) => {
  const response = await Api.put<{ data: any }>(`/vendor/notifications/${id}/read`, {});
  return response.data.data;
};

export const markAllNotificationsRead = async () => {
  const response = await Api.put<{ data: any }>('/vendor/notifications/read-all', {});
  return response.data.data;
};

// ─── Transaction History ─────────────────────────────────────────────────────

export const getTransactions = async (params: { page?: number; limit?: number } = {}) => {
  const response = await Api.get<{ data: any[]; pagination: any }>('/vendor/balance/transactions', { params });
  return response.data;
};

export const getTransactionHistory = async (page: number = 1, limit: number = 20) => {
  const response = await Api.get<{ data: any }>(`/vendor/balance/transactions?page=${page}&limit=${limit}`);
  return response.data.data;
};

export const topUpBalance = async (data: {
  amount: number;
  paymentMethod: 'stripe' | 'paystack';
  transactionId?: string;
  sessionId?: string;
}) => {
  const response = await Api.post<{ data: { balance: number } }>('/vendor/balance/top-up', data);
  return response.data.data;
};

export const deductBalance = async (data: { amount: number; reason?: string }) => {
  const response = await Api.post<{ data: any }>('/vendor/balance/deduct', data);
  return response.data.data;
};

export const checkBalance = async (data: { amount: number }) => {
  const response = await Api.post<{ data: { hasSufficientBalance: boolean } }>('/vendor/balance/check', data);
  return response.data.data;
};

// ─── Campaign Approval Actions ───────────────────────────────────────────────

export const approveWork = async (applicationId: string, notes?: string) => {
  const response = await Api.post<{ data: any }>(`/vendor/applications/${applicationId}/approve-work`, { notes });
  return response.data.data;
};

export const rejectWork = async (applicationId: string, reason: string) => {
  const response = await Api.post<{ data: any }>(`/vendor/applications/${applicationId}/reject-work`, { reason });
  return response.data.data;
};

export const bulkApproveWork = async (applicationIds: string[]): Promise<any> => {
  const response = await Api.post<{ data: any }>('/vendor/applications/bulk-approve-work', { applicationIds });
  return response.data.data;
};

// ─── Profile / Settings ───────────────────────────────────────────────────────
// Business Suite treats vendor \"profile\" as vendor settings, same as frontend vendor app.

export const getVendorProfile = async () => {
  const response = await Api.get<{ data: any }>('/vendor/settings');
  return response.data.data;
};

export const updateVendorProfile = async (data: any) => {
  const response = await Api.put<{ data: any }>('/vendor/settings', data);
  return response.data.data;
};

export default {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  uploadCampaignImage,
  getDashboard,
  getVendorBalance,
  getApplications,
  getApplication,
  updateApplicationStatus,
  getPartners,
  getPartner,
  getVendorMemberships,
  getMyPermissions,
  getWorkSubmissions,
  updateWorkSubmission,
  // Team RBAC
  getTeamPermissions,
  getTeamRoles,
  createTeamRole,
  updateTeamRole,
  deleteTeamRole,
  getTeamStaff,
  inviteTeamStaff,
  updateTeamStaffRole,
  removeTeamStaff,
  getInvitationByToken,
  acceptInvitation,
  cancelInvitation,
  createStripeCheckoutSession,
  createPaystackSession,
  // Influencer discovery
  getInfluencers,
  getInfluencer,
  inviteInfluencer,
  // Brands
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  // Emails
  sendVendorEmails,
  getVendorEmailHistory,
  getVendorEmailRecipients,
  // Analytics
  getAnalytics,
  getCampaignAnalytics,
  getPartnerAnalytics,
  getFunnelAnalytics,
  getTimeSeriesAnalytics,
  // Messages
  getMessages,
  getMessageThread,
  sendMessage,
  broadcastMessage,
  markThreadRead,
  markMessageRead,
  deleteThread,
  // API Keys
  getApiKeys,
  getApiKey,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  regenerateApiKey,
  // Notifications
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  // Balance
  getTransactions,
  getTransactionHistory,
  topUpBalance,
  // Work approval
  approveWork,
  rejectWork,
  bulkApproveWork,
  // Profile
  getVendorProfile,
  updateVendorProfile,
  // Categories
  getCategories,
  // Campaign extras
  uploadAdditionalImages,
  addFundsToCampaign,
  getCampaignInvitations,
  addProductsToCampaign,
  getCampaignProducts,
  removeProductFromCampaign,
  verifyPaystackPayment,
  // Partner extras
  getPartnerNiches,
  getFavoritePartners,
  getPartnersWorkedWith,
  getBookmarkCategories,
  addPartnerToFavorites,
  removePartnerFromFavorites,
  updateBookmarkCategory,
  getPartnerSocialMetrics,
  // Balance extras
  deductBalance,
  checkBalance,
  // WhatsApp
  requestWhatsappCode,
  verifyWhatsappCode,
  // Products
  getProducts,
  getProduct,
  createProduct,
  bulkCreateProducts,
  validateCSV,
  downloadCSVTemplate,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getProductProfitability,
  getCommissionForAffiliate,
  // Commission Groups
  getCommissionGroups,
  getCommissionGroup,
  createCommissionGroup,
  updateCommissionGroup,
  deleteCommissionGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  createGroupOverride,
  deleteGroupOverride,
  // Sales
  getSales,
  getSale,
  // Reviews
  createCreatorReview,
  getVendorCreatorReviews,
  getCreatorReviews,
  // Ratings
  getRatings,
  // Donations
  getDonations,
  // Webhooks
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookDeliveries,
  // Exports
  exportCampaigns,
  exportApplications,
  exportPartners,
  exportAnalytics,
  // Embeds
  getTikTokOembed,
};
