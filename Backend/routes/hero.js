const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================
// Konfigurasi Upload
// ======================
const uploadDir = path.join(__dirname, "../uploads");

// Pastikan folder uploads tersedia
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-hero" + path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ======================================================
//                     HERO SECTION
// ======================================================

// ======================
// GET HERO
// ======================
router.get("/", (req, res) => {
  db.query("SELECT * FROM hero_section LIMIT 1", (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.json({});
    }

    res.json(result[0]);
  });
});

// ======================
// UPDATE HERO
// ======================
router.put("/:id", upload.single("background"), (req, res) => {
  const { title, subtitle, button_text } = req.body;

  let background = null;

  // Jika admin mengupload background baru
  if (req.file) {
    background = "/uploads/" + req.file.filename;
  }

  db.query(
    "SELECT * FROM hero_section WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json(err);
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Data tidak ditemukan",
        });
      }

      // Jika tidak ada file baru,
      // gunakan background lama
      if (!background) {
        background = rows[0].background;
      }

      db.query(
        `UPDATE hero_section
           SET
             title=?,
             subtitle=?,
             button_text=?,
             background=?
           WHERE id=?`,
        [title, subtitle, button_text, background, req.params.id],
        (err) => {
          if (err) {
            return res.status(500).json(err);
          }

          res.json({
            success: true,
            message: "Hero berhasil diperbarui",
          });
        }
      );
    }
  );
});

// ======================================================
//                  HERO BACKGROUND SLIDER
// ======================================================

// ======================
// GET SEMUA BACKGROUND
// ======================
router.get("/background", (req, res) => {
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

// ======================
// GET BACKGROUND AKTIF
// ======================
router.get("/background/aktif", (req, res) => {
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

// ======================
// TAMBAH BACKGROUND
// ======================
router.post("/background", upload.single("gambar"), (req, res) => {
  const { urutan, status } = req.body;

  // Validasi gambar
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
      success: true,
      message: "Background berhasil ditambahkan",
      id: result.insertId,
    });
  });
});

// ======================
// UPDATE BACKGROUND
// ======================
router.put("/background/:id", upload.single("gambar"), (req, res) => {
  const { id } = req.params;
  const { urutan, status } = req.body;

  // Ambil data lama
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

    // Gunakan gambar lama
    // jika tidak ada gambar baru
    let gambar = oldData.gambar;

    if (req.file) {
      gambar = "/uploads/" + req.file.filename;
    }

    const updateSql = `
          UPDATE hero_slider
          SET
            gambar=?,
            urutan=?,
            status=?
          WHERE id=?
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
          success: true,
          message: "Background berhasil diupdate",
        });
      }
    );
  });
});

// ======================
// DELETE BACKGROUND
// ======================
router.delete("/background/:id", (req, res) => {
  const { id } = req.params;

  // Ambil data background terlebih dahulu
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

    // Hapus data dari database
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

      // Hapus file gambar
      if (gambar) {
        const filePath = path.join(__dirname, "..", gambar);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.json({
        success: true,
        message: "Background berhasil dihapus",
      });
    });
  });
});

module.exports = router;
