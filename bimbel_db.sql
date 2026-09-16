-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: bimbel_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.27-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `about_section`
--

DROP TABLE IF EXISTS `about_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `about_section` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `about_section`
--

LOCK TABLES `about_section` WRITE;
/*!40000 ALTER TABLE `about_section` DISABLE KEYS */;
INSERT INTO `about_section` VALUES (1,'About Us','Bimbelku merupakan lembaga bimbingan belajar yang berada di Tigabinanga. Bimbelku dapat membantu para siswa dalam pembelajaran disekolah. terutama buat siswa SMP dan SMA yang ingin masuk ke sekolah atau Perguruan Negeri TInggi favorit. Tenaga pengajar merupakan tentor yang sudah berpengalaman meluluskan banyak siswa masuk perguruan tinggi impiannya. Yukk segera daftar di bimbelku !!!','/uploads/1789533398030.jpeg');
/*!40000 ALTER TABLE `about_section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `absensi`
--

DROP TABLE IF EXISTS `absensi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `absensi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jadwal_id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('hadir','izin','sakit','alpha') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jadwal_id` (`jadwal_id`,`siswa_id`,`tanggal`),
  KEY `fk_siswa` (`siswa_id`),
  CONSTRAINT `fk_jadwal` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_siswa` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=183 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `absensi`
--

