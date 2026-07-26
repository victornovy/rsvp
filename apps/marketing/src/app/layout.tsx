import type { Metadata } from "next";
import { fraunces, jakarta, plexMono } from "./fonts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  // Sobrescreve o `title` string do buildMetadata por um template, para que
  // páginas filhas (ex: "Preços") virem "Preços — rsvp." automaticamente.
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
        <JsonLd data={organizationJsonLd} />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
