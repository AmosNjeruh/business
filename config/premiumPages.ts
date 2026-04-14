export interface PremiumPageRule {
  /**
   * Route prefix to protect, e.g. "/admin/emails"
   * Matches exact path or any child path.
   */
  pathPrefix: string;
  featureName: string;
  description?: string;
}

/**
 * Single source of truth for premium-only pages in Business Suite.
 * Add/remove prefixes here to switch premium access quickly.
 */
export const PREMIUM_PAGE_RULES: PremiumPageRule[] = [
  {
    pathPrefix: '/admin/emails',
    featureName: 'Workspace Emails',
    description: 'Send and track email campaigns to partners and brands.',
  },
  {
    pathPrefix: '/admin/api-access',
    featureName: 'API Access',
    description: 'Generate and manage long-lived API keys.',
  },
];

export function getPremiumRuleForPath(pathname: string): PremiumPageRule | null {
  for (const rule of PREMIUM_PAGE_RULES) {
    if (pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`)) {
      return rule;
    }
  }
  return null;
}

