-- Lie une photo au signalement (incident) qu'elle illustre
ALTER TABLE photo
  ADD COLUMN incident_id int unsigned NULL AFTER utilisateur_id,
  ADD KEY idx_photo_incident (incident_id),
  ADD CONSTRAINT fk_photo_incident FOREIGN KEY (incident_id)
    REFERENCES incident (id) ON DELETE CASCADE;
