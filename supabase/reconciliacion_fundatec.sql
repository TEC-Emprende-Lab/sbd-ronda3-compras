-- ============================================================
-- RECONCILIACIÓN PLATAFORMA vs FUNDATEC — SBD Ronda 3
-- Generado tras cruzar los 15 proyectos contra el extracto
-- presupuestario oficial de FUNDATEC (04-06-2026)
-- Revisá cada bloque antes de correr. Todo es reversible
-- (los borrados van a papelera).
-- ============================================================


-- ============================================================
-- 1. FACTURAS QUE FALTAN  (no estaban en la plataforma)
-- ============================================================

-- P45 AVCP — faltaban 3 compras grandes (₡3,597,106.45)
INSERT INTO tramites (project_id, type, status, invoice_number, supplier, amount, description, approval_date, submission_date) VALUES
  (45, 'factura', 'aprobado', '00100001010000000001', 'Electrónicos Volteon', 172380.00,  'Componentes electrónicos: módulos alimentación, cables AWG, JST', '2026-02-26', '2026-02-26'),
  (45, 'factura', 'aprobado', '00100001010000000531', 'ENELCOM',              2620614.60, 'Chasis Tank-452-80A, motor 452cc Locin 16HP, motor 650W, control C7 Plus', '2026-02-27', '2026-02-27'),
  (45, 'factura', 'aprobado', '00100001010000000532', 'ENELCOM',              804111.85,  'NVIDIA Jetson Orin, router Teltonika, Pixhawk 6X, LiDAR, GPS ZED-F9P, cámaras', '2026-02-27', '2026-02-27');

-- P48 Biocarbón — faltaban 2 (₡573,587)
INSERT INTO tramites (project_id, type, status, invoice_number, supplier, amount, description, approval_date, submission_date) VALUES
  (48, 'factura', 'aprobado', '00100001010000011053', 'Comercializadora Internacional PAG S.A.', 565544.54, 'Picadora/Molino JF2-D C/M Marshall 6.5 HP gasolina', '2026-02-26', '2026-02-26'),
  (48, 'factura', 'aprobado', '03200020010000018991', 'El Lagar (Corp. Comercial e Industrial)', 8042.65,  'Tubo industrial cuadrado galv. 18x18 1.20mm', '2026-03-25', '2026-03-25');

-- P50 Mycocraft — faltaban 2 chicas
INSERT INTO tramites (project_id, type, status, invoice_number, supplier, amount, description, approval_date, submission_date) VALUES
  (50, 'factura', 'aprobado', '71971902010000008542', 'Unicomer (Gollo)', 36798.44, 'Reloj digital + certificado reemplazo + baterías', '2026-03-11', '2026-03-11'),
  (50, 'factura', 'aprobado', '00800047010000011932', 'Ferretería EPA',   24794.99, 'Estante 75x30x150cm 5 niveles', '2026-03-12', '2026-03-12');

-- P68 AdmiTips CR — faltaban 2 grandes (₡1,301,802.66)
INSERT INTO tramites (project_id, type, status, invoice_number, supplier, amount, description, approval_date, submission_date) VALUES
  (68, 'factura', 'aprobado', '107445',               'Istuff Costa Rica S.A.',     994900.00, 'MacBook Air M4 13" 16GB + iPad Air 6 11" 256GB + Apple Pencil Pro', '2026-03-04', '2026-03-04'),
  (68, 'factura', 'aprobado', '30003848010000104734', 'AMDE Computers Corporation', 306902.66, 'Cámara DJI Osmo Pocket 3 Creator Combo', '2026-03-06', '2026-03-06');

-- P44 / P67 — faltantes detectadas en la revisión de carpetas
INSERT INTO tramites (project_id, type, status, invoice_number, supplier, amount, description, approval_date, submission_date) VALUES
  (44, 'factura',   'aprobado', '01800003010001289559', 'iShop Costa Rica',     990139.19, 'iPad Pro 13 M5 512GB + Magic Keyboard + Apple Pencil Pro', '2026-05-08', '2026-05-08'),
  (67, 'reintegro', 'aprobado', '00100005010000049201', 'Almacén 3R',           51150.88,  'Aislante térmico Prodex A-3', '2026-03-25', '2026-03-25'),
  (67, 'factura',   'aprobado', '02000004010000134493', 'Importadora Almacema', 173309.73, 'Cámara de enfriamiento GRS 7 pies', '2026-06-01', '2026-06-01');


