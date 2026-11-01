-- Journal non modifiable : interdit UPDATE et DELETE sur journal_action (SC24)
DELIMITER $$

CREATE TRIGGER journal_no_update
BEFORE UPDATE ON journal_action
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le journal est non modifiable';
END$$

CREATE TRIGGER journal_no_delete
BEFORE DELETE ON journal_action
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le journal est non supprimable';
END$$

DELIMITER ;