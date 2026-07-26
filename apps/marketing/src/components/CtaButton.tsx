"use client";

import { trackEvent } from "@/lib/analytics";

export function CtaButton({
  href,
  children,
  className,
  eventName = "cta_create_event",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  eventName?: string;
}) {
  return (
    <a href={href} onClick={() => trackEvent(eventName)} className={className}>
      {children}
    </a>
  );
}
