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
        <header className="bg-navy sticky top-0 z-50 shadow-glass">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-glow">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                  </svg>
                </div>
                <div>
                  <span className="font-800 text-white tracking-tight text-base leading-none">Catalitec</span>
                  <span className="block text-[10px] font-500 text-white/40 tracking-widest uppercase leading-none mt-0.5">SBD Ronda 3</span>
                </div>
              </Link>

              {/* Nav */}
              <nav className="flex items-center gap-1">
                <Link href="/" className="px-3 py-2 text-sm font-500 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  Proyectos
                </Link>
                <Link href="/reporte" className="px-3 py-2 text-sm font-500 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  Reporte
                </Link>
                <div className="mx-2 h-4 w-px bg-white/20" />
                <Link href="/tramites/nuevo" className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-600 text-white hover:bg-brand-dark transition-all duration-200 shadow-glow">
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

        <footer className="mt-16 border-t border-gray-100 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-navy/30 font-500">
              Catalitec · Control de Compras SBD Ronda 3 · FUNDATEC
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
