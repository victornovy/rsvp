"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Only ever mounted on the public RSVP page (`/e/:public_token`) — never in
 * the organizer's panel and never on the door-validation screen. Renders
 * nothing when there's no AdSense client id configured, or when the event
 * has the `remove_ads` add-on active.
 */
export function AdSlot({ hideAds }: { hideAds: boolean }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled = Boolean(client) && !hideAds;

  useEffect(() => {
    if (!enabled) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Bloqueado por adblock ou script ainda não carregado — sem problema,
      // o slot só fica em branco.
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="my-6">
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
