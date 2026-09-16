const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================
// GET STATISTIK DASHBOARD ADMIN
// ===============================
router.get("/stats", (req, res) => {
  const stats = {
    total_siswa: 0,
    total_tentor: 0,
    kelas_hari_ini: 0,
    pendaftar_bulan_ini: 0,
  };

  const sqlTotalSiswa = `
    SELECT COUNT(*) AS total
    FROM siswa
    WHERE status = 'approved'
  `;

  db.query(sqlTotalSiswa, (err, siswaResult) => {
    if (err) {
      console.log("ERROR TOTAL SISWA:", err);
      return res.status(500).json({
        message: "Gagal mengambil total siswa",
        error: err,
      });
    }

    stats.total_siswa = siswaResult[0].total;

    const sqlTotalTentor = `
      SELECT COUNT(*) AS total
      FROM tentor
    `;

    db.query(sqlTotalTentor, (err, tentorResult) => {
      if (err) {
        console.log("ERROR TOTAL TENTOR:", err);
        return res.status(500).json({
          message: "Gagal mengambil total tentor",
          error: err,
        });
      }

      stats.total_tentor = tentorResult[0].total;

      const sqlKelasHariIni = `
        SELECT COUNT(*) AS total
        FROM jadwal
        WHERE LOWER(hari) = LOWER(
          CASE DAYNAME(CURDATE())
            WHEN 'Monday' THEN 'Senin'
            WHEN 'Tuesday' THEN 'Selasa'
            WHEN 'Wednesday' THEN 'Rabu'
            WHEN 'Thursday' THEN 'Kamis'
            WHEN 'Friday' THEN 'Jumat'
            WHEN 'Saturday' THEN 'Sabtu'
            WHEN 'Sunday' THEN 'Minggu'
          END
        )
      `;

      db.query(sqlKelasHariIni, (err, kelasResult) => {
        if (err) {
          console.log("ERROR KELAS HARI INI:", err);
          return res.status(500).json({
            message: "Gagal mengambil kelas hari ini",
            error: err,
          });
        }

        stats.kelas_hari_ini = kelasResult[0].total;

        const sqlPendaftarBulanIni = `
          SELECT COUNT(*) AS total
          FROM siswa
          WHERE MONTH(created_at) = MONTH(CURDATE())
          AND YEAR(created_at) = YEAR(CURDATE())
        `;

        db.query(sqlPendaftarBulanIni, (err, pendaftarResult) => {
          if (err) {
            console.log("ERROR PENDAFTAR BULAN INI:", err);
            return res.status(500).json({
              message: "Gagal mengambil pendaftar bulan ini",
              error: err,
            });
          }

          stats.pendaftar_bulan_ini = pendaftarResult[0].total;

          res.json(stats);
        });
      });
    });
  });
});

module.exports = router;