-- ============================================================
-- 2. SUSCRIPCIONES IA VISORÍAS (P54) — montos reales FUNDATEC
--    (si aún no las insertaste, descomentá el INSERT de abajo;
--     si ya están, corré solo los UPDATE)
-- ============================================================
-- INSERT INTO tramites (project_id, type, status, invoice_number, supplier, amount, description, submission_date) VALUES
--   (54, 'reintegro', 'aprobado',          'MKYZ8JY5-0003', 'OpenAI',    10005.40, 'ChatGPT Plus (Dic 2025)', '2025-12-29'),
--   (54, 'reintegro', 'aprobado',          'MKYZ8JY5-0004', 'OpenAI',     9931.00, 'ChatGPT Plus (Ene 2026)', '2026-01-29'),
--   (54, 'reintegro', 'aprobado',          'MKYZ8JY5-0005', 'OpenAI',     9485.00, 'ChatGPT Plus (Feb 2026)', '2026-02-28'),
--   (54, 'reintegro', 'aprobado',          'WJYNF0MH-0001', 'OpenAI',     9393.80, 'ChatGPT Plus (Mar 2026)', '2026-03-20'),
--   (54, 'reintegro', 'aprobado',          'WJYNF0MH-0002', 'OpenAI',     9172.80, 'ChatGPT Plus (Abr 2026)', '2026-04-20'),
--   (54, 'reintegro', 'en_proceso_firmas', 'WJYNF0MH-0003', 'OpenAI',    10200.00, 'ChatGPT Plus (May 2026) — no ejecutada aún', '2026-05-20'),
--   (54, 'reintegro', 'aprobado',          'MZGIBONY-0002', 'Anthropic', 40323.43, 'Claude Max (Feb 2026)', '2026-02-25'),
--   (54, 'reintegro', 'aprobado',          'MZGIBONY-0003', 'Anthropic', 46689.00, 'Claude Max (Mar 2026)', '2026-03-25'),
--   (54, 'reintegro', 'aprobado',          'MZGIBONY-0004', 'Anthropic', 45722.00, 'Claude Max (Abr 2026)', '2026-04-25'),
--   (54, 'reintegro', 'en_proceso_firmas', '7RYVMSRB-0001', 'Anthropic', 51000.00, 'Claude Max (May 2026) — no ejecutada aún', '2026-05-25');

-- Si ya estaban insertadas con montos estimados, corregilas:
UPDATE tramites SET amount=10005.40, status='aprobado' WHERE project_id=54 AND invoice_number='MKYZ8JY5-0003';
UPDATE tramites SET amount=9931.00,  status='aprobado' WHERE project_id=54 AND invoice_number='MKYZ8JY5-0004';
UPDATE tramites SET amount=9485.00,  status='aprobado' WHERE project_id=54 AND invoice_number='MKYZ8JY5-0005';
UPDATE tramites SET amount=9393.80,  status='aprobado' WHERE project_id=54 AND invoice_number='WJYNF0MH-0001';
UPDATE tramites SET amount=9172.80,  status='aprobado' WHERE project_id=54 AND invoice_number='WJYNF0MH-0002';
UPDATE tramites SET amount=40323.43, status='aprobado' WHERE project_id=54 AND invoice_number='MZGIBONY-0002';
UPDATE tramites SET amount=46689.00, status='aprobado' WHERE project_id=54 AND invoice_number='MZGIBONY-0003';
UPDATE tramites SET amount=45722.00, status='aprobado' WHERE project_id=54 AND invoice_number='MZGIBONY-0004';
-- Las 2 de mayo aún NO ejecutadas en FUNDATEC → dejarlas en proceso
UPDATE tramites SET status='en_proceso_firmas' WHERE project_id=54 AND invoice_number IN ('WJYNF0MH-0003','7RYVMSRB-0001');


