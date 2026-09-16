const express = require("express");
const router = express.Router();
const db = require("../db");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// ========================================
// GET SEMUA KELAS
// ========================================
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      kelas.id, 
      kelas.nama_kelas, 
      kelas.program_id, 
      program.nama_program 
    FROM kelas 
    LEFT JOIN program 
      ON kelas.program_id = program.id 
    ORDER BY kelas.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GET KELAS:", err);

      return res.status(500).json({
        message: "Gagal mengambil data kelas",
      });
    }

    res.json(result);
  });
});

// ========================================
// GET KELAS BERDASARKAN ID
// ========================================
router.get("/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT 
      kelas.id, 
      kelas.nama_kelas, 
      kelas.program_id, 
      program.nama_program 
    FROM kelas 
    LEFT JOIN program 
      ON kelas.program_id = program.id 
    WHERE kelas.id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("ERROR GET DETAIL KELAS:", err);

      return res.status(500).json({
        message: "Gagal mengambil detail kelas",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan",
      });
    }

    res.json(result[0]);
  });
});

// ========================================
// TAMBAH KELAS
// ========================================
router.post("/", authMiddleware, (req, res) => {
  const { nama_kelas, program_id } = req.body;

  // ========================================
  // VALIDASI
  // ========================================
  if (!nama_kelas || !program_id) {
    return res.status(400).json({
      message: "Nama kelas dan program wajib diisi",
    });
  }

  const namaKelas = nama_kelas.trim();

  if (namaKelas === "") {
    return res.status(400).json({
      message: "Nama kelas tidak boleh kosong",
    });
  }

  // ========================================
  // CEK NAMA KELAS DUPLIKAT
  // ========================================
  const checkSql = `
    SELECT id
    FROM kelas
    WHERE LOWER(TRIM(nama_kelas)) = LOWER(?)
  `;

  db.query(checkSql, [namaKelas], (err, result) => {
    if (err) {
      console.error("ERROR CEK KELAS:", err);

      return res.status(500).json({
        message: "Gagal memeriksa nama kelas",
      });
    }

    if (result.length > 0) {
      return res.status(400).json({
        message: "Nama kelas sudah digunakan. Silakan gunakan nama kelas lain.",
      });
    }

    // ========================================
    // INSERT KELAS
    // ========================================
    const sql = `
      INSERT INTO kelas 
      (
        nama_kelas, 
        program_id
      )
      VALUES (?, ?)
    `;

    db.query(sql, [namaKelas, program_id], async (err, result) => {
      if (err) {
        console.error("ERROR TAMBAH KELAS:", err);

        return res.status(500).json({
          message: "Gagal menambahkan kelas",
        });
      }

      // ========================================
      // AMBIL NAMA PROGRAM
      // ========================================
      db.query(
        "SELECT nama_program FROM program WHERE id = ?",
        [program_id],
        async (err, programResult) => {
          let namaProgram = "-";

          if (!err && programResult.length > 0) {
            namaProgram = programResult[0].nama_program;
          }

          // ========================================
          // SIMPAN LOG AKTIVITAS
          // ========================================
          try {
            await logAktivitas({
              user_id: req.user.id,
              nama_user: req.user.nama,
              role: req.user.role,
              aktivitas: "Tambah Kelas",
              keterangan: `Menambahkan kelas "${namaKelas}" pada program "${namaProgram}"`,
            });

            console.log("LOG TAMBAH KELAS BERHASIL");
          } catch (logError) {
            console.error("GAGAL MENYIMPAN LOG TAMBAH KELAS:", logError);
          }

          return res.status(201).json({
            message: "Kelas berhasil ditambahkan",
            id: result.insertId,
          });
        }
      );
    });
  });
});

