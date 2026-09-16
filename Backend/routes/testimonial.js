const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

// ================================
// Konfigurasi Upload
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// ======================================================
// GET Semua Testimoni
// ======================================================
router.get("/", (req, res) => {
  db.query("SELECT * FROM testimonial ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

// ======================================================
// GET Testimoni Berdasarkan ID
// ======================================================
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM testimonial WHERE id=?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(404).json({
          message: "Testimoni tidak ditemukan",
        });
      }

      res.json(result[0]);
    }
  );
});

// ======================================================
// Tambah Testimoni
// ======================================================
router.post("/", upload.single("foto"), (req, res) => {
  const { nama, asal_sekolah, universitas, pesan, signature } = req.body;

  let foto = "";

  if (req.file) {
    foto = "/uploads/" + req.file.filename;
  }

  db.query(
    `INSERT INTO testimonial
    (nama, asal_sekolah, universitas, pesan, signature, foto)
    VALUES(?,?,?,?,?,?)`,
    [nama, asal_sekolah, universitas, pesan, signature, foto],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true,
        message: "Testimoni berhasil ditambahkan",
      });
    }
  );
});

// ======================================================
// Edit Testimoni
// ======================================================
router.put("/:id", upload.single("foto"), (req, res) => {
  const { nama, asal_sekolah, universitas, pesan, signature } = req.body;

  db.query(
    "SELECT * FROM testimonial WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Data tidak ditemukan",
        });
      }

      let foto = rows[0].foto;

      if (req.file) {
        foto = "/uploads/" + req.file.filename;
      }

      db.query(
        `UPDATE testimonial
        SET
        nama=?,
        asal_sekolah=?,
        universitas=?,
        pesan=?,
        signature=?,
        foto=?
        WHERE id=?`,
        [
          nama,
          asal_sekolah,
          universitas,
          pesan,
          signature,
          foto,
          req.params.id,
        ],
        (err) => {
          if (err) return res.status(500).json(err);

          res.json({
            success: true,
            message: "Testimoni berhasil diperbarui",
          });
        }
      );
    }
  );
});

// ======================================================
// Hapus Testimoni
// ======================================================
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM testimonial WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      success: true,
      message: "Testimoni berhasil dihapus",
    });
  });
});

module.exports = router;
