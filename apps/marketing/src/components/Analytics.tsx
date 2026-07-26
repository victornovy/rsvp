import Script from "next/script";

/**
 * Cookie-less analytics (Plausible-compatible). Renders nothing when
 * NEXT_PUBLIC_ANALYTICS_ID isn't set — no third-party script loads in dev
 * or in any deploy that hasn't configured it.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_ID;
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
