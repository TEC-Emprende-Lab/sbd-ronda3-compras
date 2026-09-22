-- ============================================================
-- Agrega el tipo de trámite "Pago Contrato" a la tabla tramites.
--
-- schema.sql ya trae este valor en el CHECK para instalaciones nuevas,
-- pero una base ya creada tiene la restricción vieja y hay que
-- actualizarla a mano. Correr una sola vez en el SQL Editor de Supabase.
-- Es idempotente.
-- ============================================================

ALTER TABLE tramites DROP CONSTRAINT IF EXISTS tramites_type_check;

ALTER TABLE tramites ADD CONSTRAINT tramites_type_check
  CHECK (type IN ('factura', 'reintegro', 'uso_tc', 'comision_bancaria', 'pago_contrato'));
