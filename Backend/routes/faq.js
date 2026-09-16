const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================
// GET ALL FAQ
// ===============================
router.get("/", (req, res) => {
  db.query("SELECT * FROM faq ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

// ===============================
// GET FAQ BY ID
// ===============================
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM faq WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({
        message: "FAQ tidak ditemukan",
      });
    }

    res.json(result[0]);
  });
});

// ===============================
// TAMBAH FAQ
// ===============================
router.post("/", (req, res) => {
  const { question, answer } = req.body;

  db.query(
    "INSERT INTO faq(question,answer) VALUES(?,?)",
    [question, answer],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true,
        message: "FAQ berhasil ditambahkan",
      });
    }
  );
});

// ===============================
// EDIT FAQ
// ===============================
router.put("/:id", (req, res) => {
  const { question, answer } = req.body;

  db.query(
    `UPDATE faq
     SET question=?, answer=?
     WHERE id=?`,
    [question, answer, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true,
        message: "FAQ berhasil diperbarui",
      });
    }
  );
});

// ===============================
// DELETE FAQ
// ===============================
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM faq WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      success: true,
      message: "FAQ berhasil dihapus",
    });
  });
});

module.exports = router;
