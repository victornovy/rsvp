import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-plum px-4 py-16">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-plum-soft opacity-60 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-guava opacity-20 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 text-center">
          <p className="font-display text-4xl italic text-white">rsvp.</p>
          <p className="mt-2 text-sm text-white/70">Sua lista de convidados, sem penetra.</p>
        </div>

        <div className="rounded-card bg-card px-8 pb-8 pt-10 text-center shadow-card">
          <h1 className="font-display text-xl text-ink">Entrar</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Crie eventos e acompanhe as confirmações em um só lugar.
          </p>
          <div className="mt-6">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </main>
  );
}
