DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `document_id` varchar(128) NOT NULL,
  `document_code` varchar(20) DEFAULT NULL,
  `originalname` varchar(200) DEFAULT NULL,
  `file_name` varchar(150) DEFAULT NULL,
  `file_path` varchar(200) DEFAULT NULL,
  `uploaded_at` varchar(20) DEFAULT NULL,
  `mime_type` varchar(50) DEFAULT NULL,
  `file_size` int(12) DEFAULT NULL,
  PRIMARY KEY (`document_id`),
  KEY `idx_document_code` (`document_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
