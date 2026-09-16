const express = require("express");
const router = express.Router();

const db = require("../db");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// GET SEMUA PENGUMUMAN
// =====================================================

router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM pengumuman
    ORDER BY tanggal DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GET PENGUMUMAN:", err);

      return res.status(500).json({
        message: "Gagal mengambil data pengumuman",
      });
    }

    res.json(result);
  });
});

// =====================================================
// GET PENGUMUMAN BERDASARKAN ID
// =====================================================

router.get("/:id", (req, res) => {
  const sql = `
    SELECT *
    FROM pengumuman
    WHERE id = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("ERROR GET DETAIL PENGUMUMAN:", err);

      return res.status(500).json({
        message: "Gagal mengambil detail pengumuman",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan",
      });
    }

    res.json(result[0]);
  });
});

// =====================================================
// POST TAMBAH PENGUMUMAN
// =====================================================

router.post("/", authMiddleware, (req, res) => {
  const { judul, isi } = req.body;

  // ===============================
  // VALIDASI
  // ===============================

  if (!judul || !isi) {
    return res.status(400).json({
      message: "Judul dan isi pengumuman wajib diisi",
    });
  }

  const judulFix = judul.trim();
  const isiFix = isi.trim();

  if (!judulFix || !isiFix) {
    return res.status(400).json({
      message: "Judul dan isi pengumuman tidak boleh kosong",
    });
  }

  // ===============================
  // INSERT
  // ===============================

  const sql = `
    INSERT INTO pengumuman
    (judul, isi)
    VALUES (?, ?)
  `;

  db.query(sql, [judulFix, isiFix], async (err, result) => {
    if (err) {
      console.error("ERROR TAMBAH PENGUMUMAN:", err);

      return res.status(500).json({
        message: "Gagal menambahkan pengumuman",
      });
    }

    // ===============================
    // LOG AKTIVITAS
    // ===============================

    try {
      await logAktivitas({
        user_id: req.user?.id,
        nama_user: req.user?.nama || req.user?.name || "-",
        role: req.user?.role || "-",
        aktivitas: "Menambahkan pengumuman",
        keterangan: `Menambahkan pengumuman "${judulFix}"`,
      });
    } catch (logError) {
      console.error("Gagal mencatat log aktivitas:", logError);
    }

    res.status(201).json({
      message: "Pengumuman berhasil ditambahkan",
      id: result.insertId,
    });
  });
});

// =====================================================
// PUT EDIT PENGUMUMAN
// =====================================================

router.put("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  const { judul, isi } = req.body;

  // ===============================
  // VALIDASI
  // ===============================

  if (!judul || !isi) {
    return res.status(400).json({
      message: "Judul dan isi pengumuman wajib diisi",
    });
  }

  const judulFix = judul.trim();
  const isiFix = isi.trim();

  if (!judulFix || !isiFix) {
    return res.status(400).json({
      message: "Judul dan isi pengumuman tidak boleh kosong",
    });
  }

  // ===============================
  // CEK DATA
  // ===============================

  db.query("SELECT * FROM pengumuman WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("ERROR CEK PENGUMUMAN:", err);

      return res.status(500).json({
        message: "Gagal mencari pengumuman",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan",
      });
    }

    const judulLama = result[0].judul;

    // ===============================
    // UPDATE
    // ===============================

    const sql = `
        UPDATE pengumuman
        SET
          judul = ?,
          isi = ?
        WHERE id = ?
      `;

    db.query(sql, [judulFix, isiFix, id], async (err, updateResult) => {
      if (err) {
        console.error("ERROR UPDATE PENGUMUMAN:", err);

        return res.status(500).json({
          message: "Gagal mengupdate pengumuman",
        });
      }

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          message: "Pengumuman tidak ditemukan",
        });
      }

      // ===============================
      // LOG AKTIVITAS
      // ===============================

      try {
        await logAktivitas({
          user_id: req.user?.id,
          nama_user: req.user?.nama || req.user?.name || "-",
          role: req.user?.role || "-",
          aktivitas: "Mengedit pengumuman",
          keterangan: `Mengedit pengumuman "${judulLama}" menjadi "${judulFix}"`,
        });
      } catch (logError) {
        console.error("Gagal mencatat log aktivitas:", logError);
      }

      res.json({
        message: "Pengumuman berhasil diupdate",
      });
    });
  });
});

// =====================================================
// DELETE PENGUMUMAN
// =====================================================

router.delete("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  // ===============================
  // CARI PENGUMUMAN
  // ===============================

  db.query("SELECT * FROM pengumuman WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("ERROR CEK PENGUMUMAN:", err);

      return res.status(500).json({
        message: "Gagal mencari pengumuman",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan",
      });
    }

    const judulPengumuman = result[0].judul;

    // ===============================
    // DELETE
    // ===============================

    db.query(
      "DELETE FROM pengumuman WHERE id = ?",
      [id],
      async (err, deleteResult) => {
        if (err) {
          console.error("ERROR DELETE PENGUMUMAN:", err);

          return res.status(500).json({
            message: "Gagal menghapus pengumuman",
          });
        }

        if (deleteResult.affectedRows === 0) {
          return res.status(404).json({
            message: "Pengumuman tidak ditemukan",
          });
        }

        // ===============================
        // LOG AKTIVITAS
        // ===============================

        try {
          await logAktivitas({
            user_id: req.user?.id,
            nama_user: req.user?.nama || req.user?.name || "-",
            role: req.user?.role || "-",
            aktivitas: "Menghapus pengumuman",
            keterangan: `Menghapus pengumuman "${judulPengumuman}"`,
          });
        } catch (logError) {
          console.error("Gagal mencatat log aktivitas:", logError);
        }

        res.json({
          message: "Pengumuman berhasil dihapus",
        });
      }
    );
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
