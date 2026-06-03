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
        <header className="bg-ink border-b border-ink-2 sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo — same style as Plataforma de Cursos */}
              <Link href="/" className="flex items-center gap-3">
                <div style={{
                  width: 36, height: 36, background: "#E8651A",
                  borderRadius: 8, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ color: "#fff", fontFamily: "DM Serif Display, serif", fontSize: 16 }}>T</span>
                </div>
                <div>
                  <div style={{ color: "#FAF6EE", fontFamily: "DM Serif Display, serif", fontSize: 15, lineHeight: 1.2 }}>
                    TEC Emprende Lab
                  </div>
                  <div style={{ color: "#8A8070", fontSize: 11, marginTop: 2 }}>Control de Compras · SBD R3</div>
                </div>
              </Link>

              {/* Nav */}
              <nav className="flex items-center gap-1">
                <Link href="/" className="px-3 py-2 text-sm font-medium text-cream/60 hover:text-cream hover:bg-white/10 rounded-lg transition-all duration-150">
                  Proyectos
                </Link>
                <Link href="/reporte" className="px-3 py-2 text-sm font-medium text-cream/60 hover:text-cream hover:bg-white/10 rounded-lg transition-all duration-150">
                  Reporte
                </Link>
                <div className="mx-2 h-4 w-px bg-white/20" />
                <Link href="/tramites/nuevo" className="btn-primary text-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nuevo trámite
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="mt-16 border-t border-border py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-muted">
              TEC Emprende Lab · Control de Compras SBD Ronda 3 · FUNDATEC
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
