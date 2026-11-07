-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 30, 2026 at 09:46 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `safecity`
--

-- --------------------------------------------------------

--
-- Table structure for table `journal_action`
--

CREATE TABLE `journal_action` (
  `id` int unsigned  NOT NULL,
  `auteur_id` int unsigned  NOT NULL,
  `action` varchar(50) NOT NULL,
  `type_entite` varchar(50) NOT NULL,
  `id_entite` int unsigned  DEFAULT NULL,
  `ancienne_valeur` varchar(255) DEFAULT NULL,
  `nouvelle_valeur` varchar(255) DEFAULT NULL,
  `date_action` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `utilisateur`
--

CREATE TABLE `utilisateur` (
  `id` int unsigned  NOT NULL,
  `nom` varchar(80) NOT NULL,
  `prenom` varchar(80) NOT NULL,
  `email` varchar(150) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('CITOYEN','AGENT','ADMINISTRATEUR') NOT NULL DEFAULT 'CITOYEN',
  `date_dernier_signalement` datetime DEFAULT NULL,
  `nombre_signalements_heure` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `nom`, `prenom`, `email`, `mot_de_passe`, `telephone`, `actif`, `date_creation`, `role`, `date_dernier_signalement`, `nombre_signalements_heure`) VALUES
(1, 'Admin', 'Safe', 'admin@safecity.tn', '$2a$10$RYm6lpZIyAjYFRhfWGqmhuAkHqasGtbk7Gj/y2z2kS0Sbef/dNkki', NULL, 1, '2026-10-30 22:41:08', 'ADMINISTRATEUR', NULL, 0),
(2, 'Agent', 'Test', 'agent@safecity.tn', '$2a$10$51kPQctlQQwfjXo4egF3J.UORuCL7fIjjQfc3pNzKcUonjqzXmGBa', NULL, 1, '2026-10-30 22:41:08', 'AGENT', NULL, 0),
(3, 'Citoyen', 'Test', 'citoyen@safecity.tn', '$2a$10$73aluP.XMisDJu7Bg/reL.ficoaGDvQjLI/LQdvAHFD3w3wRhPMCe', NULL, 1, '2026-10-30 22:41:08', 'CITOYEN', NULL, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `journal_action`
--
ALTER TABLE `journal_action`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_journal_auteur` (`auteur_id`),
  ADD KEY `idx_entite` (`type_entite`,`id_entite`),
  ADD KEY `idx_date` (`date_action`);

--
-- Indexes for table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `journal_action`
--
ALTER TABLE `journal_action`
  MODIFY `id` int unsigned  NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `utilisateur`
--
ALTER TABLE `utilisateur`
  MODIFY `id` int unsigned  NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `journal_action`
--
ALTER TABLE `journal_action`
  ADD CONSTRAINT `fk_journal_auteur` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
