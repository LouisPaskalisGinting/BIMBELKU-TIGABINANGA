const express = require("express");
const router = express.Router();
const db = require("../db");

// ========================
// GET
// ========================

router.get("/", (req, res) => {
  db.query("SELECT * FROM kontak LIMIT 1", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result[0]);
  });
});

// ========================
// UPDATE
// ========================

router.put("/:id", (req, res) => {
  const {
    nama_bimbel,
    alamat,
    telepon,
    whatsapp,
    email,
    instagram,
    facebook,
    youtube,
    maps,
  } = req.body;

  db.query(
    `UPDATE kontak
        SET
        nama_bimbel=?,
        alamat=?,
        telepon=?,
        whatsapp=?,
        email=?,
        instagram=?,
        facebook=?,
        youtube=?,
        maps=?
        WHERE id=?`,

    [
      nama_bimbel,
      alamat,
      telepon,
      whatsapp,
      email,
      instagram,
      facebook,
      youtube,
      maps,
      req.params.id,
    ],

    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Kontak berhasil diperbarui",
      });
    }
  );
});

module.exports = router;
