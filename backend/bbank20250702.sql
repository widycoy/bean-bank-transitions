-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: bbank_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `city`
--

DROP TABLE IF EXISTS `city`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `city` (
  `city_code` char(5) NOT NULL,
  `city_name` varchar(100) NOT NULL,
  `parent_code` char(5) DEFAULT NULL,
  `province_code` char(5) NOT NULL,
  PRIMARY KEY (`city_code`),
  KEY `province_code` (`province_code`),
  CONSTRAINT `city_ibfk_1` FOREIGN KEY (`province_code`) REFERENCES `province` (`province_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `office_code` char(4) NOT NULL,
  `cif_number` char(9) NOT NULL,
  `ktp` char(16) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `city_code` char(5) NOT NULL,
  `province_code` char(5) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `mother_name` varchar(100) NOT NULL,
  `marital_status_id` int NOT NULL,
  `gender_id` int NOT NULL,
  `date_of_birth` date NOT NULL,
  `place_of_birth` varchar(100) NOT NULL,
  `occupation` varchar(100) NOT NULL,
  `income_range_id` int NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `residential_status_id` int NOT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `officer_code` varchar(10) NOT NULL,
  `state` enum('PENDING','ACTIVE','CLOSED') DEFAULT 'PENDING',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cif_number` (`cif_number`),
  KEY `office_code` (`office_code`),
  KEY `city_code` (`city_code`),
  KEY `province_code` (`province_code`),
  KEY `officer_code` (`officer_code`),
  CONSTRAINT `customer_ibfk_1` FOREIGN KEY (`office_code`) REFERENCES `office` (`office_code`),
  CONSTRAINT `customer_ibfk_2` FOREIGN KEY (`city_code`) REFERENCES `city` (`city_code`),
  CONSTRAINT `customer_ibfk_3` FOREIGN KEY (`province_code`) REFERENCES `province` (`province_code`),
  CONSTRAINT `customer_ibfk_4` FOREIGN KEY (`officer_code`) REFERENCES `officer` (`officer_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_state_history`
--

DROP TABLE IF EXISTS `customer_state_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_state_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `state` enum('PENDING','ACTIVE','CLOSED') NOT NULL,
  `changed_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `officer_code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `officer_code` (`officer_code`),
  CONSTRAINT `customer_state_history_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  CONSTRAINT `customer_state_history_ibfk_2` FOREIGN KEY (`officer_code`) REFERENCES `officer` (`officer_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_data`
--

DROP TABLE IF EXISTS `master_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type_id` int NOT NULL,
  `entity_type_name` varchar(50) NOT NULL,
  `label` varchar(50) NOT NULL,
  `description` varchar(100) NOT NULL,
  `status` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `office`
--

DROP TABLE IF EXISTS `office`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `office` (
  `id` int NOT NULL AUTO_INCREMENT,
  `office_code` char(4) NOT NULL,
  `name` varchar(100) NOT NULL,
  `office_level` enum('HEAD','BRANCH') NOT NULL,
  `address` text NOT NULL,
  `city_code` char(5) NOT NULL,
  `province_code` char(5) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `office_code` (`office_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `officer`
--

DROP TABLE IF EXISTS `officer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `officer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `officer_code` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `gender_id` int NOT NULL,
  `date_of_birth` date NOT NULL,
  `office_code` char(4) NOT NULL,
  `active_status` tinyint(1) DEFAULT '1',
  `join_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `officer_code` (`officer_code`),
  KEY `office_code` (`office_code`),
  CONSTRAINT `officer_ibfk_1` FOREIGN KEY (`office_code`) REFERENCES `office` (`office_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `province`
--

DROP TABLE IF EXISTS `province`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `province` (
  `province_code` char(5) NOT NULL,
  `province_name` varchar(100) NOT NULL,
  PRIMARY KEY (`province_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-02 16:18:54
