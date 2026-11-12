SET NAMES utf8mb4;
INSERT INTO incident (titre, type, description, lieu, latitude, longitude, citoyen_id)
SELECT 'Signalement en direct', 'AUTRE', 'DONNEES_DE_TEST', 'Sfax centre', 34.741000, 10.762000, id
FROM utilisateur WHERE role = 'CITOYEN' ORDER BY id LIMIT 1;