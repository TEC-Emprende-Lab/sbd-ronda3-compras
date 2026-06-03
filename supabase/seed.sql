-- Proyectos SBD Ronda 3 - datos reales del Excel
INSERT INTO projects (id, name, category, budget) VALUES
  (42, 'Academia de Ciberseguridad Zenthik',                          'prototipado',     5170000.00),
  (45, 'AVCP – Autonomous Vegetation Control Platform',               'prototipado',     5500000.00),
  (46, 'Dicter',                                                      'prototipado',     5500000.00),
  (47, 'Geko',                                                        'prototipado',     5500000.00),
  (48, 'Tecnificación de la Producción de Biocarbón',                 'prototipado',     5500000.00),
  (50, 'Mycocraft',                                                   'prototipado',     5500000.00),
  (52, 'Extracción de metabolitos de orégano para dermatitis seborreica', 'prototipado', 5500000.00),
  (53, 'Click2',                                                      'prototipado',     5500000.00),
  (54, 'Visorías',                                                    'prototipado',     5500000.00),
  (67, 'Tropibugs',                                                   'prototipado',     5323934.00),
  (68, 'AdmiTips CR',                                                 'prototipado',     5500000.00),
  (69, 'Nutrigestiva',                                                'prototipado',     5500000.00),
  (44, 'Anatomy Makers',                                              'puesta_en_marcha', 11000000.00),
  (49, 'Nítida Cleaning',                                             'puesta_en_marcha', 11000000.00),
  (66, 'Naturabite',                                                  'puesta_en_marcha', 11000000.00)
ON CONFLICT (id) DO NOTHING;
