import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Catalitec — Control de Compras",
  description: "Control de trámites y presupuesto SBD Ronda 3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* Skip to content — accessibility */}
        <a href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
          Saltar al contenido
        </a>

        <header style={{ background: "var(--sidebar-bg)", borderBottom: "1px solid var(--sidebar-border)" }}
          className="sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              {/* Logo TEC Emprende Lab */}
              <Link href="/" className="flex items-center gap-3" aria-label="TEC Emprende Lab — Inicio">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-tec-blanco.png" alt="TEC Emprende Lab" style={{ height: 30, width: "auto", display: "block", flexShrink: 0 }} />
                <span style={{
                  color: "var(--sidebar-muted)", fontSize: 11, paddingLeft: 12,
                  borderLeft: "1px solid var(--sidebar-border)",
                }}>
                  Control de Compras · SBD R3
                </span>
              </Link>

              {/* Nav */}
              <nav aria-label="Navegación principal" className="flex items-center gap-1">
                <Link href="/"
                  style={{ color: "var(--sidebar-muted)", fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: "var(--radius-md)", transition: "all .15s" }}
                  className="hover:text-cream hover:bg-white/10">
                  Proyectos
                </Link>
                <Link href="/reporte"
                  style={{ color: "var(--sidebar-muted)", fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: "var(--radius-md)", transition: "all .15s" }}
                  className="hover:text-cream hover:bg-white/10">
                  Sesión
                </Link>
                <Link href="/reporte/mensual"
                  style={{ color: "var(--sidebar-muted)", fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: "var(--radius-md)", transition: "all .15s" }}
                  className="hover:text-cream hover:bg-white/10">
                  Mensual
                </Link>
                <Link href="/reporte/general"
                  style={{ color: "var(--sidebar-muted)", fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: "var(--radius-md)", transition: "all .15s" }}
                  className="hover:text-cream hover:bg-white/10">
                  General
                </Link>
                <Link href="/papelera" aria-label="Papelera"
                  style={{ color: "var(--sidebar-muted)", fontSize: 13, fontWeight: 500, padding: "8px 10px", borderRadius: "var(--radius-md)", transition: "all .15s", display: "inline-flex", alignItems: "center" }}
                  className="hover:text-cream hover:bg-white/10">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </Link>
                <div className="mx-2 h-4 w-px" style={{ background: "var(--sidebar-border)" }} />
                <Link href="/tramites/nuevo" className="btn btn-orange">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nuevo trámite
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="mt-16 py-6" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-center text-xs" style={{ color: "var(--gray)" }}>
            TEC Emprende Lab · Control de Compras SBD Ronda 3
          </p>
        </footer>
      </body>
    </html>
  );
}
