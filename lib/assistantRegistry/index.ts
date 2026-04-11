import type { BusinessAssistantScreen } from './businessScreens';
import { BUSINESS_ASSISTANT_SCREENS, ADMIN_UNKNOWN_FALLBACK } from './businessScreens';

const byPathname = new Map<string, BusinessAssistantScreen>(
  BUSINESS_ASSISTANT_SCREENS.map((s) => [s.pathname, s])
);

/**
 * Resolve Business Suite screen metadata for the Next.js route template (router.pathname).
 */
export function matchBusinessAssistantScreen(
  pathname: string | undefined
): BusinessAssistantScreen {
  if (!pathname || !pathname.startsWith('/admin')) {
    return ADMIN_UNKNOWN_FALLBACK;
  }
  const hit = byPathname.get(pathname);
  if (hit) {
    return hit;
  }
  return {
    ...ADMIN_UNKNOWN_FALLBACK,
    pathname,
    title: 'Business Suite',
    modelBrief: `${ADMIN_UNKNOWN_FALLBACK.modelBrief}\n\nUnlisted route template: \`${pathname}\`. Infer purpose from the URL segments and global Business Suite docs; ask clarifying questions if needed.`,
  };
}

export type { BusinessAssistantScreen } from './businessScreens';
export { BUSINESS_ASSISTANT_SCREENS } from './businessScreens';