LOCK TABLES `absensi` WRITE;
/*!40000 ALTER TABLE `absensi` DISABLE KEYS */;
INSERT INTO `absensi` VALUES (181,59,113,'2026-09-15','sakit');
/*!40000 ALTER TABLE `absensi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `background`
--

DROP TABLE IF EXISTS `background`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `background` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gambar` varchar(255) NOT NULL,
  `urutan` int(11) DEFAULT 0,
  `status` enum('aktif','nonaktif') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `background`
--

LOCK TABLES `background` WRITE;
/*!40000 ALTER TABLE `background` DISABLE KEYS */;
/*!40000 ALTER TABLE `background` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detail_pembayaran`
--

DROP TABLE IF EXISTS `detail_pembayaran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detail_pembayaran` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pembayaran_id` int(11) NOT NULL,
  `nominal` bigint(20) NOT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `status` enum('pending','diterima','ditolak') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pembayaran_id` (`pembayaran_id`),
  CONSTRAINT `detail_pembayaran_ibfk_1` FOREIGN KEY (`pembayaran_id`) REFERENCES `pembayaran` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detail_pembayaran`
--

LOCK TABLES `detail_pembayaran` WRITE;
/*!40000 ALTER TABLE `detail_pembayaran` DISABLE KEYS */;
/*!40000 ALTER TABLE `detail_pembayaran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event`
--

DROP TABLE IF EXISTS `event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `judul` varchar(150) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `waktu` varchar(50) DEFAULT NULL,
  `lokasi` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event`
--

LOCK TABLES `event` WRITE;
/*!40000 ALTER TABLE `event` DISABLE KEYS */;
INSERT INTO `event` VALUES (58,'Try out April 2026','Semua datang yaa!!','2026-09-15','10.00 - 11.00 WIB','Gedung bimbelku','2026-09-15 08:42:04');
/*!40000 ALTER TABLE `event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faq`
--

DROP TABLE IF EXISTS `faq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faq` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faq`
--

LOCK TABLES `faq` WRITE;
/*!40000 ALTER TABLE `faq` DISABLE KEYS */;
INSERT INTO `faq` VALUES (1,'Bagaimana cara mendaftar di BIMBELKU?','Klik tombol Daftar Sekarang kemudian isi formulir pendaftaran.','2026-07-14 06:09:16'),(2,'Apakah tersedia kelas online?','Ya, tersedia kelas online maupun offline.','2026-07-14 06:09:16');
/*!40000 ALTER TABLE `faq` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file_nilai`
--

DROP TABLE IF EXISTS `file_nilai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_nilai` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) DEFAULT NULL,
  `nama_file` varchar(255) DEFAULT NULL,
  `path_file` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=260 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_nilai`
--

LOCK TABLES `file_nilai` WRITE;
/*!40000 ALTER TABLE `file_nilai` DISABLE KEYS */;
INSERT INTO `file_nilai` VALUES (3,2,'Penilaian1.xlsx','1775430883850-Penilaian1.xlsx','2026-04-05 23:14:43'),(4,2,'testpenilaian.xlsx','1784674261962-testpenilaian.xlsx','2026-07-21 22:51:02'),(5,2,'testpenilaian.xlsx','1787716691898-testpenilaian.xlsx','2026-08-26 03:58:11'),(6,1,'1787716691898-testpenilaian (2).xlsx','1788156457592-1787716691898-testpenilaian (2).xlsx','2026-08-31 06:07:37'),(7,6,'nilai-invalid-nama.xlsx','1788727432736-nilai-invalid-nama.xlsx','2026-09-06 20:43:52'),(8,6,'nilai-invalid-nilai.xlsx','1788727432795-nilai-invalid-nilai.xlsx','2026-09-06 20:43:52'),(9,6,'nilai-bukan-angka.xlsx','1788727432856-nilai-bukan-angka.xlsx','2026-09-06 20:43:52'),(10,6,'nilai-kurang-0.xlsx','1788727432925-nilai-kurang-0.xlsx','2026-09-06 20:43:52'),(11,6,'nilai-lebih-100.xlsx','1788727432988-nilai-lebih-100.xlsx','2026-09-06 20:43:53'),(12,6,'nilai-siswa-tidak-ditemukan.xlsx','1788727433040-nilai-siswa-tidak-ditemukan.xlsx','2026-09-06 20:43:53'),(13,6,'nilai-success.xlsx','1788727433108-nilai-success.xlsx','2026-09-06 20:43:53'),(14,6,'nilai-update.xlsx','1788727433172-nilai-update.xlsx','2026-09-06 20:43:53'),(15,6,'nilai-invalid-nama.xlsx','1788785511207-nilai-invalid-nama.xlsx','2026-09-07 12:51:51'),(16,6,'nilai-invalid-nilai.xlsx','1788785511235-nilai-invalid-nilai.xlsx','2026-09-07 12:51:51'),(17,6,'nilai-bukan-angka.xlsx','1788785511260-nilai-bukan-angka.xlsx','2026-09-07 12:51:51'),(18,6,'nilai-kurang-0.xlsx','1788785511285-nilai-kurang-0.xlsx','2026-09-07 12:51:51'),(19,6,'nilai-lebih-100.xlsx','1788785511309-nilai-lebih-100.xlsx','2026-09-07 12:51:51'),(20,6,'nilai-siswa-tidak-ditemukan.xlsx','1788785511334-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 12:51:51'),(21,6,'nilai-success.xlsx','1788785511359-nilai-success.xlsx','2026-09-07 12:51:51'),(22,6,'nilai-update.xlsx','1788785511396-nilai-update.xlsx','2026-09-07 12:51:51'),(23,6,'nilai-invalid-nama.xlsx','1788785627955-nilai-invalid-nama.xlsx','2026-09-07 12:53:47'),(24,6,'nilai-invalid-nilai.xlsx','1788785627981-nilai-invalid-nilai.xlsx','2026-09-07 12:53:47'),(25,6,'nilai-bukan-angka.xlsx','1788785628002-nilai-bukan-angka.xlsx','2026-09-07 12:53:48'),(26,6,'nilai-kurang-0.xlsx','1788785628024-nilai-kurang-0.xlsx','2026-09-07 12:53:48'),(27,6,'nilai-lebih-100.xlsx','1788785628048-nilai-lebih-100.xlsx','2026-09-07 12:53:48'),(28,6,'nilai-siswa-tidak-ditemukan.xlsx','1788785628071-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 12:53:48'),(29,6,'nilai-success.xlsx','1788785628095-nilai-success.xlsx','2026-09-07 12:53:48'),(30,6,'nilai-update.xlsx','1788785628121-nilai-update.xlsx','2026-09-07 12:53:48'),(31,6,'nilai-invalid-nama.xlsx','1788786077085-nilai-invalid-nama.xlsx','2026-09-07 13:01:17'),(32,6,'nilai-invalid-nilai.xlsx','1788786077114-nilai-invalid-nilai.xlsx','2026-09-07 13:01:17'),(33,6,'nilai-bukan-angka.xlsx','1788786077137-nilai-bukan-angka.xlsx','2026-09-07 13:01:17'),(34,6,'nilai-kurang-0.xlsx','1788786077162-nilai-kurang-0.xlsx','2026-09-07 13:01:17'),(35,6,'nilai-lebih-100.xlsx','1788786077187-nilai-lebih-100.xlsx','2026-09-07 13:01:17'),(36,6,'nilai-siswa-tidak-ditemukan.xlsx','1788786077209-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 13:01:17'),(37,6,'nilai-success.xlsx','1788786077235-nilai-success.xlsx','2026-09-07 13:01:17'),(38,6,'nilai-update.xlsx','1788786077264-nilai-update.xlsx','2026-09-07 13:01:17'),(39,6,'nilai-invalid-nama.xlsx','1788788468149-nilai-invalid-nama.xlsx','2026-09-07 13:41:08'),(40,6,'nilai-invalid-nilai.xlsx','1788788468176-nilai-invalid-nilai.xlsx','2026-09-07 13:41:08'),(41,6,'nilai-bukan-angka.xlsx','1788788468201-nilai-bukan-angka.xlsx','2026-09-07 13:41:08'),(42,6,'nilai-kurang-0.xlsx','1788788468226-nilai-kurang-0.xlsx','2026-09-07 13:41:08'),(43,6,'nilai-lebih-100.xlsx','1788788468250-nilai-lebih-100.xlsx','2026-09-07 13:41:08'),(44,6,'nilai-siswa-tidak-ditemukan.xlsx','1788788468273-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 13:41:08'),(45,6,'nilai-success.xlsx','1788788468305-nilai-success.xlsx','2026-09-07 13:41:08'),(46,6,'nilai-update.xlsx','1788788468336-nilai-update.xlsx','2026-09-07 13:41:08'),(47,6,'nilai-invalid-nama.xlsx','1788791784004-nilai-invalid-nama.xlsx','2026-09-07 14:36:24'),(48,6,'nilai-invalid-nilai.xlsx','1788791784032-nilai-invalid-nilai.xlsx','2026-09-07 14:36:24'),(49,6,'nilai-bukan-angka.xlsx','1788791784055-nilai-bukan-angka.xlsx','2026-09-07 14:36:24'),(50,6,'nilai-kurang-0.xlsx','1788791784089-nilai-kurang-0.xlsx','2026-09-07 14:36:24'),(51,6,'nilai-lebih-100.xlsx','1788791784116-nilai-lebih-100.xlsx','2026-09-07 14:36:24'),(52,6,'nilai-siswa-tidak-ditemukan.xlsx','1788791784138-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 14:36:24'),(53,6,'nilai-success.xlsx','1788791784178-nilai-success.xlsx','2026-09-07 14:36:24'),(54,6,'nilai-update.xlsx','1788791784228-nilai-update.xlsx','2026-09-07 14:36:24'),(55,6,'nilai-invalid-nama.xlsx','1788792116514-nilai-invalid-nama.xlsx','2026-09-07 14:41:56'),(56,6,'nilai-invalid-nilai.xlsx','1788792116540-nilai-invalid-nilai.xlsx','2026-09-07 14:41:56'),(57,6,'nilai-bukan-angka.xlsx','1788792116564-nilai-bukan-angka.xlsx','2026-09-07 14:41:56'),(58,6,'nilai-kurang-0.xlsx','1788792116588-nilai-kurang-0.xlsx','2026-09-07 14:41:56'),(59,6,'nilai-lebih-100.xlsx','1788792116613-nilai-lebih-100.xlsx','2026-09-07 14:41:56'),(60,6,'nilai-siswa-tidak-ditemukan.xlsx','1788792116634-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 14:41:56'),(61,6,'nilai-success.xlsx','1788792116658-nilai-success.xlsx','2026-09-07 14:41:56'),(62,6,'nilai-update.xlsx','1788792116685-nilai-update.xlsx','2026-09-07 14:41:56'),(63,6,'nilai-invalid-nama.xlsx','1788792628616-nilai-invalid-nama.xlsx','2026-09-07 14:50:28'),(64,6,'nilai-invalid-nilai.xlsx','1788792628643-nilai-invalid-nilai.xlsx','2026-09-07 14:50:28'),(65,6,'nilai-bukan-angka.xlsx','1788792628666-nilai-bukan-angka.xlsx','2026-09-07 14:50:28'),(66,6,'nilai-kurang-0.xlsx','1788792628692-nilai-kurang-0.xlsx','2026-09-07 14:50:28'),(67,6,'nilai-lebih-100.xlsx','1788792628715-nilai-lebih-100.xlsx','2026-09-07 14:50:28'),(68,6,'nilai-siswa-tidak-ditemukan.xlsx','1788792628739-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 14:50:28'),(69,6,'nilai-success.xlsx','1788792628766-nilai-success.xlsx','2026-09-07 14:50:28'),(70,6,'nilai-update.xlsx','1788792628800-nilai-update.xlsx','2026-09-07 14:50:28'),(71,6,'nilai-invalid-nama.xlsx','1788793273275-nilai-invalid-nama.xlsx','2026-09-07 15:01:13'),(72,6,'nilai-invalid-nilai.xlsx','1788793273300-nilai-invalid-nilai.xlsx','2026-09-07 15:01:13'),(73,6,'nilai-bukan-angka.xlsx','1788793273323-nilai-bukan-angka.xlsx','2026-09-07 15:01:13'),(74,6,'nilai-kurang-0.xlsx','1788793273345-nilai-kurang-0.xlsx','2026-09-07 15:01:13'),(75,6,'nilai-lebih-100.xlsx','1788793273367-nilai-lebih-100.xlsx','2026-09-07 15:01:13'),(76,6,'nilai-siswa-tidak-ditemukan.xlsx','1788793273391-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 15:01:13'),(77,6,'nilai-success.xlsx','1788793273415-nilai-success.xlsx','2026-09-07 15:01:13'),(78,6,'nilai-update.xlsx','1788793273440-nilai-update.xlsx','2026-09-07 15:01:13'),(79,6,'nilai-invalid-nama.xlsx','1788793439414-nilai-invalid-nama.xlsx','2026-09-07 15:03:59'),(80,6,'nilai-invalid-nilai.xlsx','1788793439441-nilai-invalid-nilai.xlsx','2026-09-07 15:03:59'),(81,6,'nilai-bukan-angka.xlsx','1788793439463-nilai-bukan-angka.xlsx','2026-09-07 15:03:59'),(82,6,'nilai-kurang-0.xlsx','1788793439485-nilai-kurang-0.xlsx','2026-09-07 15:03:59'),(83,6,'nilai-lebih-100.xlsx','1788793439510-nilai-lebih-100.xlsx','2026-09-07 15:03:59'),(84,6,'nilai-siswa-tidak-ditemukan.xlsx','1788793439531-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 15:03:59'),(85,6,'nilai-success.xlsx','1788793439555-nilai-success.xlsx','2026-09-07 15:03:59'),(86,6,'nilai-update.xlsx','1788793439579-nilai-update.xlsx','2026-09-07 15:03:59'),(87,6,'nilai-invalid-nama.xlsx','1788794686401-nilai-invalid-nama.xlsx','2026-09-07 15:24:46'),(88,6,'nilai-invalid-nilai.xlsx','1788794686435-nilai-invalid-nilai.xlsx','2026-09-07 15:24:46'),(89,6,'nilai-bukan-angka.xlsx','1788794686461-nilai-bukan-angka.xlsx','2026-09-07 15:24:46'),(90,6,'nilai-kurang-0.xlsx','1788794686484-nilai-kurang-0.xlsx','2026-09-07 15:24:46'),(91,6,'nilai-lebih-100.xlsx','1788794686509-nilai-lebih-100.xlsx','2026-09-07 15:24:46'),(92,6,'nilai-siswa-tidak-ditemukan.xlsx','1788794686531-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 15:24:46'),(93,6,'nilai-success.xlsx','1788794686556-nilai-success.xlsx','2026-09-07 15:24:46'),(94,6,'nilai-update.xlsx','1788794686581-nilai-update.xlsx','2026-09-07 15:24:46'),(95,6,'nilai-invalid-nama.xlsx','1788795708130-nilai-invalid-nama.xlsx','2026-09-07 15:41:48'),(96,6,'nilai-invalid-nilai.xlsx','1788795708165-nilai-invalid-nilai.xlsx','2026-09-07 15:41:48'),(97,6,'nilai-bukan-angka.xlsx','1788795708207-nilai-bukan-angka.xlsx','2026-09-07 15:41:48'),(98,6,'nilai-kurang-0.xlsx','1788795708245-nilai-kurang-0.xlsx','2026-09-07 15:41:48'),(99,6,'nilai-lebih-100.xlsx','1788795708279-nilai-lebih-100.xlsx','2026-09-07 15:41:48'),(100,6,'nilai-siswa-tidak-ditemukan.xlsx','1788795708316-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 15:41:48'),(101,6,'nilai-success.xlsx','1788795708348-nilai-success.xlsx','2026-09-07 15:41:48'),(102,6,'nilai-update.xlsx','1788795708383-nilai-update.xlsx','2026-09-07 15:41:48'),(103,6,'nilai-invalid-nama.xlsx','1788795985810-nilai-invalid-nama.xlsx','2026-09-07 15:46:25'),(104,6,'nilai-invalid-nilai.xlsx','1788795985839-nilai-invalid-nilai.xlsx','2026-09-07 15:46:25'),(105,6,'nilai-bukan-angka.xlsx','1788795985863-nilai-bukan-angka.xlsx','2026-09-07 15:46:25'),(106,6,'nilai-kurang-0.xlsx','1788795985887-nilai-kurang-0.xlsx','2026-09-07 15:46:25'),(107,6,'nilai-lebih-100.xlsx','1788795985912-nilai-lebih-100.xlsx','2026-09-07 15:46:25'),(108,6,'nilai-siswa-tidak-ditemukan.xlsx','1788795985934-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 15:46:25'),(109,6,'nilai-success.xlsx','1788795985958-nilai-success.xlsx','2026-09-07 15:46:25'),(110,6,'nilai-update.xlsx','1788795985983-nilai-update.xlsx','2026-09-07 15:46:25'),(111,6,'nilai-invalid-nama.xlsx','1788796337216-nilai-invalid-nama.xlsx','2026-09-07 15:52:17'),(112,6,'nilai-invalid-nilai.xlsx','1788796337241-nilai-invalid-nilai.xlsx','2026-09-07 15:52:17'),(113,6,'nilai-bukan-angka.xlsx','1788796337263-nilai-bukan-angka.xlsx','2026-09-07 15:52:17'),(114,6,'nilai-kurang-0.xlsx','1788796337287-nilai-kurang-0.xlsx','2026-09-07 15:52:17'),(115,6,'nilai-lebih-100.xlsx','1788796337311-nilai-lebih-100.xlsx','2026-09-07 15:52:17'),(116,6,'nilai-siswa-tidak-ditemukan.xlsx','1788796337334-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 15:52:17'),(117,6,'nilai-success.xlsx','1788796337358-nilai-success.xlsx','2026-09-07 15:52:17'),(118,6,'nilai-update.xlsx','1788796337383-nilai-update.xlsx','2026-09-07 15:52:17'),(119,6,'nilai-invalid-nama.xlsx','1788797122596-nilai-invalid-nama.xlsx','2026-09-07 16:05:22'),(120,6,'nilai-invalid-nilai.xlsx','1788797122622-nilai-invalid-nilai.xlsx','2026-09-07 16:05:22'),(121,6,'nilai-bukan-angka.xlsx','1788797122645-nilai-bukan-angka.xlsx','2026-09-07 16:05:22'),(122,6,'nilai-kurang-0.xlsx','1788797122668-nilai-kurang-0.xlsx','2026-09-07 16:05:22'),(123,6,'nilai-lebih-100.xlsx','1788797122692-nilai-lebih-100.xlsx','2026-09-07 16:05:22'),(124,6,'nilai-siswa-tidak-ditemukan.xlsx','1788797122715-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 16:05:22'),(125,6,'nilai-success.xlsx','1788797122739-nilai-success.xlsx','2026-09-07 16:05:22'),(126,6,'nilai-update.xlsx','1788797122765-nilai-update.xlsx','2026-09-07 16:05:22'),(127,6,'nilai-invalid-nama.xlsx','1788797413746-nilai-invalid-nama.xlsx','2026-09-07 16:10:13'),(128,6,'nilai-invalid-nilai.xlsx','1788797413778-nilai-invalid-nilai.xlsx','2026-09-07 16:10:13'),(129,6,'nilai-bukan-angka.xlsx','1788797413808-nilai-bukan-angka.xlsx','2026-09-07 16:10:13'),(130,6,'nilai-kurang-0.xlsx','1788797413840-nilai-kurang-0.xlsx','2026-09-07 16:10:13'),(131,6,'nilai-lebih-100.xlsx','1788797413875-nilai-lebih-100.xlsx','2026-09-07 16:10:13'),(132,6,'nilai-siswa-tidak-ditemukan.xlsx','1788797413906-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 16:10:13'),(133,6,'nilai-success.xlsx','1788797413947-nilai-success.xlsx','2026-09-07 16:10:13'),(134,6,'nilai-update.xlsx','1788797413979-nilai-update.xlsx','2026-09-07 16:10:13'),(135,6,'nilai-invalid-nama.xlsx','1788799634544-nilai-invalid-nama.xlsx','2026-09-07 16:47:14'),(136,6,'nilai-invalid-nilai.xlsx','1788799634577-nilai-invalid-nilai.xlsx','2026-09-07 16:47:14'),(137,6,'nilai-bukan-angka.xlsx','1788799634601-nilai-bukan-angka.xlsx','2026-09-07 16:47:14'),(138,6,'nilai-kurang-0.xlsx','1788799634626-nilai-kurang-0.xlsx','2026-09-07 16:47:14'),(139,6,'nilai-lebih-100.xlsx','1788799634652-nilai-lebih-100.xlsx','2026-09-07 16:47:14'),(140,6,'nilai-siswa-tidak-ditemukan.xlsx','1788799634678-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 16:47:14'),(141,6,'nilai-success.xlsx','1788799634705-nilai-success.xlsx','2026-09-07 16:47:14'),(142,6,'nilai-update.xlsx','1788799634734-nilai-update.xlsx','2026-09-07 16:47:14'),(143,6,'nilai-invalid-nama.xlsx','1788799842210-nilai-invalid-nama.xlsx','2026-09-07 16:50:42'),(144,6,'nilai-invalid-nilai.xlsx','1788799842239-nilai-invalid-nilai.xlsx','2026-09-07 16:50:42'),(145,6,'nilai-bukan-angka.xlsx','1788799842260-nilai-bukan-angka.xlsx','2026-09-07 16:50:42'),(146,6,'nilai-kurang-0.xlsx','1788799842282-nilai-kurang-0.xlsx','2026-09-07 16:50:42'),(147,6,'nilai-lebih-100.xlsx','1788799842313-nilai-lebih-100.xlsx','2026-09-07 16:50:42'),(148,6,'nilai-siswa-tidak-ditemukan.xlsx','1788799842346-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 16:50:42'),(149,6,'nilai-success.xlsx','1788799842377-nilai-success.xlsx','2026-09-07 16:50:42'),(150,6,'nilai-update.xlsx','1788799842401-nilai-update.xlsx','2026-09-07 16:50:42'),(151,6,'nilai-invalid-nama.xlsx','1788799993753-nilai-invalid-nama.xlsx','2026-09-07 16:53:13'),(152,6,'nilai-invalid-nilai.xlsx','1788799993779-nilai-invalid-nilai.xlsx','2026-09-07 16:53:13'),(153,6,'nilai-bukan-angka.xlsx','1788799993803-nilai-bukan-angka.xlsx','2026-09-07 16:53:13'),(154,6,'nilai-kurang-0.xlsx','1788799993826-nilai-kurang-0.xlsx','2026-09-07 16:53:13'),(155,6,'nilai-lebih-100.xlsx','1788799993849-nilai-lebih-100.xlsx','2026-09-07 16:53:13'),(156,6,'nilai-siswa-tidak-ditemukan.xlsx','1788799993870-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 16:53:13'),(157,6,'nilai-success.xlsx','1788799993895-nilai-success.xlsx','2026-09-07 16:53:13'),(158,6,'nilai-update.xlsx','1788799993921-nilai-update.xlsx','2026-09-07 16:53:13'),(159,6,'nilai-invalid-nama.xlsx','1788800103826-nilai-invalid-nama.xlsx','2026-09-07 16:55:03'),(160,6,'nilai-invalid-nilai.xlsx','1788800103854-nilai-invalid-nilai.xlsx','2026-09-07 16:55:03'),(161,6,'nilai-bukan-angka.xlsx','1788800103876-nilai-bukan-angka.xlsx','2026-09-07 16:55:03'),(162,6,'nilai-kurang-0.xlsx','1788800103899-nilai-kurang-0.xlsx','2026-09-07 16:55:03'),(163,6,'nilai-lebih-100.xlsx','1788800103922-nilai-lebih-100.xlsx','2026-09-07 16:55:03'),(164,6,'nilai-siswa-tidak-ditemukan.xlsx','1788800103944-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 16:55:03'),(165,6,'nilai-success.xlsx','1788800103968-nilai-success.xlsx','2026-09-07 16:55:03'),(166,6,'nilai-update.xlsx','1788800103996-nilai-update.xlsx','2026-09-07 16:55:04'),(167,6,'nilai-invalid-nama.xlsx','1788800325237-nilai-invalid-nama.xlsx','2026-09-07 16:58:45'),(168,6,'nilai-invalid-nilai.xlsx','1788800325265-nilai-invalid-nilai.xlsx','2026-09-07 16:58:45'),(169,6,'nilai-bukan-angka.xlsx','1788800325286-nilai-bukan-angka.xlsx','2026-09-07 16:58:45'),(170,6,'nilai-kurang-0.xlsx','1788800325311-nilai-kurang-0.xlsx','2026-09-07 16:58:45'),(171,6,'nilai-lebih-100.xlsx','1788800325336-nilai-lebih-100.xlsx','2026-09-07 16:58:45'),(172,6,'nilai-siswa-tidak-ditemukan.xlsx','1788800325360-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 16:58:45'),(173,6,'nilai-success.xlsx','1788800325383-nilai-success.xlsx','2026-09-07 16:58:45'),(174,6,'nilai-update.xlsx','1788800325410-nilai-update.xlsx','2026-09-07 16:58:45'),(175,6,'nilai-invalid-nama.xlsx','1788800551594-nilai-invalid-nama.xlsx','2026-09-07 17:02:31'),(176,6,'nilai-invalid-nilai.xlsx','1788800551622-nilai-invalid-nilai.xlsx','2026-09-07 17:02:31'),(177,6,'nilai-bukan-angka.xlsx','1788800551645-nilai-bukan-angka.xlsx','2026-09-07 17:02:31'),(178,6,'nilai-kurang-0.xlsx','1788800551666-nilai-kurang-0.xlsx','2026-09-07 17:02:31'),(179,6,'nilai-lebih-100.xlsx','1788800551689-nilai-lebih-100.xlsx','2026-09-07 17:02:31'),(180,6,'nilai-siswa-tidak-ditemukan.xlsx','1788800551711-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:02:31'),(181,6,'nilai-success.xlsx','1788800551734-nilai-success.xlsx','2026-09-07 17:02:31'),(182,6,'nilai-update.xlsx','1788800551761-nilai-update.xlsx','2026-09-07 17:02:31'),(183,6,'nilai-invalid-nama.xlsx','1788800797515-nilai-invalid-nama.xlsx','2026-09-07 17:06:37'),(184,6,'nilai-invalid-nilai.xlsx','1788800797542-nilai-invalid-nilai.xlsx','2026-09-07 17:06:37'),(185,6,'nilai-bukan-angka.xlsx','1788800797563-nilai-bukan-angka.xlsx','2026-09-07 17:06:37'),(186,6,'nilai-kurang-0.xlsx','1788800797587-nilai-kurang-0.xlsx','2026-09-07 17:06:37'),(187,6,'nilai-lebih-100.xlsx','1788800797617-nilai-lebih-100.xlsx','2026-09-07 17:06:37'),(188,6,'nilai-siswa-tidak-ditemukan.xlsx','1788800797648-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:06:37'),(189,6,'nilai-success.xlsx','1788800797681-nilai-success.xlsx','2026-09-07 17:06:37'),(190,6,'nilai-update.xlsx','1788800797705-nilai-update.xlsx','2026-09-07 17:06:37'),(191,6,'nilai-invalid-nama.xlsx','1788800951883-nilai-invalid-nama.xlsx','2026-09-07 17:09:11'),(192,6,'nilai-invalid-nilai.xlsx','1788800951910-nilai-invalid-nilai.xlsx','2026-09-07 17:09:11'),(193,6,'nilai-bukan-angka.xlsx','1788800951933-nilai-bukan-angka.xlsx','2026-09-07 17:09:11'),(194,6,'nilai-kurang-0.xlsx','1788800951957-nilai-kurang-0.xlsx','2026-09-07 17:09:11'),(195,6,'nilai-lebih-100.xlsx','1788800951981-nilai-lebih-100.xlsx','2026-09-07 17:09:11'),(196,6,'nilai-siswa-tidak-ditemukan.xlsx','1788800952003-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:09:12'),(197,6,'nilai-success.xlsx','1788800952028-nilai-success.xlsx','2026-09-07 17:09:12'),(198,6,'nilai-update.xlsx','1788800952055-nilai-update.xlsx','2026-09-07 17:09:12'),(199,6,'nilai-invalid-nama.xlsx','1788801107325-nilai-invalid-nama.xlsx','2026-09-07 17:11:47'),(200,6,'nilai-invalid-nilai.xlsx','1788801107358-nilai-invalid-nilai.xlsx','2026-09-07 17:11:47'),(201,6,'nilai-bukan-angka.xlsx','1788801107379-nilai-bukan-angka.xlsx','2026-09-07 17:11:47'),(202,6,'nilai-kurang-0.xlsx','1788801107401-nilai-kurang-0.xlsx','2026-09-07 17:11:47'),(203,6,'nilai-lebih-100.xlsx','1788801107427-nilai-lebih-100.xlsx','2026-09-07 17:11:47'),(204,6,'nilai-siswa-tidak-ditemukan.xlsx','1788801107449-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:11:47'),(205,6,'nilai-success.xlsx','1788801107473-nilai-success.xlsx','2026-09-07 17:11:47'),(206,6,'nilai-update.xlsx','1788801107503-nilai-update.xlsx','2026-09-07 17:11:47'),(207,6,'nilai-invalid-nama.xlsx','1788801521814-nilai-invalid-nama.xlsx','2026-09-07 17:18:41'),(208,6,'nilai-invalid-nilai.xlsx','1788801521841-nilai-invalid-nilai.xlsx','2026-09-07 17:18:41'),(209,6,'nilai-bukan-angka.xlsx','1788801521863-nilai-bukan-angka.xlsx','2026-09-07 17:18:41'),(210,6,'nilai-kurang-0.xlsx','1788801521885-nilai-kurang-0.xlsx','2026-09-07 17:18:41'),(211,6,'nilai-lebih-100.xlsx','1788801521907-nilai-lebih-100.xlsx','2026-09-07 17:18:41'),(212,6,'nilai-siswa-tidak-ditemukan.xlsx','1788801521929-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:18:41'),(213,6,'nilai-success.xlsx','1788801521952-nilai-success.xlsx','2026-09-07 17:18:41'),(214,6,'nilai-update.xlsx','1788801521980-nilai-update.xlsx','2026-09-07 17:18:41'),(215,6,'nilai-invalid-nama.xlsx','1788801750438-nilai-invalid-nama.xlsx','2026-09-07 17:22:30'),(216,6,'nilai-invalid-nilai.xlsx','1788801750465-nilai-invalid-nilai.xlsx','2026-09-07 17:22:30'),(217,6,'nilai-bukan-angka.xlsx','1788801750487-nilai-bukan-angka.xlsx','2026-09-07 17:22:30'),(218,6,'nilai-kurang-0.xlsx','1788801750510-nilai-kurang-0.xlsx','2026-09-07 17:22:30'),(219,6,'nilai-lebih-100.xlsx','1788801750532-nilai-lebih-100.xlsx','2026-09-07 17:22:30'),(220,6,'nilai-siswa-tidak-ditemukan.xlsx','1788801750554-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:22:30'),(221,6,'nilai-success.xlsx','1788801750576-nilai-success.xlsx','2026-09-07 17:22:30'),(222,6,'nilai-update.xlsx','1788801750602-nilai-update.xlsx','2026-09-07 17:22:30'),(223,6,'nilai-invalid-nama.xlsx','1788801893163-nilai-invalid-nama.xlsx','2026-09-07 17:24:53'),(224,6,'nilai-invalid-nilai.xlsx','1788801893191-nilai-invalid-nilai.xlsx','2026-09-07 17:24:53'),(225,6,'nilai-bukan-angka.xlsx','1788801893213-nilai-bukan-angka.xlsx','2026-09-07 17:24:53'),(226,6,'nilai-kurang-0.xlsx','1788801893236-nilai-kurang-0.xlsx','2026-09-07 17:24:53'),(227,6,'nilai-lebih-100.xlsx','1788801893259-nilai-lebih-100.xlsx','2026-09-07 17:24:53'),(228,6,'nilai-siswa-tidak-ditemukan.xlsx','1788801893281-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:24:53'),(229,6,'nilai-success.xlsx','1788801893304-nilai-success.xlsx','2026-09-07 17:24:53'),(230,6,'nilai-update.xlsx','1788801893330-nilai-update.xlsx','2026-09-07 17:24:53'),(231,6,'nilai-invalid-nama.xlsx','1788801931152-nilai-invalid-nama.xlsx','2026-09-07 17:25:31'),(232,6,'nilai-invalid-nilai.xlsx','1788801931211-nilai-invalid-nilai.xlsx','2026-09-07 17:25:31'),(233,6,'nilai-bukan-angka.xlsx','1788801931260-nilai-bukan-angka.xlsx','2026-09-07 17:25:31'),(234,6,'nilai-kurang-0.xlsx','1788801931312-nilai-kurang-0.xlsx','2026-09-07 17:25:31'),(235,6,'nilai-lebih-100.xlsx','1788801931361-nilai-lebih-100.xlsx','2026-09-07 17:25:31'),(236,6,'nilai-siswa-tidak-ditemukan.xlsx','1788801931412-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:25:31'),(237,6,'nilai-success.xlsx','1788801931483-nilai-success.xlsx','2026-09-07 17:25:31'),(238,6,'nilai-update.xlsx','1788801931563-nilai-update.xlsx','2026-09-07 17:25:31'),(239,6,'nilai-invalid-nama.xlsx','1788801945498-nilai-invalid-nama.xlsx','2026-09-07 17:25:45'),(240,6,'nilai-invalid-nilai.xlsx','1788801945526-nilai-invalid-nilai.xlsx','2026-09-07 17:25:45'),(241,6,'nilai-bukan-angka.xlsx','1788801945548-nilai-bukan-angka.xlsx','2026-09-07 17:25:45'),(242,6,'nilai-kurang-0.xlsx','1788801945570-nilai-kurang-0.xlsx','2026-09-07 17:25:45'),(243,6,'nilai-lebih-100.xlsx','1788801945593-nilai-lebih-100.xlsx','2026-09-07 17:25:45'),(244,6,'nilai-siswa-tidak-ditemukan.xlsx','1788801945617-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:25:45'),(245,6,'nilai-success.xlsx','1788801945640-nilai-success.xlsx','2026-09-07 17:25:45'),(246,6,'nilai-update.xlsx','1788801945667-nilai-update.xlsx','2026-09-07 17:25:45'),(247,6,'nilai-invalid-nama.xlsx','1788801983981-nilai-invalid-nama.xlsx','2026-09-07 17:26:24'),(248,6,'nilai-invalid-nilai.xlsx','1788801984038-nilai-invalid-nilai.xlsx','2026-09-07 17:26:24'),(249,6,'nilai-bukan-angka.xlsx','1788801984096-nilai-bukan-angka.xlsx','2026-09-07 17:26:24'),(250,6,'nilai-kurang-0.xlsx','1788801984146-nilai-kurang-0.xlsx','2026-09-07 17:26:24'),(251,6,'nilai-lebih-100.xlsx','1788801984200-nilai-lebih-100.xlsx','2026-09-07 17:26:24'),(252,6,'nilai-siswa-tidak-ditemukan.xlsx','1788801984252-nilai-siswa-tidak-ditemukan.xlsx','2026-09-07 17:26:24'),(253,6,'nilai-success.xlsx','1788801984317-nilai-success.xlsx','2026-09-07 17:26:24'),(254,6,'nilai-update.xlsx','1788801984377-nilai-update.xlsx','2026-09-07 17:26:24'),(255,55,'Test Nilai.xlsx','1789066579676-Test Nilai.xlsx','2026-09-10 18:56:19'),(256,56,'1789066579676-Test Nilai (1).xlsx','1789360682293-1789066579676-Test_Nilai__1_.xlsx','2026-09-14 04:38:02'),(257,1,'1789360682293-1789066579676-Test_Nilai__1_.xlsx','1789369462897-1789360682293-1789066579676-Test_Nilai__1_.xlsx','2026-09-14 07:04:22'),(258,57,'1789360682293-1789066579676-Test_Nilai__1_.xlsx','1789370204236-1789360682293-1789066579676-Test_Nilai__1_.xlsx','2026-09-14 07:16:44'),(259,58,'book123.xlsx','1789461889758-book123.xlsx','2026-09-15 08:44:49');
/*!40000 ALTER TABLE `file_nilai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `galeri`
--

DROP TABLE IF EXISTS `galeri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `galeri` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `judul` varchar(150) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=195 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `galeri`
--

LOCK TABLES `galeri` WRITE;
/*!40000 ALTER TABLE `galeri` DISABLE KEYS */;
INSERT INTO `galeri` VALUES (3,'Try out','Tryout di Bimbelku','/uploads/1789533381331.jpeg','2026-09-07 06:16:08'),(4,'Pembelajaran','','/uploads/1789533371213.jpeg','2026-09-07 06:16:28'),(5,'Pembelajaran','','/uploads/1789533360425.jpeg','2026-09-07 06:16:49'),(6,'Pembelajaran','','/uploads/1789533351027.jpeg','2026-09-07 06:17:04');
/*!40000 ALTER TABLE `galeri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hero_section`
--

DROP TABLE IF EXISTS `hero_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hero_section` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `subtitle` text DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `background` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hero_section`
--

LOCK TABLES `hero_section` WRITE;
/*!40000 ALTER TABLE `hero_section` DISABLE KEYS */;
INSERT INTO `hero_section` VALUES (1,'Bimbelku Tigabinanga','Shine Brighter, Learn Smarter.','Daftar Sekarang','/uploads/1788845387499.avif');
/*!40000 ALTER TABLE `hero_section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hero_slider`
--

DROP TABLE IF EXISTS `hero_slider`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hero_slider` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gambar` varchar(255) NOT NULL,
  `urutan` int(11) DEFAULT 0,
  `status` enum('aktif','nonaktif') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hero_slider`
--

LOCK TABLES `hero_slider` WRITE;
/*!40000 ALTER TABLE `hero_slider` DISABLE KEYS */;
INSERT INTO `hero_slider` VALUES (9,'/uploads/1789532261624-hero.jpg',1,'aktif','2026-09-16 04:17:41'),(10,'/uploads/1789532261640-hero.jpg',2,'aktif','2026-09-16 04:17:41'),(11,'/uploads/1789532261648-hero.jpg',3,'aktif','2026-09-16 04:17:41'),(12,'/uploads/1789532261655-hero.jpg',4,'aktif','2026-09-16 04:17:41'),(13,'/uploads/1789532261662-hero.jpg',5,'aktif','2026-09-16 04:17:41');
/*!40000 ALTER TABLE `hero_slider` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jadwal`
--

DROP TABLE IF EXISTS `jadwal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jadwal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kelas` varchar(100) DEFAULT NULL,
  `mata_pelajaran` varchar(100) DEFAULT NULL,
  `tentor` varchar(100) DEFAULT NULL,
  `hari` varchar(20) DEFAULT NULL,
  `jam` varchar(20) DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `tentor_id` int(11) DEFAULT NULL,
  `kelas_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jadwal`
--

LOCK TABLES `jadwal` WRITE;
/*!40000 ALTER TABLE `jadwal` DISABLE KEYS */;
INSERT INTO `jadwal` VALUES (59,'301','Biologi','Immanuel','Selasa','15:00 - 17:00',NULL,39,70);
/*!40000 ALTER TABLE `jadwal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kelas`
--

DROP TABLE IF EXISTS `kelas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kelas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kelas` varchar(50) DEFAULT NULL,
  `program` varchar(50) DEFAULT NULL,
  `program_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kelas`
--

LOCK TABLES `kelas` WRITE;
/*!40000 ALTER TABLE `kelas` DISABLE KEYS */;
INSERT INTO `kelas` VALUES (70,'301',NULL,218);
/*!40000 ALTER TABLE `kelas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kontak`
--

DROP TABLE IF EXISTS `kontak`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kontak` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_bimbel` varchar(150) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `telepon` varchar(30) DEFAULT NULL,
  `whatsapp` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `instagram` varchar(100) DEFAULT NULL,
  `facebook` varchar(100) DEFAULT NULL,
  `youtube` varchar(100) DEFAULT NULL,
  `maps` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kontak`
--

LOCK TABLES `kontak` WRITE;
/*!40000 ALTER TABLE `kontak` DISABLE KEYS */;
INSERT INTO `kontak` VALUES (1,'BIMBELKU','Jl. Veteran No.1 Tigabinanga','6282123456789','6282123456789','admin@bimbelku.com','https://www.instagram.com/bimbelku_tigabinanga/','https://www.facebook.com/bimbelku.tigabinanga','-','https://maps.app.goo.gl/tSpyKYNKcztgvhScA');
/*!40000 ALTER TABLE `kontak` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `landing_about`
--

DROP TABLE IF EXISTS `landing_about`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `landing_about` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `landing_about`
--

LOCK TABLES `landing_about` WRITE;
/*!40000 ALTER TABLE `landing_about` DISABLE KEYS */;
/*!40000 ALTER TABLE `landing_about` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `landing_galeri`
--

DROP TABLE IF EXISTS `landing_galeri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `landing_galeri` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `judul` varchar(255) DEFAULT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `landing_galeri`
--

LOCK TABLES `landing_galeri` WRITE;
/*!40000 ALTER TABLE `landing_galeri` DISABLE KEYS */;
/*!40000 ALTER TABLE `landing_galeri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_aktivitas`
--

DROP TABLE IF EXISTS `log_aktivitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_aktivitas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `nama_user` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `aktivitas` varchar(255) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `waktu` datetime DEFAULT current_timestamp(),
  `tanggal` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=995 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_aktivitas`
--

LOCK TABLES `log_aktivitas` WRITE;
/*!40000 ALTER TABLE `log_aktivitas` DISABLE KEYS */;
INSERT INTO `log_aktivitas` VALUES (962,73,'Louis Paskalis Ginting','admin','Menyetujui pembayaran','Admin Louis Paskalis Ginting menyetujui pembayaran sebesar Rp 1.000.000 untuk siswa Paskalis Situmorang','2026-09-15 12:36:22','2026-09-15 12:36:22'),(963,73,'Louis Paskalis Ginting','admin','Menolak pendaftaran siswa','Admin Louis Paskalis Ginting menolak pendaftaran siswa Paskalis Situmorang','2026-09-15 12:36:35','2026-09-15 12:36:35'),(964,73,'Louis Paskalis Ginting','admin','Menyetujui pendaftaran siswa','Admin Louis Paskalis Ginting menyetujui pendaftaran siswa Paskalis Situmorang','2026-09-15 12:51:32','2026-09-15 12:51:32'),(965,73,'Louis Paskalis Ginting','admin','Menyetujui pembayaran','Admin Louis Paskalis Ginting menyetujui pembayaran sebesar Rp 10.000 untuk siswa woadaf','2026-09-15 13:03:43','2026-09-15 13:03:43'),(966,73,'Louis Paskalis Ginting','admin','Menolak pendaftaran siswa','Admin Louis Paskalis Ginting menolak pendaftaran siswa woadaf','2026-09-15 13:27:15','2026-09-15 13:27:15'),(967,73,'Louis Paskalis Ginting','admin','Menyetujui pembayaran','Admin Louis Paskalis Ginting menyetujui pembayaran sebesar Rp 1.000.000 untuk siswa Wizz lol','2026-09-15 13:28:31','2026-09-15 13:28:31'),(968,73,'Louis Paskalis Ginting','admin','Menyetujui pendaftaran siswa','Admin Louis Paskalis Ginting menyetujui pendaftaran siswa Wizz lol','2026-09-15 13:32:14','2026-09-15 13:32:14'),(969,73,'Louis Paskalis Ginting','admin','Menghapus siswa','Admin Louis Paskalis Ginting menghapus siswa Wizz lol','2026-09-15 13:32:30','2026-09-15 13:32:30'),(970,73,'Louis Paskalis Ginting','admin','Menyetujui pembayaran','Admin Louis Paskalis Ginting menyetujui pembayaran sebesar Rp 100.000 untuk siswa lajhjnad','2026-09-15 13:40:31','2026-09-15 13:40:31'),(971,73,'Louis Paskalis Ginting','admin','Menolak pendaftaran siswa','Admin Louis Paskalis Ginting menolak pendaftaran siswa lajhjnad','2026-09-15 13:49:47','2026-09-15 13:49:47'),(972,73,'Louis Paskalis Ginting','admin','Menyetujui pembayaran','Admin Louis Paskalis Ginting menyetujui pembayaran sebesar Rp 1.000.000 untuk siswa Paskalis Situmorang','2026-09-15 13:50:49','2026-09-15 13:50:49'),(973,73,'Louis Paskalis Ginting','admin','Menyetujui pendaftaran siswa','Admin Louis Paskalis Ginting menyetujui pendaftaran siswa kjwdkfsd dan pembayaran pertama.','2026-09-15 13:51:27','2026-09-15 13:51:27'),(974,73,'Louis Paskalis Ginting','admin','Menyetujui pendaftaran siswa','Admin Louis Paskalis Ginting menyetujui pendaftaran siswa intain dan pembayaran pertama.','2026-09-15 13:52:38','2026-09-15 13:52:38'),(975,73,'Louis Paskalis Ginting','admin','Menyetujui pendaftaran siswa','Admin Louis Paskalis Ginting menyetujui pendaftaran siswa lsihiosh dan pembayaran pertama.','2026-09-15 15:09:23','2026-09-15 15:09:23'),(976,73,'Louis Paskalis Ginting','admin','Menyetujui pendaftaran siswa','Admin Louis Paskalis Ginting menyetujui pendaftaran siswa ldanod dan pembayaran pertama otomatis disetujui.','2026-09-15 15:23:48','2026-09-15 15:23:48'),(977,73,'Louis Paskalis Ginting','admin','Menambahkan pembayaran','Admin Louis Paskalis Ginting menambahkan pembayaran sebesar Rp 100 untuk siswa ldanod','2026-09-15 15:24:05','2026-09-15 15:24:05'),(978,73,'Louis Paskalis Ginting','admin','Menghapus siswa','Admin Louis Paskalis Ginting menghapus siswa ldanod','2026-09-15 15:24:15','2026-09-15 15:24:15'),(979,73,'Louis Paskalis Ginting','admin','Menghapus siswa','Admin Louis Paskalis Ginting menghapus siswa lsihiosh','2026-09-15 15:24:17','2026-09-15 15:24:17'),(980,73,'Louis Paskalis Ginting','admin','Menghapus siswa','Admin Louis Paskalis Ginting menghapus siswa intain','2026-09-15 15:24:20','2026-09-15 15:24:20'),(981,73,'Louis Paskalis Ginting','admin','Menghapus siswa','Admin Louis Paskalis Ginting menghapus siswa kjwdkfsd','2026-09-15 15:24:22','2026-09-15 15:24:22'),(982,73,'Louis Paskalis Ginting','admin','Menghapus siswa','Admin Louis Paskalis Ginting menghapus siswa Paskalis Situmorang','2026-09-15 15:24:26','2026-09-15 15:24:26'),(983,73,'Louis Paskalis Ginting','admin','Menyetujui pendaftaran siswa','Admin Louis Paskalis Ginting menyetujui pendaftaran siswa Paskalis Situmorang dan pembayaran pertama otomatis disetujui.','2026-09-15 15:26:46','2026-09-15 15:26:46'),(984,73,'Louis Paskalis Ginting','admin','Menyetujui pembayaran','Admin Louis Paskalis Ginting menyetujui pembayaran sebesar Rp 1.000.000 untuk siswa Paskalis Situmorang','2026-09-15 15:28:14','2026-09-15 15:28:14'),(985,73,'Louis Paskalis Ginting','admin','Menambahkan pembayaran','Admin Louis Paskalis Ginting menambahkan pembayaran sebesar Rp 1.000.000 untuk siswa Paskalis Situmorang','2026-09-15 15:28:35','2026-09-15 15:28:35'),(986,73,'Louis Paskalis Ginting','admin','Menambahkan pembayaran','Admin Louis Paskalis Ginting menambahkan pembayaran sebesar Rp 1 untuk siswa Paskalis Situmorang','2026-09-15 15:34:09','2026-09-15 15:34:09'),(987,73,'Louis Paskalis Ginting','admin','Tambah Kelas','Menambahkan kelas \"301\" pada program \"Garansi PTN \"','2026-09-15 15:34:35','2026-09-15 15:34:35'),(988,73,'Louis Paskalis Ginting','admin','Memasukkan siswa ke kelas','Admin Louis Paskalis Ginting memasukkan siswa Paskalis Situmorang ke kelas 301','2026-09-15 15:34:44','2026-09-15 15:34:44'),(989,73,'Louis Paskalis Ginting','admin','Edit Kelas','Mengubah kelas \"301\" menjadi \"301\" pada program \"12 SMA Kedinasan & Bintara\"','2026-09-15 15:35:06','2026-09-15 15:35:06'),(990,73,'Louis Paskalis Ginting','admin','Menambahkan tentor','Admin menambahkan tentor \"Immanuel\" dengan mata pelajaran \"Biologi\".','2026-09-15 15:36:16','2026-09-15 15:36:16'),(991,73,'Louis Paskalis Ginting','admin','Tambah Jadwal','Menambahkan jadwal Biologi untuk kelas \"301\" dengan tentor \"Immanuel\" pada hari Selasa pukul 15:00 - 17:00.','2026-09-15 15:38:00','2026-09-15 15:38:00'),(992,73,'Louis Paskalis Ginting','admin','Menambahkan pengumuman','Menambahkan pengumuman \"Try out April 2026\"','2026-09-15 15:41:23','2026-09-15 15:41:23'),(993,73,'Louis Paskalis Ginting','admin','Menambahkan event','Menambahkan event \"Try out April 2026\"','2026-09-15 15:42:04','2026-09-15 15:42:04'),(994,73,'Louis Paskalis Ginting','admin','Upload Nilai','Mengupload file nilai \"book123.xlsx\" untuk event \"Try out April 2026\". 1 data nilai berhasil diproses.','2026-09-15 15:44:49','2026-09-15 15:44:49');
/*!40000 ALTER TABLE `log_aktivitas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nilai`
--

DROP TABLE IF EXISTS `nilai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nilai` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) DEFAULT NULL,
  `event_id` int(11) DEFAULT NULL,
  `nilai` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nilai`
--

LOCK TABLES `nilai` WRITE;
/*!40000 ALTER TABLE `nilai` DISABLE KEYS */;
INSERT INTO `nilai` VALUES (1,29,5,90.00),(2,47,2,90.00),(3,47,2,90.00),(4,47,1,90.00),(5,50,1,90.00),(37,102,1,62.19),(39,102,57,62.19),(40,47,57,53.44),(41,50,57,52.81),(42,113,58,40.18);
/*!40000 ALTER TABLE `nilai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pembayaran`
--

DROP TABLE IF EXISTS `pembayaran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pembayaran` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) DEFAULT NULL,
  `total_tagihan` int(11) DEFAULT NULL,
  `sudah_dibayar` int(11) DEFAULT 0,
  `sisa_tagihan` bigint(20) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `siswa_id` (`siswa_id`),
  CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pembayaran`
--

LOCK TABLES `pembayaran` WRITE;
/*!40000 ALTER TABLE `pembayaran` DISABLE KEYS */;
INSERT INTO `pembayaran` VALUES (91,113,5570000,3000001,2569998);
/*!40000 ALTER TABLE `pembayaran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pembayaran_detail`
--

DROP TABLE IF EXISTS `pembayaran_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pembayaran_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pembayaran_id` int(11) DEFAULT NULL,
  `jumlah` int(11) DEFAULT NULL,
  `tanggal` datetime NOT NULL DEFAULT current_timestamp(),
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `catatan` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pembayaran_id` (`pembayaran_id`),
  CONSTRAINT `pembayaran_detail_ibfk_1` FOREIGN KEY (`pembayaran_id`) REFERENCES `pembayaran` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pembayaran_detail`
--

LOCK TABLES `pembayaran_detail` WRITE;
/*!40000 ALTER TABLE `pembayaran_detail` DISABLE KEYS */;
INSERT INTO `pembayaran_detail` VALUES (241,91,1000000,'2026-09-15 00:00:00','1789460776379-bukti-pembayaran.jpeg','approved','Pembayaran pertama otomatis disetujui bersamaan dengan approval pendaftaran siswa.'),(242,91,1000000,'2026-09-15 00:00:00','1789460859661-bukti-pembayaran.jpg','approved','Pembayaran disetujui oleh admin.'),(243,91,1000000,'2026-09-15 00:00:00','1789460915930-bukti-pembayaran.jpg','approved','Pembayaran dimasukkan oleh admin'),(244,91,1,'2026-09-15 15:34:09','1789461249835-bukti-pembayaran.jpg','approved','Pembayaran dimasukkan oleh admin');
/*!40000 ALTER TABLE `pembayaran_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pengumuman`
--

DROP TABLE IF EXISTS `pengumuman`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pengumuman` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `judul` varchar(200) DEFAULT NULL,
  `isi` text DEFAULT NULL,
  `tanggal` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pengumuman`
--

LOCK TABLES `pengumuman` WRITE;
/*!40000 ALTER TABLE `pengumuman` DISABLE KEYS */;
INSERT INTO `pengumuman` VALUES (34,'Try out April 2026','Semua harap mengikuti','2026-09-15 08:41:23');
/*!40000 ALTER TABLE `pengumuman` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `program`
--

DROP TABLE IF EXISTS `program`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_program` varchar(100) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga` int(11) DEFAULT NULL,
  `durasi` varchar(50) DEFAULT NULL,
  `jumlah_pertemuan` int(11) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `status` enum('aktif','nonaktif') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=222 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program`
--

LOCK TABLES `program` WRITE;
/*!40000 ALTER TABLE `program` DISABLE KEYS */;
INSERT INTO `program` VALUES (19,'Lulus Kedinasan','Garansi Lulus Kedinasan Terbaik di Indonesia',10000000,'3 Bulan',12,NULL,NULL,'aktif','2026-05-25 18:01:15'),(217,'Garansi SMA Unggul ','',5500000,'1 Tahun',156,NULL,NULL,'aktif','2026-09-10 16:12:45'),(218,'12 SMA Kedinasan & Bintara','',5570000,'1 Tahun',150,NULL,NULL,'aktif','2026-09-10 16:14:11'),(219,'Garansi PTN ','',10000000,'1 Tahun',150,NULL,NULL,'aktif','2026-09-10 16:14:44'),(220,'12 SMA PTN ','',4500000,'1 Tahun',150,NULL,NULL,'aktif','2026-09-10 16:16:06'),(221,'9 SMP REGULER','',250000,'1 Tahun',150,NULL,NULL,'aktif','2026-09-10 16:38:33');
/*!40000 ALTER TABLE `program` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `siswa`
--

DROP TABLE IF EXISTS `siswa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `siswa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `kelas` varchar(20) NOT NULL,
  `asal_sekolah` varchar(100) NOT NULL,
  `no_hp` varchar(15) NOT NULL,
  `nama_orangtua` varchar(100) NOT NULL,
  `no_hp_orangtua` varchar(15) NOT NULL,
  `program` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `tanggal_daftar` timestamp NOT NULL DEFAULT current_timestamp(),
  `program_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved') DEFAULT 'pending',
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `nama_kelas` varchar(50) DEFAULT NULL,
  `kelas_bimbel_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `kelas_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_program` (`program_id`),
  CONSTRAINT `fk_program` FOREIGN KEY (`program_id`) REFERENCES `program` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `siswa`
--

LOCK TABLES `siswa` WRITE;
/*!40000 ALTER TABLE `siswa` DISABLE KEYS */;
INSERT INTO `siswa` VALUES (113,'Paskalis Situmorang','12','SMAN 1 SIDIKALANG','081290984857','Situmorang','087898761281','','louisginting56@gmail.com','2026-09-15 08:26:16',218,'approved','1789460776379-bukti-pembayaran.jpeg','123456',NULL,NULL,80,70,'2026-09-15 08:26:16');
/*!40000 ALTER TABLE `siswa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tentor`
--

DROP TABLE IF EXISTS `tentor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tentor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) DEFAULT NULL,
  `mapel` varchar(100) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Aktif',
  `password` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tentor`
--

LOCK TABLES `tentor` WRITE;
/*!40000 ALTER TABLE `tentor` DISABLE KEYS */;
INSERT INTO `tentor` VALUES (39,'Immanuel','Biologi','082166632821','petarunghebat08@gmail.com','Aktif','$2b$10$5JEJ0Y1rwopQZdauUQ8XW.Bwxfe6tqEQ8lbfO8NrDrSlVIsUHzTRi',81);
/*!40000 ALTER TABLE `tentor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonial`
--

DROP TABLE IF EXISTS `testimonial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `asal_sekolah` varchar(100) DEFAULT NULL,
  `universitas` varchar(100) DEFAULT NULL,
  `pesan` text DEFAULT NULL,
  `signature` varchar(255) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonial`
--

LOCK TABLES `testimonial` WRITE;
/*!40000 ALTER TABLE `testimonial` DISABLE KEYS */;
INSERT INTO `testimonial` VALUES (2,'Sri Nur Anisah','SMAN 1 Tigabinanga','Pendidikan Akuntansi-UNIMED','\"Belajar di bimbelku sangat membantu aku memahami pelajaran yang sebelumnya sulit menjadi mudah. tentornya ramah, sabar dan suasana belajarnya nyaman, jadi semakin semangat belajarnya. Untuk adik adik yang masih ragu, jangan takut untuk mencoba  ya. Bimbelku ini bisa bantu kalian belajar lebih efektif dan meraih nilai yang lebih baik lagi. Tetap semangat dan jangan mudah menyerah.','Belajar asik di Bimbelku','/uploads/1784199072735.bmp','2026-07-16 10:51:12'),(144,'Beauty Lovely Zulfathy','SMAN 1 Tigabinanga','Pend. Bahasa dan Sastra - UNIMED','Tentor di bimbelku sangat asik dan bisa memposisikan diri sebagai kakak sekaligus sahabat yang seru untuk diajak diskusi. Aku ga pernah takut untuk tanya yanya hal sepele karena mereka selalu sabar ngejelasin materi dari nol. Berkat cara mengajarnya, soal yang sulit jadi mudah dikerjakan. bahkan aku jadi kaget \"oh semudah itu ternyata\". Kakak dan abang tentor yang selalu ngasih motivasi dan solusi saat aku bingung dan pasrah. Intinya di Bimbelku aku kerasa puas banget deh. Sukses Terus !!!','Abang dan Kakak tentornya asikk','','2026-09-10 16:24:20'),(145,'Arda Gio Efrata Tarigan ','SMAN 1 Tigabinanga','Nautika - Polimarin','Belajar di Bimbelku sangat seru dan menyenangkan. Tentor di Bimbelku mengajar menggunakan cara yang menyenangkan tapi serius bahkan songking serunya bikin kita cepat nangkap dan mengerti. Belajar di Bimbelku pokoknya gak bakalan rugi buat masuk PTN. Pesan buat adik-adik yang mau lulus PTN, yok gabung di Bimbelku. Gak perlu jauh-jauh, ke Bimbel ku Tigabinanga aja.','Belajar seru dan menyenangkan','','2026-09-10 16:31:31'),(146,'Salman El Paskel Milala','SMAN 1 Tigabinanga','Metrologi dan Instumentasi - USU','Belajar di Bimbelku menyenangkan.\r\nTentor di bimbelku serius tapi santai, kita bebas bertanya jika kita tidak paham materinya. Buat kamu yang mau masuk PTN tahun depan, jangan ragu ke Bimbelku. Saya buktinya.','Jangan Ragu Ke Bimbelku','','2026-09-10 16:33:24');
/*!40000 ALTER TABLE `testimonial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','tentor','siswa') DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expire` bigint(20) DEFAULT NULL,
  `is_master` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Admin','admin@gmail.com','$2b$10$qYv6ygDF6A51zgYvsHVCG.Z3j8KKK9duKaLuJsnUAhRR2Vs49oQOS','admin',NULL,NULL,1),(73,'Louis Paskalis Ginting','louisginting08@gmail.com','$2b$10$TxPwNoPX5UpPMz8x1O01U.AzDYCdIk.TtAsYjuiL54xrtfPAydB0y','admin',NULL,NULL,0),(80,'Paskalis Situmorang','louisginting56@gmail.com','$2b$10$U80NiwGK.V7fgzMK5Xz/3.k.c6a8K07aIe/QQ0Xmy4ktBFRwHWfUO','siswa',NULL,NULL,0),(81,'Immanuel','petarunghebat08@gmail.com','$2b$10$5JEJ0Y1rwopQZdauUQ8XW.Bwxfe6tqEQ8lbfO8NrDrSlVIsUHzTRi','tentor',NULL,NULL,0);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-16 13:12:41
