const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

// =========================
// Upload
// =========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
});

// =========================
// GET
// =========================

router.get("/", (req, res) => {
  db.query("SELECT * FROM galeri ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

// =========================
// POST
// =========================

router.post("/", upload.single("gambar"), (req, res) => {
  const { judul, deskripsi } = req.body;

  let gambar = "";

  if (req.file) {
    gambar = "/uploads/" + req.file.filename;
  }

  db.query(
    `INSERT INTO galeri
    (judul,deskripsi,gambar)
    VALUES(?,?,?)`,
    [judul, deskripsi, gambar],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Galeri berhasil ditambahkan",
      });
    }
  );
});

// =========================
// PUT
// =========================

router.put("/:id", upload.single("gambar"), (req, res) => {
  const { judul, deskripsi } = req.body;

  db.query("SELECT * FROM galeri WHERE id=?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(err);

    let gambar = rows[0].gambar;

    if (req.file) {
      gambar = "/uploads/" + req.file.filename;
    }

    db.query(
      `UPDATE galeri
        SET
        judul=?,
        deskripsi=?,
        gambar=?
        WHERE id=?`,
      [judul, deskripsi, gambar, req.params.id],
      (err) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Galeri berhasil diperbarui",
        });
      }
    );
  });
});

// =========================
// DELETE
// =========================

router.delete("/:id", (req, res) => {
  db.query("DELETE FROM galeri WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Galeri berhasil dihapus",
    });
  });
});

module.exports = router;