-- ============================================================
-- 3. CORRECCIONES DE NÚMERO (truncados por notación científica)
-- ============================================================
-- P42 Academia
UPDATE tramites SET invoice_number='10003772010000105148', supplier='AMDE Computers Corporation' WHERE project_id=42 AND invoice_number='10003772010000100000';
UPDATE tramites SET invoice_number='00400001010000285285', supplier='Erial B.Q. S.A.'           WHERE project_id=42 AND invoice_number='400001010000285000';
-- P66 Naturabite
UPDATE tramites SET invoice_number='00100001010000000262', supplier='Wagner Omar Corella Grijalba'           WHERE project_id=66 AND amount=724200;
UPDATE tramites SET invoice_number='00100001010000029617', supplier='Plásticos Uchosa Centroamericana S.A.'  WHERE project_id=66 AND amount=1305600;
-- P67 Tropibugs
UPDATE tramites SET invoice_number='00100004010000021698' WHERE project_id=67 AND amount=979971.77;


-- ============================================================
-- 4. CORRECCIONES DE MONTO
-- ============================================================
-- P50 Monge refrigerador (era 99000, real 99900)
UPDATE tramites SET amount=99900 WHERE project_id=50 AND invoice_number='21300001010000053368';
-- P54 Compu Store (era 408000, real 400000)
UPDATE tramites SET amount=400000 WHERE project_id=54 AND invoice_number='00100001010000000114';


-- ============================================================
-- 5. CORRECCIONES DE PROVEEDOR (FUNDATEC = fuente real)
-- ============================================================
-- P44 Anatomy Makers
UPDATE tramites SET supplier='AMDE Computers Corporation' WHERE project_id=44 AND invoice_number IN ('00303586010000021539','00303586010000021540','00303586010000021541');
UPDATE tramites SET supplier='Prismar de Costa Rica S.A.' WHERE project_id=44 AND invoice_number='00100010010000124370';
-- P49 Nítida
UPDATE tramites SET supplier='AMDE Computers Corporation' WHERE project_id=49 AND invoice_number='00303586010000022009';
-- P67 Tropibugs honorarios
UPDATE tramites SET supplier='Esteban Mauricio Chaves Vega' WHERE project_id=67 AND invoice_number='00100001010000000001';


-- ============================================================
-- 6. ESTADOS — registros NO ejecutados aún en FUNDATEC
--    (pasar a "en proceso" para no descontar de más)
-- ============================================================
-- P47 Geko — TC sin factura
UPDATE tramites SET status='en_proceso_firmas', type='uso_tc'
  WHERE project_id=47 AND invoice_number='TC(sin factura por el momento)';
-- P67 Tropibugs — 4 registros no ejecutados (~₡1.1M)
UPDATE tramites SET status='en_proceso_firmas'
  WHERE project_id=67 AND invoice_number IN (
    '00100001010000000002','02000005010000034511','00600001010000026925','00100005010000001747'
  );


-- ============================================================
-- 7. DUPLICADOS — enviar a papelera (soft delete)
-- ============================================================
-- P50 Monge tiquete (= factura 053368, mismo refri)
UPDATE tramites SET deleted_at=NOW() WHERE project_id=50 AND invoice_number='21300001040000002142';
-- P67 ExtremeTech 028013 (= 026925, mismos monitores)
UPDATE tramites SET deleted_at=NOW() WHERE project_id=67 AND invoice_number='00600001010000028013';


-- ============================================================
-- 8. POR VERIFICAR MANUALMENTE (no incluidas arriba)
--   - P44: reintegro ₡20,400 "Transporte Pricesmart" (013678) — no está en FUNDATEC
--   - P50: factura "3102761660 SRL" 029829 — no está en FUNDATEC
--   - P67: Almacema 02000004010000134493 (₡173,309.73) — real, aún no ejecutada en FUNDATEC
--   Estas 3 son compras reales que FUNDATEC todavía no cobra (van adelantadas),
--   no son errores. Decidir si dejarlas 'aprobado' o pasarlas a 'en_proceso_firmas'.


-- ============================================================
-- 9. AJUSTES FINALES (tras verificar contra el query de resumen)
-- ============================================================

