SET NAMES utf8mb4;

SET @citoyen = (SELECT id FROM utilisateur WHERE role = 'CITOYEN' ORDER BY id LIMIT 1);
SET @agent   = (SELECT id FROM utilisateur WHERE role = 'AGENT' ORDER BY id LIMIT 1);

DELETE FROM incident WHERE description = 'DONNEES_DE_TEST';

INSERT INTO incident
  (titre, type, description, lieu, latitude, longitude, statut, gravite, priorite, confiance_ia, nombre_temoins, citoyen_id, agent_id, date_creation, date_resolution)
VALUES
('Accident routier',     'ACCIDENT',       'DONNEES_DE_TEST', 'Sfax centre',            34.739800, 10.760000, 'NOUVEAU',    NULL,       'URGENTE', NULL,  3, @citoyen, NULL,   NOW() - INTERVAL 3 MINUTE, NULL),
('Inondation',           'INONDATION',     'DONNEES_DE_TEST', 'Route de Tunis',         34.770000, 10.755000, 'EN_COURS',   'CRITIQUE', 'URGENTE', 94.00, 5, @citoyen, @agent, NOW() - INTERVAL 18 MINUTE, NULL),
('Incendie de conteneur','INCENDIE',       'DONNEES_DE_TEST', 'Route de l''Aéroport',   34.718000, 10.690000, 'NOUVEAU',    'ELEVEE',   'URGENTE', 88.50, 2, @citoyen, NULL,   NOW() - INTERVAL 25 MINUTE, NULL),
('Fuite d''eau',         'FUITE_EAU',      'DONNEES_DE_TEST', 'Sakiet Ezzit',           34.803000, 10.740000, 'A_VERIFIER', 'MOYENNE',  'NORMALE', 62.00, 1, @citoyen, NULL,   NOW() - INTERVAL 40 MINUTE, NULL),
('Inondation',           'INONDATION',     'DONNEES_DE_TEST', 'Sakiet Eddaier',         34.790000, 10.755000, 'A_VERIFIER', 'ELEVEE',   'URGENTE', 71.00, 2, @citoyen, NULL,   NOW() - INTERVAL 55 MINUTE, NULL),
('Arbre tombé',          'ARBRE_TOMBE',    'DONNEES_DE_TEST', 'Avenue Habib Bourguiba', 34.737000, 10.759000, 'VALIDE',     'MOYENNE',  'NORMALE', 90.00, 1, @citoyen, NULL,   NOW() - INTERVAL 2 HOUR, NULL),
('Nid-de-poule',         'NID_DE_POULE',   'DONNEES_DE_TEST', 'Route de Gremda',        34.760000, 10.710000, 'EN_COURS',   'FAIBLE',   'NORMALE', 85.00, 1, @citoyen, @agent, TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '16:45:00'), NULL),
('Fuite d''eau',         'FUITE_EAU',      'DONNEES_DE_TEST', 'Sfax El Jadida',         34.725000, 10.750000, 'RESOLU',     'FAIBLE',   'NORMALE', 80.00, 1, @citoyen, @agent, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 HOUR),
('Lampadaire cassé',     'INFRASTRUCTURE', 'DONNEES_DE_TEST', 'Cité El Habib',          34.749000, 10.722000, 'RESOLU',     'FAIBLE',   'NORMALE', 77.00, 1, @citoyen, @agent, TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '22:08:00'), NOW() - INTERVAL 1 HOUR),
('Nid-de-poule',         'NID_DE_POULE',   'DONNEES_DE_TEST', 'Route de Mahdia',        34.700000, 10.770000, 'REJETE',     NULL,       'NORMALE', 40.00, 1, @citoyen, NULL,   NOW() - INTERVAL 4 DAY, NULL);

SELECT id, titre, statut, gravite, priorite, date_creation FROM incident ORDER BY id;