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

              {/* Logo wordmark — design system spec */}
              <Link href="/" className="flex items-center gap-3" aria-label="TEC Emprende Lab — Inicio">
                <div style={{
                  width: 36, height: 36,
                  background: "var(--orange)",
                  borderRadius: "var(--radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ color: "#fff", fontFamily: "Poppins, sans-serif", fontSize: 16, fontWeight: 700 }}>T</span>
                </div>
                <div>
                  <div style={{ color: "var(--sidebar-text)", fontFamily: "Poppins, sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>
                    TEC EMPRENDE<span style={{ color: "var(--orange)" }}> Lab</span>
                  </div>
                  <div style={{ color: "var(--sidebar-muted)", fontSize: 11, marginTop: 1 }}>
                    Control de Compras · SBD R3
                  </div>
                </div>
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
                  Reporte
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
            TEC Emprende Lab · Control de Compras SBD Ronda 3 · FUNDATEC
          </p>
        </footer>
      </body>
    </html>
  );
}