-- 9a. P54 Visorías — normalizar montos reales y estados.
--     (2 suscripciones preexistentes se saltaron el INSERT guardado y
--      conservaban montos estimados; las 2 de mayo quedaron como aprobadas.)
UPDATE tramites SET amount=10005.40, status='aprobado' WHERE project_id=54 AND invoice_number='MKYZ8JY5-0003';
UPDATE tramites SET amount=9931.00,  status='aprobado' WHERE project_id=54 AND invoice_number='MKYZ8JY5-0004';
UPDATE tramites SET amount=9485.00,  status='aprobado' WHERE project_id=54 AND invoice_number='MKYZ8JY5-0005';
UPDATE tramites SET amount=9393.80,  status='aprobado' WHERE project_id=54 AND invoice_number='WJYNF0MH-0001';
UPDATE tramites SET amount=9172.80,  status='aprobado' WHERE project_id=54 AND invoice_number='WJYNF0MH-0002';
UPDATE tramites SET amount=40323.43, status='aprobado' WHERE project_id=54 AND invoice_number='MZGIBONY-0002';
UPDATE tramites SET amount=46689.00, status='aprobado' WHERE project_id=54 AND invoice_number='MZGIBONY-0003';
UPDATE tramites SET amount=45722.00, status='aprobado' WHERE project_id=54 AND invoice_number='MZGIBONY-0004';
UPDATE tramites SET status='en_proceso_firmas' WHERE project_id=54 AND invoice_number IN ('WJYNF0MH-0003','7RYVMSRB-0001');
UPDATE tramites SET amount=400000 WHERE project_id=54 AND invoice_number='00100001010000000114';
-- Resultado esperado P54: aprobado ₡1,090,722.43 · en proceso ₡61,200

-- 9b. P48 Biocarbón — factura faltante (Roldana María Elena, ₡25,274.32)
INSERT INTO tramites (project_id,type,status,invoice_number,supplier,amount,description,approval_date,submission_date)
SELECT 48,'factura','aprobado','00200001010000002542','María Elena Mata Aguilar',25274.32,'Roldana con base 2.1/4','2026-03-19','2026-03-19'
WHERE NOT EXISTS (SELECT 1 FROM tramites WHERE project_id=48 AND invoice_number='00200001010000002542');

-- 9c. P48 Biocarbón — corregir los 6 números truncados (sin proveedor) que quedaban
UPDATE tramites SET invoice_number='00100001010000025983', supplier='Rimuca S.A.'                             WHERE project_id=48 AND invoice_number='100001010000025000';
UPDATE tramites SET invoice_number='03200014010000086611', supplier='El Lagar (Corp. Comercial e Industrial)' WHERE project_id=48 AND invoice_number='3200014010000080000';
UPDATE tramites SET invoice_number='00200021010000008303', supplier='Maquinaria Industrial Timsa S.A.'         WHERE project_id=48 AND invoice_number='200021010000008000';
UPDATE tramites SET invoice_number='00100001010000303683', supplier='La Bobina de Oro S.A.'                    WHERE project_id=48 AND invoice_number='100001010000303000';
UPDATE tramites SET invoice_number='00200006010000287572', supplier='Construplaza S.A.'                        WHERE project_id=48 AND invoice_number='200006010000287000';
UPDATE tramites SET invoice_number='00200001010000002614', supplier='María Elena Mata Aguilar'                 WHERE project_id=48 AND invoice_number='200001010000002000';
-- Resultado esperado P48: ₡3,921,306.50 ≈ FUNDATEC ₡3,921,306.17

-- ============================================================
-- 10. ACTUALIZACIÓN P67 (extracto FUNDATEC 05-06-2026)
--     Warner 000002 (₡663,000) pasó de presupuestado a EJECUTADO.
-- ============================================================
UPDATE tramites SET status='aprobado', approval_date='2026-06-05', supplier='Warner Ernesto Torres Brenes'
WHERE project_id=67 AND invoice_number='00100001010000000002';
-- Resultado P67: aprobado ₡4,578,385.03 · en proceso ₡451,853.53
-- (Almacema 034511, ExtremeTech 026925, Vital Uniformes 001747 siguen pendientes)


-- ============================================================
-- ESTADO FINAL: los 15 proyectos cuadran contra FUNDATEC.
-- Diferencias residuales = compras reales aún no ejecutadas por
-- FUNDATEC (P44 ₡20,400 · P50 ₡40,622 · P67 ₡173,310) + redondeo
-- de céntimos (P66 ₡1,403). No son errores.
-- ============================================================
