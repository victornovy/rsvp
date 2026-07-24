const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Confirmação de presença, sem complicação.
      </h1>
      <p className="max-w-lg text-gray-600">
        Crie seu evento, compartilhe um link e acompanhe quem confirmou presença
        em tempo real. Em breve: controle de acesso anti-penetra com QR único
        na porta.
      </p>
      <a
        href={`${APP_URL}/login`}
        className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white"
      >
        Criar meu evento
      </a>
    </main>
  );
}
