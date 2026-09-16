const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");

// ===============================
// Folder Upload
// ===============================
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===============================
// Konfigurasi Multer
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, Date.now() + "-background" + ext);
  },
});

const upload = multer({ storage });

// ===============================
// GET Semua Background
// ===============================
router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM hero_slider
    ORDER BY urutan ASC, id ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GET BACKGROUND:", err);

      return res.status(500).json({
        message: "Gagal mengambil data background",
        error: err.message,
      });
    }

    res.json(result);
  });
});

// ===============================
// GET Background Aktif
// ===============================
router.get("/aktif", (req, res) => {
  const sql = `
    SELECT *
    FROM hero_slider
    WHERE status = 'aktif'
    ORDER BY urutan ASC, id ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GET BACKGROUND AKTIF:", err);

      return res.status(500).json({
        message: "Gagal mengambil background aktif",
        error: err.message,
      });
    }

    res.json(result);
  });
});

// ===============================
// TAMBAH Background
// ===============================
router.post("/", upload.single("gambar"), (req, res) => {
  const { urutan, status } = req.body;

  if (!req.file) {
    return res.status(400).json({
      message: "Gambar background wajib diupload",
    });
  }

  const gambar = "/uploads/" + req.file.filename;

  const sql = `
    INSERT INTO hero_slider
    (gambar, urutan, status)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [gambar, urutan || 0, status || "aktif"], (err, result) => {
    if (err) {
      console.error("ERROR INSERT BACKGROUND:", err);

      return res.status(500).json({
        message: "Gagal menambahkan background",
        error: err.message,
      });
    }

    res.status(201).json({
      message: "Background berhasil ditambahkan",
      id: result.insertId,
    });
  });
});

// ===============================
// UPDATE Background
// ===============================
router.put("/:id", upload.single("gambar"), (req, res) => {
  const { id } = req.params;
  const { urutan, status } = req.body;

  const getSql = `
    SELECT *
    FROM hero_slider
    WHERE id = ?
  `;

  db.query(getSql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Gagal mengambil data background",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Background tidak ditemukan",
      });
    }

    const oldData = result[0];

    let gambar = oldData.gambar;

    if (req.file) {
      gambar = "/uploads/" + req.file.filename;
    }

    const updateSql = `
      UPDATE hero_slider
      SET gambar = ?,
          urutan = ?,
          status = ?
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [gambar, urutan || 0, status || "aktif", id],
      (updateErr) => {
        if (updateErr) {
          console.error("ERROR UPDATE BACKGROUND:", updateErr);

          return res.status(500).json({
            message: "Gagal mengupdate background",
            error: updateErr.message,
          });
        }

        res.json({
          message: "Background berhasil diupdate",
        });
      }
    );
  });
});

// ===============================
// DELETE Background
// ===============================
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const getSql = `
    SELECT *
    FROM hero_slider
    WHERE id = ?
  `;

  db.query(getSql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Gagal mengambil data background",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Background tidak ditemukan",
      });
    }

    const gambar = result[0].gambar;

    const deleteSql = `
      DELETE FROM hero_slider
      WHERE id = ?
    `;

    db.query(deleteSql, [id], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({
          message: "Gagal menghapus background",
          error: deleteErr.message,
        });
      }

      // Hapus file gambar dari folder uploads
      if (gambar) {
        const filePath = path.join(__dirname, "..", gambar);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.json({
        message: "Background berhasil dihapus",
      });
    });
  });
});

module.exports = router;
