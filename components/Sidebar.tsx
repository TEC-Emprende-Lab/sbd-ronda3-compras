"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type IconComp = (props: { className?: string }) => React.ReactNode;

interface NavLink {
  href: string;
  label: string;
  icon: IconComp;
  exact?: boolean;
}
interface NavGroup {
  label: string;
  icon: IconComp;
  children: NavLink[];
}
type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
function IconPieChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
  );
}
function IconCheckBadge({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  );
}

const NAV: NavEntry[] = [
  { href: "/", label: "Proyectos", icon: IconHome, exact: true },
  {
    label: "Reportes",
    icon: IconBarChart,
    children: [
      { href: "/reporte", label: "Sesión", icon: IconClock },
      { href: "/reporte/mensual", label: "Mensual", icon: IconBarChart },
      { href: "/reporte/general", label: "General", icon: IconPieChart },
      { href: "/reporte/fundatec", label: "Conciliar FUNDATEC", icon: IconCheckBadge },
    ],
  },
  { href: "/papelera", label: "Papelera", icon: IconTrash },
];

function linkClass() {
  return "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95";
}
function linkStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "var(--surface-brand-active)" : "transparent",
    color: active ? "var(--surface-brand-active-text)" : "rgba(255,255,255,.85)",
    fontWeight: active ? 600 : 500,
  };
}

function NavGroupItem({ group, pathname, onNavigate }: { group: NavGroup; pathname: string; onNavigate?: () => void }) {
  const childActive = group.children.some((c) => pathname.startsWith(c.href));
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? childActive;
  const Icon = group.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className={`${linkClass()} w-full`}
        style={linkStyle(false)}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <IconChevron className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-4">
          {group.children.map(({ href, label, icon: ChildIcon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={linkClass()}
                style={linkStyle(active)}
              >
                <ChildIcon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegación principal" className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      {NAV.map((entry) => {
        if (isGroup(entry)) {
          return <NavGroupItem key={entry.label} group={entry} pathname={pathname} onNavigate={onNavigate} />;
        }
        const { href, label, icon: Icon, exact } = entry;
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={onNavigate} className={linkClass()} style={linkStyle(active)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ email, onLogout }: { email: string | null; onLogout: () => void }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const bottomBar = (
    <div className="p-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
      {email && (
        <p className="text-[10px] truncate px-3 mb-2" style={{ color: "rgba(255,255,255,.6)" }} title={email}>
          {email}
        </p>
      )}
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full active:scale-95 hover:bg-white/10"
        style={{ color: "rgba(255,255,255,.7)" }}
      >
        <IconLogout className="h-4 w-4" />
        Salir
      </button>
    </div>
  );

  return (
    <>
      {/* Barra superior móvil */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--sidebar-bg)", borderBottom: "1px solid var(--sidebar-border)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-tec-blanco.png" alt="TEC Emprende Lab" style={{ height: 26, width: "auto" }} />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="p-1 transition-colors"
          style={{ color: "rgba(255,255,255,.85)" }}
        >
          <IconMenu className="h-6 w-6" />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Drawer móvil */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tec-blanco.png" alt="TEC Emprende Lab" style={{ height: 28, width: "auto" }} />
          <button onClick={() => setMobileOpen(false)} style={{ color: "rgba(255,255,255,.85)" }}>
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-3">
          <Link
            href="/tramites/nuevo"
            onClick={() => setMobileOpen(false)}
            className="btn btn-orange w-full justify-center"
          >
            <IconPlus className="h-4 w-4" />
            Nuevo trámite
          </Link>
        </div>
        <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        {bottomBar}
      </aside>

      {/* Sidebar de escritorio */}
      <aside
        className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto"
        style={{ width: 220, background: "var(--sidebar-bg)" }}
      >
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tec-blanco.png" alt="TEC Emprende Lab" style={{ height: 30, width: "auto" }} />
          <p className="text-[10px] tracking-widest uppercase mt-1.5" style={{ color: "rgba(255,255,255,.6)" }}>
            Control de Compras · SBD R3
          </p>
        </div>
        <div className="px-3 pt-3">
          <Link href="/tramites/nuevo" className="btn btn-orange w-full justify-center">
            <IconPlus className="h-4 w-4" />
            Nuevo trámite
          </Link>
        </div>
        <NavLinks pathname={pathname} />
        {bottomBar}
      </aside>
    </>
  );
}
