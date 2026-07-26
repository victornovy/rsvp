"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon } from "@/components/icons";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink/30"
    >
      {copied ? <CheckIcon width={14} height={14} className="text-mint" /> : <LinkIcon width={14} height={14} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
