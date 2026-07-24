export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      <form action="/logout" method="POST">
        <button
          type="submit"
          className="text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          Sair
        </button>
      </form>
    </header>
  );
}
