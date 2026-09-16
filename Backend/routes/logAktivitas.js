const express = require("express");
const router = express.Router();

const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// GET SEMUA LOG AKTIVITAS
// =====================================================

router.get("/", authMiddleware, (req, res) => {
  const sql = `
          SELECT
            id,
            user_id,
            nama_user,
            role,
            aktivitas,
            keterangan,
            tanggal
          FROM log_aktivitas
          ORDER BY tanggal DESC, id DESC
        `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GET LOG AKTIVITAS:", err);

      return res.status(500).json({
        message: "Gagal mengambil data log aktivitas",
        error: err.message,
      });
    }

    return res.status(200).json(result);
  });
});

// =====================================================
// GET DETAIL LOG AKTIVITAS BERDASARKAN ID
// =====================================================

router.get("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  const sql = `
      SELECT
        id,
        user_id,
        nama_user,
        role,
        aktivitas,
        keterangan,
        tanggal
      FROM log_aktivitas
      WHERE id = ?
      LIMIT 1
    `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("ERROR GET DETAIL LOG:", err);

      return res.status(500).json({
        message: "Gagal mengambil detail log aktivitas",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Log aktivitas tidak ditemukan",
      });
    }

    return res.status(200).json(result[0]);
  });
});

// =====================================================
// GET LOG BERDASARKAN USER
// =====================================================

router.get("/user/:userId", authMiddleware, (req, res) => {
  const userId = req.params.userId;

  const sql = `
      SELECT
        id,
        user_id,
        nama_user,
        role,
        aktivitas,
        keterangan,
        tanggal
      FROM log_aktivitas
      WHERE user_id = ?
      ORDER BY tanggal DESC, id DESC
    `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("ERROR GET LOG USER:", err);

      return res.status(500).json({
        message: "Gagal mengambil log aktivitas user",
        error: err.message,
      });
    }

    return res.status(200).json(result);
  });
});

// =====================================================
// DELETE LOG BERDASARKAN ID
// =====================================================

router.delete("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  // Hanya admin yang boleh menghapus log
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Hanya admin yang dapat menghapus log aktivitas",
    });
  }

  const sql = `
      DELETE FROM log_aktivitas
      WHERE id = ?
    `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("ERROR DELETE LOG:", err);

      return res.status(500).json({
        message: "Gagal menghapus log aktivitas",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Log aktivitas tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Log aktivitas berhasil dihapus",
    });
  });
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
