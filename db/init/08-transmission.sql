-- Transmission d'un incident à un service d'urgence (ambulance, police, ...)
CREATE TABLE IF NOT EXISTS transmission_incident (
  id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  incident_id int unsigned NOT NULL,
  service enum('AMBULANCE','POLICE','POMPIERS','SONEDE','STEG','MUNICIPALITE') NOT NULL,
  message varchar(500) NULL,
  statut enum('ENVOYEE','EN_INTERVENTION','TERMINEE') NOT NULL DEFAULT 'ENVOYEE',
  auteur_id int unsigned NOT NULL,
  date_creation datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_maj datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_transmission (incident_id, service),
  CONSTRAINT fk_transmission_incident FOREIGN KEY (incident_id) REFERENCES incident (id) ON DELETE CASCADE,
  CONSTRAINT fk_transmission_auteur FOREIGN KEY (auteur_id) REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
