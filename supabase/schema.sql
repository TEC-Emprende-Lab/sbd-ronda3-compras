-- Proyectos SBD Ronda 3
CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prototipado', 'puesta_en_marcha')),
  budget DECIMAL(12,2) NOT NULL
);

-- Trámites: compras por OC (factura), reintegros, uso de TC
CREATE TABLE IF NOT EXISTS tramites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('factura', 'reintegro', 'uso_tc', 'comision_bancaria')),
  status TEXT NOT NULL DEFAULT 'en_proceso_firmas'
    CHECK (status IN ('en_proceso_firmas', 'en_sistema_fundatec', 'aprobado', 'rechazado')),
  invoice_number TEXT,
  supplier TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  submission_date DATE,
  approval_date DATE,
  notes TEXT,
  checklist JSONB NOT NULL DEFAULT '{}',
  fundatec_number TEXT,
  deleted_at TIMESTAMPTZ,
  historical BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tramites_updated_at
  BEFORE UPDATE ON tramites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
