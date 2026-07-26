declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

/**
 * Fires a custom Plausible event. No-op when analytics isn't configured
 * (NEXT_PUBLIC_ANALYTICS_ID unset) or the script hasn't loaded yet — never
 * throws, since a tracking failure should never break a CTA click.
 */
export function trackEvent(name: string, props?: Record<string, string>) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") return;
  window.plausible(name, props ? { props } : undefined);
}
