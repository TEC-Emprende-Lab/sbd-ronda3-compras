"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  const isLogin = pathname?.startsWith("/login");

  useEffect(() => {
    if (isLogin) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [isLogin]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // En /login no mostramos el chrome de la app (sidebar/footer).
  if (isLogin) return <>{children}</>;

  return (
    <div className="app-shell">
      <Sidebar email={email} onLogout={handleLogout} />
      <div className="main-wrapper">
        <main id="main-content" className="main-content">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <footer className="py-6" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-center text-xs" style={{ color: "var(--gray)" }}>
            TEC Emprende Lab · Control de Compras SBD Ronda 3
            {email && <span> · {email}</span>}
          </p>
        </footer>
      </div>
    </div>
  );
}
