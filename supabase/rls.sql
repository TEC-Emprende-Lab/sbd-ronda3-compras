-- ============================================================
--  rls.sql — Row Level Security para Catalitec / Compras SBD R3
--
--  Sin estas políticas, cualquiera con la anon key (que va embebida
--  en el JS del navegador) puede leer/escribir projects y tramites
--  directamente contra la API de Supabase, saltándose el login.
--
--  Modelo: acceso total SOLO para usuarios autenticados (rol
--  `authenticated`). El rol `anon` (visitantes sin sesión) no tiene
--  ningún permiso. Todos los miembros del equipo con cuenta tienen
--  el mismo nivel de acceso — no hay sub-roles por ahora.
--
--  Ejecutar una vez en: Supabase → SQL Editor → Run.
--  Es idempotente: se puede volver a correr sin romper nada.
-- ============================================================

-- 1. Habilitar RLS en ambas tablas
ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tramites  ENABLE ROW LEVEL SECURITY;

-- 2. Quitar permisos del rol anónimo (defensa en profundidad:
--    aunque RLS ya bloquea, revocar GRANTs evita cualquier fuga).
REVOKE ALL ON projects  FROM anon;
REVOKE ALL ON tramites  FROM anon;

-- 3. Políticas: el rol `authenticated` puede hacer todo.
--    (DROP previo para que el script sea re-ejecutable.)

DROP POLICY IF EXISTS "authenticated_all_projects" ON projects;
CREATE POLICY "authenticated_all_projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_tramites" ON tramites;
CREATE POLICY "authenticated_all_tramites"
  ON tramites
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
