const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

// ================= Upload =================

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

// ================= GET =================

router.get("/", (req, res) => {
  db.query("SELECT * FROM about_section LIMIT 1", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result[0]);
  });
});

// ================= UPDATE =================

router.put("/:id", upload.single("image"), (req, res) => {
  const { title, description } = req.body;

  db.query(
    "SELECT * FROM about_section WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      let image = rows[0].image;

      if (req.file) {
        image = "/uploads/" + req.file.filename;
      }

      db.query(
        `UPDATE about_section
         SET title=?,description=?,image=?
         WHERE id=?`,
        [title, description, image, req.params.id],
        (err) => {
          if (err) return res.status(500).json(err);

          res.json({
            success: true,
            message: "About berhasil diupdate",
          });
        }
      );
    }
  );
});

module.exports = router;
