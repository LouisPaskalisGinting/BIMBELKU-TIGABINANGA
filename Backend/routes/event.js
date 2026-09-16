const express = require("express");
const router = express.Router();
const db = require("../db");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// GET SEMUA EVENT
// =====================================================

router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM event
    ORDER BY tanggal ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GET EVENT:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data event",
      });
    }

    res.json(result);
  });
});

// =====================================================
// GET EVENT BERDASARKAN ID
// =====================================================

router.get("/:id", (req, res) => {
  const sql = `
    SELECT *
    FROM event
    WHERE id = ?
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("ERROR GET DETAIL EVENT:", err);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event tidak ditemukan",
      });
    }

    res.json(result[0]);
  });
});

// =====================================================
// TAMBAH EVENT
// =====================================================

router.post("/", authMiddleware, (req, res) => {
  const { judul, deskripsi, tanggal, waktu, lokasi } = req.body;

  // =====================================================
  // VALIDASI
  // =====================================================

  if (!judul || !tanggal || !waktu || !lokasi) {
    return res.status(400).json({
      success: false,
      message: "Judul, tanggal, waktu, dan lokasi wajib diisi",
    });
  }

  const sql = `
    INSERT INTO event
    (
      judul,
      deskripsi,
      tanggal,
      waktu,
      lokasi
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [judul, deskripsi || null, tanggal, waktu, lokasi];

  db.query(sql, values, async (err, result) => {
    if (err) {
      console.error("ERROR TAMBAH EVENT:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal menambahkan event",
      });
    }

    // =====================================================
    // SIMPAN LOG AKTIVITAS
    // =====================================================

    try {
      await logAktivitas({
        user_id: req.user?.id,
        nama_user: req.user?.nama,
        role: req.user?.role,
        aktivitas: "Menambahkan event",
        keterangan: `Menambahkan event "${judul}"`,
      });
    } catch (logError) {
      console.error("Gagal mencatat log tambah event:", logError);
    }

    return res.status(201).json({
      success: true,
      message: "Event berhasil ditambahkan",
      id: result.insertId,
    });
  });
});

// =====================================================
// EDIT EVENT
// =====================================================

router.put("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  const { judul, deskripsi, tanggal, waktu, lokasi } = req.body;

  // =====================================================
  // VALIDASI
  // =====================================================

  if (!judul || !tanggal || !waktu || !lokasi) {
    return res.status(400).json({
      success: false,
      message: "Judul, tanggal, waktu, dan lokasi wajib diisi",
    });
  }

  // =====================================================
  // CEK EVENT TERLEBIH DAHULU
  // =====================================================

  const checkSql = `
    SELECT *
    FROM event
    WHERE id = ?
  `;

  db.query(checkSql, [id], (err, eventResult) => {
    if (err) {
      console.error("ERROR CEK EVENT:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal memeriksa event",
      });
    }

    if (eventResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event tidak ditemukan",
      });
    }

    const eventLama = eventResult[0];

    // =====================================================
    // UPDATE EVENT
    // =====================================================

    const sql = `
      UPDATE event
      SET
        judul = ?,
        deskripsi = ?,
        tanggal = ?,
        waktu = ?,
        lokasi = ?
      WHERE id = ?
    `;

    const values = [judul, deskripsi || null, tanggal, waktu, lokasi, id];

    db.query(sql, values, async (err, result) => {
      if (err) {
        console.error("ERROR UPDATE EVENT:", err);

        return res.status(500).json({
          success: false,
          message: "Gagal memperbarui event",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Event tidak ditemukan",
        });
      }

      // =====================================================
      // SIMPAN LOG AKTIVITAS
      // =====================================================

      try {
        await logAktivitas({
          user_id: req.user?.id,
          nama_user: req.user?.nama,
          role: req.user?.role,
          aktivitas: "Mengubah event",
          keterangan: `Mengubah event "${eventLama.judul}" menjadi "${judul}"`,
        });
      } catch (logError) {
        console.error("Gagal mencatat log update event:", logError);
      }

      return res.json({
        success: true,
        message: "Event berhasil diperbarui",
      });
    });
  });
});

// =====================================================
// HAPUS EVENT
// =====================================================

router.delete("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  // =====================================================
  // CEK EVENT SEBELUM DIHAPUS
  // =====================================================

  const checkSql = `
    SELECT *
    FROM event
    WHERE id = ?
  `;

  db.query(checkSql, [id], (err, eventResult) => {
    if (err) {
      console.error("ERROR CEK EVENT DELETE:", err);

      return res.status(500).json({
        success: false,
        message: "Gagal memeriksa event",
      });
    }

    if (eventResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event tidak ditemukan",
      });
    }

    const event = eventResult[0];

    // =====================================================
    // DELETE EVENT
    // =====================================================

    const sql = `
      DELETE FROM event
      WHERE id = ?
    `;

    db.query(sql, [id], async (err, result) => {
      if (err) {
        console.error("ERROR DELETE EVENT:", err);

        return res.status(500).json({
          success: false,
          message: "Gagal menghapus event",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Event tidak ditemukan",
        });
      }

      // =====================================================
      // SIMPAN LOG AKTIVITAS
      // =====================================================

      try {
        await logAktivitas({
          user_id: req.user?.id,
          nama_user: req.user?.nama,
          role: req.user?.role,
          aktivitas: "Menghapus event",
          keterangan: `Menghapus event "${event.judul}"`,
        });
      } catch (logError) {
        console.error("Gagal mencatat log delete event:", logError);
      }

      return res.json({
        success: true,
        message: "Event berhasil dihapus",
      });
    });
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
