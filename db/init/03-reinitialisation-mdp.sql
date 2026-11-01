-- Jetons de réinitialisation de mot de passe (on ne stocke que le hash SHA-256 du jeton)
CREATE TABLE reinitialisation_mdp (
  id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id int unsigned NOT NULL,
  token_hash char(64) NOT NULL,
  expire_le datetime NOT NULL,
  utilise tinyint(1) NOT NULL DEFAULT 0,
  date_creation datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token (token_hash),
  KEY idx_reinit_user (utilisateur_id),
  CONSTRAINT fk_reinit_user FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
