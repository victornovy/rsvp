import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Entrar no RSVP</h1>
        <p className="mt-2 text-sm text-gray-500">
          Gerencie seus eventos e confirmações de presença.
        </p>
        <div className="mt-6">
          <GoogleLoginButton />
        </div>
      </div>
    </main>
  );
}
