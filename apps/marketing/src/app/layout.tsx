import type { Metadata } from "next";
import { fraunces, jakarta, plexMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "rsvp. — confirmação de presença, sem penetra",
  description:
    "Crie um evento, compartilhe um link e acompanhe as confirmações de presença em tempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
