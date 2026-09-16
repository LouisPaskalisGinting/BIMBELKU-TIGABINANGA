const express = require("express");
const router = express.Router();
const db = require("../db");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// GET JADWAL HARI INI
// =====================================================
router.get("/hari-ini", (req, res) => {
  const hariIni = new Date()
    .toLocaleDateString("id-ID", {
      weekday: "long",
    })
    .toLowerCase();

  const sql = `
    SELECT
      jadwal.*,
      kelas.nama_kelas AS kelas,
      kelas.nama_kelas,
      program.nama_program
    FROM jadwal
    LEFT JOIN kelas
      ON kelas.id = jadwal.kelas_id
    LEFT JOIN program
      ON program.id = kelas.program_id
    WHERE LOWER(jadwal.hari) LIKE ?
    ORDER BY jadwal.jam ASC
  `;

  db.query(sql, [`%${hariIni}%`], (err, result) => {
    if (err) {
      console.log("ERROR GET JADWAL HARI INI:", err);

      return res.status(500).json({
        message: "Gagal mengambil jadwal hari ini",
      });
    }

    res.json(result);
  });
});

// =====================================================
// GET SEMUA JADWAL UNTUK ADMIN
// =====================================================
router.get("/", (req, res) => {
  const sql = `
    SELECT
      jadwal.*,
      kelas.nama_kelas AS kelas,
      kelas.nama_kelas,
      program.nama_program
    FROM jadwal
    LEFT JOIN kelas
      ON kelas.id = jadwal.kelas_id
    LEFT JOIN program
      ON program.id = kelas.program_id
    ORDER BY jadwal.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("ERROR GET JADWAL:", err);

      return res.status(500).json({
        message: "Gagal mengambil data jadwal",
      });
    }

    res.json(result);
  });
});

// =====================================================
// GET JADWAL BERDASARKAN SISWA
// =====================================================
router.get("/siswa/:id", (req, res) => {
  const siswaId = req.params.id;

  const sql = `
    SELECT
      jadwal.*,
      kelas.nama_kelas AS kelas,
      kelas.nama_kelas,
      program.nama_program
    FROM siswa
    JOIN jadwal
      ON siswa.kelas_id = jadwal.kelas_id
    LEFT JOIN kelas
      ON kelas.id = jadwal.kelas_id
    LEFT JOIN program
      ON program.id = kelas.program_id
    WHERE siswa.id = ?
    ORDER BY jadwal.id DESC
  `;

  db.query(sql, [siswaId], (err, result) => {
    if (err) {
      console.log("ERROR JADWAL SISWA:", err);

      return res.status(500).json({
        message: "Gagal mengambil jadwal siswa",
      });
    }

    res.json(result);
  });
});

// =====================================================
// GET JADWAL BERDASARKAN TENTOR
// =====================================================
router.get("/tentor/:id", (req, res) => {
  const userId = req.params.id;

  db.query(
    "SELECT nama FROM user WHERE id = ?",
    [userId],
    (err, userResult) => {
      if (err) {
        console.log("ERROR GET USER TENTOR:", err);

        return res.status(500).json({
          message: "Gagal mengambil data tentor",
        });
      }

      if (userResult.length === 0) {
        return res.json([]);
      }

      const namaTentor = userResult[0].nama;

      const sql = `
        SELECT
          jadwal.*,
          kelas.nama_kelas AS kelas,
          kelas.nama_kelas,
          program.nama_program
        FROM jadwal
        LEFT JOIN kelas
          ON kelas.id = jadwal.kelas_id
        LEFT JOIN program
          ON program.id = kelas.program_id
        WHERE jadwal.tentor = ?
        ORDER BY jadwal.id DESC
      `;

      db.query(sql, [namaTentor], (err, result) => {
        if (err) {
          console.log("ERROR JADWAL TENTOR:", err);

          return res.status(500).json({
            message: "Gagal mengambil jadwal tentor",
          });
        }

        res.json(result);
      });
    }
  );
});

// =====================================================
// POST TAMBAH JADWAL
// =====================================================
router.post("/", authMiddleware, (req, res) => {
  const { kelas_id, mata_pelajaran, tentor, hari, jam, tentor_id } = req.body;

  // =====================================================
  // VALIDASI
  // =====================================================

  if (!kelas_id || !mata_pelajaran || !tentor || !hari || !jam) {
    return res.status(400).json({
      message: "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi",
      body_diterima: req.body,
    });
  }

  // =====================================================
  // CEK KELAS
  // =====================================================

  const sqlKelas = `
    SELECT nama_kelas
    FROM kelas
    WHERE id = ?
  `;

  db.query(sqlKelas, [kelas_id], (err, kelasResult) => {
    if (err) {
      console.log("ERROR CEK KELAS:", err);

      return res.status(500).json({
        message: "Gagal memeriksa kelas",
      });
    }

    if (kelasResult.length === 0) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan",
      });
    }

    const namaKelas = kelasResult[0].nama_kelas;

    // =====================================================
    // INSERT JADWAL
    // =====================================================

    const sql = `
      INSERT INTO jadwal
      (
        kelas,
        kelas_id,
        mata_pelajaran,
        tentor,
        hari,
        jam,
        tentor_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        namaKelas,
        kelas_id,
        mata_pelajaran,
        tentor,
        hari,
        jam,
        tentor_id || null,
      ],
      async (err, result) => {
        if (err) {
          console.log("ERROR TAMBAH JADWAL:", err);

          return res.status(500).json({
            message: "Gagal menambahkan jadwal",
          });
        }

        // =====================================================
        // LOG AKTIVITAS
        // =====================================================

        try {
          await logAktivitas({
            user_id: req.user?.id,
            nama_user: req.user?.nama,
            role: req.user?.role,
            aktivitas: "Tambah Jadwal",
            keterangan:
              `Menambahkan jadwal ${mata_pelajaran} ` +
              `untuk kelas "${namaKelas}" ` +
              `dengan tentor "${tentor}" ` +
              `pada hari ${hari} pukul ${jam}.`,
          });
        } catch (logError) {
          console.error("GAGAL MENYIMPAN LOG TAMBAH JADWAL:", logError);
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        res.status(201).json({
          message: "Jadwal berhasil ditambah",
          id: result.insertId,
        });
      }
    );
  });
});

