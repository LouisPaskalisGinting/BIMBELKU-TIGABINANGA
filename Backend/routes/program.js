const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================
// GET semua program
// ===============================
router.get("/", (req, res) => {
  db.query("SELECT * FROM program ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

// ===============================
// GET program aktif (untuk landing page)
// ===============================
router.get("/aktif", (req, res) => {
  db.query("SELECT * FROM program WHERE status='aktif'", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

// ===============================
// POST tambah program
// ===============================
router.post("/", (req, res) => {
  const {
    nama_program,
    deskripsi,
    harga,
    durasi,
    level,
    jumlah_pertemuan,
    gambar,
    status,
  } = req.body;

  db.query(
    "INSERT INTO program (nama_program, deskripsi, harga, durasi, level, jumlah_pertemuan, gambar, status) VALUES (?,?,?,?,?,?,?,?)",
    [
      nama_program,
      deskripsi,
      harga,
      durasi,
      level,
      jumlah_pertemuan,
      gambar,
      status,
    ],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Program berhasil ditambahkan" });
    }
  );
});

// ===============================
// PUT update program
// ===============================
router.put("/:id", (req, res) => {
  const id = req.params.id;

  db.query("UPDATE program SET ? WHERE id=?", [req.body, id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Program berhasil diupdate" });
  });
});

// ===============================
// DELETE program
// ===============================
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM program WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Program dihapus" });
  });
});

module.exports = router;
