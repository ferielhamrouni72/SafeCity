-- Notes laissées par les agents à l'attention du citoyen
CREATE TABLE IF NOT EXISTS incident_commentaire (
  id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  incident_id int unsigned NOT NULL,
  auteur_id int unsigned NOT NULL,
  texte varchar(1000) NOT NULL,
  date_creation datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_commentaire_incident (incident_id, date_creation),
  CONSTRAINT fk_commentaire_incident FOREIGN KEY (incident_id) REFERENCES incident (id) ON DELETE CASCADE,
  CONSTRAINT fk_commentaire_auteur FOREIGN KEY (auteur_id) REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Phrase d'analyse produite par l'IA (facultative). A exécuter UNE SEULE FOIS (erreur si la colonne existe déjà).
ALTER TABLE incident ADD COLUMN analyse_ia text NULL AFTER confiance_ia;