// ========================================
// UPDATE KELAS
// ========================================
router.put("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  const { nama_kelas, program_id } = req.body;

  // ========================================
  // VALIDASI
  // ========================================
  if (!nama_kelas || !program_id) {
    return res.status(400).json({
      message: "Nama kelas dan program wajib diisi",
    });
  }

  const namaKelas = nama_kelas.trim();

  if (namaKelas === "") {
    return res.status(400).json({
      message: "Nama kelas tidak boleh kosong",
    });
  }

  // ========================================
  // AMBIL DATA KELAS LAMA
  // ========================================
  const oldSql = `
    SELECT 
      kelas.nama_kelas,
      kelas.program_id,
      program.nama_program
    FROM kelas
    LEFT JOIN program
      ON kelas.program_id = program.id
    WHERE kelas.id = ?
  `;

  db.query(oldSql, [id], (err, oldResult) => {
    if (err) {
      console.error("ERROR CEK DATA KELAS LAMA:", err);

      return res.status(500).json({
        message: "Gagal mengambil data kelas",
      });
    }

    if (oldResult.length === 0) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan",
      });
    }

    const kelasLama = oldResult[0];

    // ========================================
    // CEK NAMA DUPLIKAT
    // ========================================
    const checkSql = `
      SELECT id
      FROM kelas
      WHERE LOWER(TRIM(nama_kelas)) = LOWER(?)
      AND id != ?
    `;

    db.query(checkSql, [namaKelas, id], (err, result) => {
      if (err) {
        console.error("ERROR CEK DUPLIKAT KELAS:", err);

        return res.status(500).json({
          message: "Gagal memeriksa nama kelas",
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          message: "Nama kelas sudah digunakan oleh kelas lain.",
        });
      }

      // ========================================
      // UPDATE
      // ========================================
      const sql = `
        UPDATE kelas
        SET
          nama_kelas = ?,
          program_id = ?
        WHERE id = ?
      `;

      db.query(sql, [namaKelas, program_id, id], (err, result) => {
        if (err) {
          console.error("ERROR UPDATE KELAS:", err);

          return res.status(500).json({
            message: "Gagal mengupdate kelas",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Kelas tidak ditemukan",
          });
        }

        // ========================================
        // AMBIL PROGRAM BARU
        // ========================================
        db.query(
          "SELECT nama_program FROM program WHERE id = ?",
          [program_id],
          async (err, programResult) => {
            let namaProgramBaru = "-";

            if (!err && programResult.length > 0) {
              namaProgramBaru = programResult[0].nama_program;
            }

            // ========================================
            // SIMPAN LOG AKTIVITAS
            // ========================================
            try {
              await logAktivitas({
                user_id: req.user.id,
                nama_user: req.user.nama,
                role: req.user.role,
                aktivitas: "Edit Kelas",
                keterangan:
                  `Mengubah kelas "${kelasLama.nama_kelas}" ` +
                  `menjadi "${namaKelas}" ` +
                  `pada program "${namaProgramBaru}"`,
              });

              console.log("LOG UPDATE KELAS BERHASIL");
            } catch (logError) {
              console.error("GAGAL MENYIMPAN LOG UPDATE KELAS:", logError);
            }

            return res.json({
              message: "Kelas berhasil diupdate",
            });
          }
        );
      });
    });
  });
});

// ========================================
// DELETE KELAS
// ========================================
router.delete("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  // ========================================
  // AMBIL DATA KELAS SEBELUM DIHAPUS
  // ========================================
  const selectSql = `
    SELECT
      kelas.nama_kelas,
      program.nama_program
    FROM kelas
    LEFT JOIN program
      ON kelas.program_id = program.id
    WHERE kelas.id = ?
  `;

  db.query(selectSql, [id], (err, result) => {
    if (err) {
      console.error("ERROR CEK KELAS SEBELUM DELETE:", err);

      return res.status(500).json({
        message: "Gagal mencari data kelas",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan",
      });
    }

    const kelas = result[0];

    // ========================================
    // DELETE KELAS
    // ========================================
    const deleteSql = `
      DELETE FROM kelas
      WHERE id = ?
    `;

    db.query(deleteSql, [id], async (err, deleteResult) => {
      if (err) {
        console.error("ERROR DELETE KELAS:", err);

        return res.status(500).json({
          message: "Gagal menghapus kelas",
        });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({
          message: "Kelas tidak ditemukan",
        });
      }

      // ========================================
      // SIMPAN LOG AKTIVITAS
      // ========================================
      try {
        await logAktivitas({
          user_id: req.user.id,
          nama_user: req.user.nama,
          role: req.user.role,
          aktivitas: "Hapus Kelas",
          keterangan:
            `Menghapus kelas "${kelas.nama_kelas}" ` +
            `dari program "${kelas.nama_program || "-"}"`,
        });

        console.log("LOG DELETE KELAS BERHASIL");
      } catch (logError) {
        console.error("GAGAL MENYIMPAN LOG DELETE KELAS:", logError);
      }

      return res.json({
        message: "Kelas berhasil dihapus",
      });
    });
  });
});

// ========================================
// EXPORT ROUTER
// ========================================
module.exports = router;
