const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================
// GET NOTIFIKASI DASHBOARD ADMIN
// ===============================
router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM (
      SELECT
        siswa.id AS id,
        'pendaftaran' AS tipe,
        siswa.nama AS nama,
        CONCAT(siswa.nama, ' baru saja mendaftar') AS title,
        'Pendaftaran siswa baru menunggu persetujuan admin.' AS description,
        siswa.created_at AS waktu,
        siswa.id AS urutan
      FROM siswa
      WHERE siswa.status = 'pending'

      UNION ALL

      SELECT
        pembayaran_detail.id AS id,
        'pembayaran' AS tipe,
        siswa.nama AS nama,
        CONCAT(siswa.nama, ' mengirim pembayaran') AS title,
        CONCAT(
          'Pembayaran sebesar Rp ',
          FORMAT(pembayaran_detail.jumlah, 0),
          ' menunggu verifikasi.'
        ) AS description,
        pembayaran_detail.tanggal AS waktu,
        pembayaran_detail.id AS urutan
      FROM pembayaran_detail
      JOIN pembayaran ON pembayaran_detail.pembayaran_id = pembayaran.id
      JOIN siswa ON pembayaran.siswa_id = siswa.id
      WHERE pembayaran_detail.status = 'pending'
    ) AS notifikasi
    ORDER BY waktu DESC, urutan DESC
    LIMIT 10
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("ERROR GET NOTIFIKASI:", err);
      return res.status(500).json({
        message: "Gagal mengambil notifikasi",
        error: err,
      });
    }

    res.json(result);
  });
});

module.exports = router;