// =====================================================
// PUT UPDATE JADWAL
// =====================================================
router.put("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  const { kelas_id, mata_pelajaran, tentor, hari, jam, tentor_id } = req.body;

  // =====================================================
  // VALIDASI
  // =====================================================

  if (!kelas_id || !mata_pelajaran || !tentor || !hari || !jam) {
    return res.status(400).json({
      message: "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi",
      body_diterima: req.body,
    });
  }

  // =====================================================
  // CEK KELAS
  // =====================================================

  const sqlKelas = `
    SELECT nama_kelas
    FROM kelas
    WHERE id = ?
  `;

  db.query(sqlKelas, [kelas_id], (err, kelasResult) => {
    if (err) {
      console.log("ERROR CEK KELAS:", err);

      return res.status(500).json({
        message: "Gagal memeriksa kelas",
      });
    }

    if (kelasResult.length === 0) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan",
      });
    }

    const namaKelas = kelasResult[0].nama_kelas;

    // =====================================================
    // UPDATE JADWAL
    // =====================================================

    const sql = `
      UPDATE jadwal
      SET
        kelas = ?,
        kelas_id = ?,
        mata_pelajaran = ?,
        tentor = ?,
        hari = ?,
        jam = ?,
        tentor_id = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        namaKelas,
        kelas_id,
        mata_pelajaran,
        tentor,
        hari,
        jam,
        tentor_id || null,
        id,
      ],
      async (err, result) => {
        if (err) {
          console.log("ERROR UPDATE JADWAL:", err);

          return res.status(500).json({
            message: "Gagal mengupdate jadwal",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Jadwal tidak ditemukan",
          });
        }

        // =====================================================
        // LOG AKTIVITAS
        // =====================================================

        try {
          await logAktivitas({
            user_id: req.user?.id,
            nama_user: req.user?.nama,
            role: req.user?.role,
            aktivitas: "Update Jadwal",
            keterangan:
              `Mengubah jadwal ${mata_pelajaran} ` +
              `untuk kelas "${namaKelas}" ` +
              `dengan tentor "${tentor}" ` +
              `menjadi hari ${hari} pukul ${jam}.`,
          });
        } catch (logError) {
          console.error("GAGAL MENYIMPAN LOG UPDATE JADWAL:", logError);
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        res.json({
          message: "Jadwal berhasil diupdate",
        });
      }
    );
  });
});

// =====================================================
// DELETE JADWAL
// =====================================================
router.delete("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  // =====================================================
  // AMBIL DATA JADWAL TERLEBIH DAHULU
  // =====================================================

  const selectSql = `
    SELECT
      jadwal.*,
      kelas.nama_kelas
    FROM jadwal
    LEFT JOIN kelas
      ON kelas.id = jadwal.kelas_id
    WHERE jadwal.id = ?
  `;

  db.query(selectSql, [id], (err, jadwalResult) => {
    if (err) {
      console.log("ERROR CEK JADWAL DELETE:", err);

      return res.status(500).json({
        message: "Gagal mencari jadwal",
      });
    }

    if (jadwalResult.length === 0) {
      return res.status(404).json({
        message: "Jadwal tidak ditemukan",
      });
    }

    const jadwal = jadwalResult[0];

    // =====================================================
    // DELETE
    // =====================================================

    db.query("DELETE FROM jadwal WHERE id = ?", [id], async (err, result) => {
      if (err) {
        console.log("ERROR DELETE JADWAL:", err);

        return res.status(500).json({
          message: "Gagal menghapus jadwal",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Jadwal tidak ditemukan",
        });
      }

      // =====================================================
      // LOG AKTIVITAS
      // =====================================================

      try {
        await logAktivitas({
          user_id: req.user?.id,
          nama_user: req.user?.nama,
          role: req.user?.role,
          aktivitas: "Hapus Jadwal",
          keterangan:
            `Menghapus jadwal ${jadwal.mata_pelajaran} ` +
            `untuk kelas "${jadwal.nama_kelas || jadwal.kelas}" ` +
            `dengan tentor "${jadwal.tentor}" ` +
            `pada hari ${jadwal.hari} pukul ${jadwal.jam}.`,
        });
      } catch (logError) {
        console.error("GAGAL MENYIMPAN LOG DELETE JADWAL:", logError);
      }

      // =====================================================
      // RESPONSE
      // =====================================================

      res.json({
        message: "Jadwal dihapus",
      });
    });
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
