-- Photos envoyées par les citoyens (le fichier est sur le disque du serveur, la base garde la référence)
CREATE TABLE photo (
  id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id int unsigned NOT NULL,
  nom_fichier varchar(64) NOT NULL,
  type_mime varchar(50) NOT NULL,
  taille int unsigned NOT NULL,
  date_creation datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_photo_fichier (nom_fichier),
  KEY idx_photo_user_date (utilisateur_id, date_creation),
  CONSTRAINT fk_photo_user FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
