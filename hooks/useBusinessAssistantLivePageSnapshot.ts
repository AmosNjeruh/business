import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { loadBusinessAssistantLiveSnapshot } from "@/lib/businessAssistantLiveSnapshot";

/**
 * Refreshes vendor API snapshot when the Business Suite route changes.
 * Read via the returned getter at send time so messages include the latest fetch.
 */
export function useBusinessAssistantLivePageSnapshot(): () => Record<string, unknown> | null {
  const router = useRouter();
  const pathname = router.pathname ?? "";
  const snapshotRef = useRef<Record<string, unknown> | null>(null);
  const generationRef = useRef(0);

  const queryKey =
    router.isReady && router.query ? JSON.stringify(router.query) : "";

  useEffect(() => {
    if (!router.isReady) return;
    const gen = ++generationRef.current;
    snapshotRef.current = null;
    let cancelled = false;

    void (async () => {
      const snap = await loadBusinessAssistantLiveSnapshot(pathname, router.query);
      if (cancelled || gen !== generationRef.current) return;
      snapshotRef.current = snap;
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, pathname, queryKey]);

  return useCallback(() => snapshotRef.current, []);
}
