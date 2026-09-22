"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "var(--cream)" }}
    >
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 2px 16px rgba(26,22,18,.08)",
        }}
      >
        {/* Header band */}
        <div
          className="flex flex-col items-center px-8 pt-8 pb-7 text-center"
          style={{ background: "var(--sidebar-bg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-tec-blanco.png"
            alt="TEC Emprende Lab"
            style={{ height: 40, width: "auto" }}
          />
          <p
            className="mt-2"
            style={{ color: "var(--sidebar-muted)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" }}
          >
            Control de Compras · SBD R3
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <h1 className="mb-1 text-center text-lg font-semibold" style={{ color: "var(--black)" }}>
            Iniciar sesión
          </h1>
          <p className="mb-6 text-center text-sm" style={{ color: "var(--gray)" }}>
            Acceso restringido al equipo
          </p>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="caps block">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="finput w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="caps block">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="finput w-full"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg p-3 text-sm"
                style={{ background: "#FDEBD8", border: "1px solid var(--cream-3)", color: "var(--orange-d)" }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-orange w-full justify-center">
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: "var(--gray)" }}>
        TEC Emprende Lab · Control de Compras SBD Ronda 3
      </p>
    </div>
  );
}
