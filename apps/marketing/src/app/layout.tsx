import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSVP — Confirmação de presença sem complicação",
  description:
    "Crie um evento, compartilhe um link e acompanhe as confirmações de presença em tempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
