import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-txt-muted">
        <span className="text-2xl font-bold">404</span>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-txt-primary">Página no encontrada</h2>
      <p className="mt-1 text-sm text-txt-secondary">La página que buscas no existe o fue movida.</p>
      <Button asChild className="mt-6" variant="secondary">
        <Link href="/">
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
      </Button>
    </main>
  );
}
