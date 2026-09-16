const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================================
// HELPER
// TANGGAL HARI INI WIB
// ======================================================

const getTanggalWIB = () => {
  const sekarang = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(sekarang);
};

// ======================================================
// HELPER
// VALIDASI ID
// ======================================================

const isValidId = (id) => {
  return (
    id !== undefined &&
    id !== null &&
    String(id).trim() !== "" &&
    /^\d+$/.test(String(id)) &&
    Number(id) > 0
  );
};

// ======================================================
// HELPER
// VALIDASI TANGGAL
// FORMAT: YYYY-MM-DD
// ======================================================

const isValidTanggal = (tanggal) => {
  if (!tanggal || typeof tanggal !== "string") {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return false;
  }

  const [tahun, bulan, hari] = tanggal.split("-").map(Number);

  const date = new Date(Date.UTC(tahun, bulan - 1, hari));

  return (
    date.getUTCFullYear() === tahun &&
    date.getUTCMonth() === bulan - 1 &&
    date.getUTCDate() === hari
  );
};

// ======================================================
// GENERATE ABSENSI
// ======================================================

router.post("/generate", (req, res) => {
  const { jadwal_id } = req.body;

  // Jika tanggal dikirim dari frontend, gunakan tanggal tersebut.
  // Jika tidak, gunakan tanggal WIB.
  const tanggal = req.body.tanggal || getTanggalWIB();

  // ====================================================
  // VALIDASI JADWAL ID
  // ====================================================

  if (!isValidId(jadwal_id)) {
    return res.status(400).json({
      success: false,
      message: "jadwal_id wajib diisi",
    });
  }

  // ====================================================
  // VALIDASI TANGGAL
  // ====================================================

  if (!isValidTanggal(tanggal)) {
    return res.status(400).json({
      success: false,
      message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
    });
  }

  console.log("====================================");
  console.log("GENERATE ABSENSI");
  console.log("JADWAL ID :", jadwal_id);
  console.log("TANGGAL   :", tanggal);
  console.log("====================================");

  // ====================================================
  // CEK JADWAL
  // ====================================================

  const sqlJadwal = `
    SELECT
      jadwal.id,
      jadwal.kelas_id,
      jadwal.mata_pelajaran,
      jadwal.hari,
      jadwal.jam,
      kelas.nama_kelas
    FROM jadwal
    LEFT JOIN kelas
      ON kelas.id = jadwal.kelas_id
    WHERE jadwal.id = ?
    LIMIT 1
  `;

  db.query(sqlJadwal, [Number(jadwal_id)], (err, jadwalResult) => {
    if (err) {
      console.error("ERROR GET JADWAL:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data jadwal",
        error: err.message,
      });
    }

    // ==================================================
    // JADWAL TIDAK DITEMUKAN
    // ==================================================

    if (jadwalResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan",
      });
    }

    const jadwal = jadwalResult[0];
    const kelasId = jadwal.kelas_id;

    // ==================================================
    // CEK KELAS
    // ==================================================

    if (!kelasId) {
      return res.status(400).json({
        success: false,
        message: "Jadwal belum memiliki kelas_id",
      });
    }

    console.log("KELAS ID   :", kelasId);
    console.log("NAMA KELAS :", jadwal.nama_kelas);

    // ====================================================
    // CEK SISWA DI KELAS
    // ====================================================

    const sqlSiswa = `
      SELECT
        id,
        nama,
        kelas_id,
        status
      FROM siswa
      WHERE kelas_id = ?
        AND status = 'approved'
      ORDER BY nama ASC
    `;

    db.query(sqlSiswa, [kelasId], (err, siswaResult) => {
      if (err) {
        console.error("ERROR GET SISWA:", err);

        return res.status(500).json({
          success: false,
          message: "Gagal mengambil data siswa",
          error: err.message,
        });
      }

      console.log("JUMLAH SISWA :", siswaResult.length);

      // ==================================================
      // TIDAK ADA SISWA
      // ==================================================

      if (siswaResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Tidak ada siswa approved pada kelas ${
            jadwal.nama_kelas || kelasId
          }`,
          kelas_id: kelasId,
        });
      }

      // ==================================================
      // CEK ABSENSI SUDAH ADA
      // ==================================================

      const sqlCheck = `
        SELECT id
        FROM absensi
        WHERE jadwal_id = ?
          AND DATE(tanggal) = ?
        LIMIT 1
      `;

      db.query(sqlCheck, [Number(jadwal_id), tanggal], (err, checkResult) => {
        if (err) {
          console.error("ERROR CEK ABSENSI:", err);

          return res.status(500).json({
            success: false,
            message: "Gagal mengecek absensi",
            error: err.message,
          });
        }

        // =================================================
        // ABSENSI SUDAH ADA
        // =================================================

        if (checkResult.length > 0) {
          return res.json({
            success: true,
            exists: true,
            message: "Absensi untuk jadwal ini hari ini sudah tersedia",
            jumlah_siswa: siswaResult.length,
            tanggal,
          });
        }

        // =================================================
        // SIAPKAN DATA ABSENSI
        // =================================================

        const values = siswaResult.map((siswa) => [
          Number(jadwal_id),
          siswa.id,
          tanggal,
          "alpha",
        ]);

        // =================================================
        // INSERT ABSENSI
        // =================================================

        const sqlInsert = `
            INSERT INTO absensi
            (
              jadwal_id,
              siswa_id,
              tanggal,
              status
            )
            VALUES ?
          `;

        db.query(sqlInsert, [values], (err, result) => {
          if (err) {
            console.error("ERROR INSERT ABSENSI:", err);

            return res.status(500).json({
              success: false,
              message: "Gagal membuat data absensi",
              error: err.message,
            });
          }

          console.log(`Berhasil membuat ${result.affectedRows} data absensi`);

          return res.json({
            success: true,
            exists: false,
            message: "Absensi berhasil dibuat",
            jumlah_siswa: result.affectedRows,
            tanggal,
          });
        });
      });
    });
  });
});

// ======================================================
// GET ABSENSI BERDASARKAN JADWAL
// ======================================================

router.get("/by-jadwal/:jadwal_id", (req, res) => {
  const { jadwal_id } = req.params;
  const tanggal = req.query.tanggal || getTanggalWIB();

  // ====================================================
  // VALIDASI JADWAL ID
  // ====================================================

  if (!isValidId(jadwal_id)) {
    return res.status(400).json({
      success: false,
      message: "jadwal_id tidak valid",
    });
  }

  // ====================================================
  // VALIDASI TANGGAL
  // ====================================================

  if (!isValidTanggal(tanggal)) {
    return res.status(400).json({
      success: false,
      message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
    });
  }

  const sql = `
    SELECT
      absensi.id,
      absensi.jadwal_id,
      absensi.siswa_id,

      DATE_FORMAT(
        absensi.tanggal,
        '%Y-%m-%d'
      ) AS tanggal,

      absensi.status,

      siswa.nama,
      siswa.asal_sekolah,
      siswa.no_hp,

      kelas.nama_kelas,

      program.nama_program

    FROM absensi

    JOIN siswa
      ON siswa.id = absensi.siswa_id

    LEFT JOIN kelas
      ON siswa.kelas_id = kelas.id

    LEFT JOIN program
      ON siswa.program_id = program.id

    WHERE absensi.jadwal_id = ?
      AND DATE(absensi.tanggal) = ?

    ORDER BY siswa.nama ASC
  `;

  db.query(sql, [Number(jadwal_id), tanggal], (err, result) => {
    if (err) {
      console.error("ERROR GET ABSENSI:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data absensi",
        error: err.message,
      });
    }

    console.log("====================================");
    console.log("GET ABSENSI");
    console.log("JADWAL ID :", jadwal_id);
    console.log("TANGGAL   :", tanggal);
    console.log("JUMLAH    :", result.length);
    console.log("====================================");

    return res.json(result);
  });
});

// ======================================================
// UPDATE STATUS ABSENSI
// ======================================================

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // ====================================================
  // VALIDASI ID
  // ====================================================

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "ID absensi tidak valid",
    });
  }

  // ====================================================
  // VALIDASI STATUS
  // ====================================================

  const statusValid = ["hadir", "izin", "sakit", "alpha"];

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status wajib diisi",
    });
  }

  if (typeof status !== "string") {
    return res.status(400).json({
      success: false,
      message: "Status tidak valid. Gunakan hadir, izin, sakit, atau alpha.",
    });
  }

  const statusFix = status.trim().toLowerCase();

  if (!statusValid.includes(statusFix)) {
    return res.status(400).json({
      success: false,
      message: "Status tidak valid. Gunakan hadir, izin, sakit, atau alpha.",
    });
  }

  // ====================================================
  // UPDATE
  // ====================================================

  const sql = `
    UPDATE absensi
    SET status = ?
    WHERE id = ?
  `;

  db.query(sql, [statusFix, Number(id)], (err, result) => {
    if (err) {
      console.error("ERROR UPDATE ABSENSI:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal mengupdate status absensi",
        error: err.message,
      });
    }

    // ==================================================
    // DATA TIDAK DITEMUKAN
    // ==================================================

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Data absensi tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      message: "Status absensi berhasil diupdate",
      status: statusFix,
    });
  });
});

// ======================================================
// GET ABSENSI SISWA
// ======================================================

router.get("/siswa/:id", (req, res) => {
  const { id } = req.params;

  // ====================================================
  // VALIDASI ID SISWA
  // ====================================================

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "ID siswa tidak valid",
    });
  }

  const sql = `
    SELECT
      absensi.id,
      absensi.jadwal_id,
      absensi.siswa_id,

      DATE_FORMAT(
        absensi.tanggal,
        '%Y-%m-%d'
      ) AS tanggal,

      absensi.status,

      jadwal.mata_pelajaran,
      jadwal.hari,
      jadwal.jam,

      kelas.nama_kelas

    FROM absensi

    LEFT JOIN jadwal
      ON jadwal.id = absensi.jadwal_id

    LEFT JOIN kelas
      ON jadwal.kelas_id = kelas.id

    WHERE absensi.siswa_id = ?

    ORDER BY absensi.tanggal DESC
  `;

  db.query(sql, [Number(id)], (err, result) => {
    if (err) {
      console.error("ERROR GET ABSENSI SISWA:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data absensi siswa",
        error: err.message,
      });
    }

    return res.json(result);
  });
});

// ======================================================
// EXPORT
// ======================================================

module.exports = router;
