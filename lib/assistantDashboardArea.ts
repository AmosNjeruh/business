/**
 * Coarse Business Suite section for assistant context (keep in sync with
 * `api/controllers/assistant/buildSystemMessage.ts` → businessDashboardArea).
 */
export function assistantDashboardArea(pathname: string | undefined): string {
  const p = pathname || "";
  if (p === "/admin" || p === "") return "overview";
  if (p.startsWith("/admin/brands")) return "brands";
  if (p.startsWith("/admin/campaigns")) return "campaigns";
  if (p.startsWith("/admin/challenges")) return "challenges";
  if (p.startsWith("/admin/applications")) return "applications";
  if (p.startsWith("/admin/work-validation")) return "work_validation";
  if (p.startsWith("/admin/partners")) return "partners";
  if (p.startsWith("/admin/messages")) return "messages";
  if (p.startsWith("/admin/emails")) return "emails";
  if (p.startsWith("/admin/analytics")) return "analytics";
  if (p.startsWith("/admin/finance")) return "finance";
  if (p.startsWith("/admin/team")) return "team";
  if (p.startsWith("/admin/api-access")) return "api_access";
  if (p.startsWith("/admin/settings")) return "settings";
  if (p.startsWith("/admin/auth")) return "auth";
  return "other";
}
