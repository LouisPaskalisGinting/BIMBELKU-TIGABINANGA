const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// GET SEMUA TENTOR
// =====================================================

router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM tentor
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("ERROR GET TENTOR:", err);

      return res.status(500).json({
        message: "Gagal mengambil data tentor",
      });
    }

    res.json(result);
  });
});

// =====================================================
// GET TENTOR BERDASARKAN ID
// =====================================================

router.get("/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT *
    FROM tentor
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log("ERROR GET DETAIL TENTOR:", err);

      return res.status(500).json({
        message: "Gagal mengambil detail tentor",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Tentor tidak ditemukan",
      });
    }

    res.json(result[0]);
  });
});

// =====================================================
// POST TAMBAH TENTOR + AKUN LOGIN
// =====================================================

router.post("/", authMiddleware, async (req, res) => {
  console.log("DATA TENTOR MASUK:", req.body);

  const { nama, mapel, status, no_hp, email, password } = req.body;

  try {
    // =================================================
    // VALIDASI
    // =================================================

    if (!nama || !mapel || !email || !password) {
      return res.status(400).json({
        message: "Nama, mata pelajaran, email, dan password wajib diisi",
      });
    }

    const emailFix = email.trim().toLowerCase();
    const namaFix = nama.trim();

    // =================================================
    // CEK EMAIL USER
    // =================================================

    db.query(
      "SELECT id FROM user WHERE email = ?",
      [emailFix],
      async (err, result) => {
        if (err) {
          console.log("ERROR CEK EMAIL:", err);

          return res.status(500).json({
            message: "Gagal memeriksa email",
          });
        }

        if (result.length > 0) {
          return res.status(400).json({
            message: "Email sudah digunakan!",
          });
        }

        try {
          // =============================================
          // HASH PASSWORD
          // =============================================

          const hashedPassword = await bcrypt.hash(password, 10);

          // =============================================
          // INSERT USER
          // =============================================

          const userSql = `
            INSERT INTO user
            (nama, email, password, role)
            VALUES (?, ?, ?, ?)
          `;

          db.query(
            userSql,
            [namaFix, emailFix, hashedPassword, "tentor"],
            (err, userResult) => {
              if (err) {
                console.log("ERROR INSERT USER:", err);

                return res.status(500).json({
                  message: "Gagal membuat akun tentor",
                });
              }

              const userId = userResult.insertId;

              // =========================================
              // INSERT TENTOR
              // =========================================

              const tentorSql = `
                INSERT INTO tentor
                (
                  user_id,
                  nama,
                  mapel,
                  status,
                  no_hp,
                  email,
                  password
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `;

              db.query(
                tentorSql,
                [
                  userId,
                  namaFix,
                  mapel,
                  status || "Aktif",
                  no_hp || null,
                  emailFix,
                  hashedPassword,
                ],
                async (err, tentorResult) => {
                  if (err) {
                    console.log("ERROR INSERT TENTOR:", err);

                    // Hapus user jika insert tentor gagal
                    db.query(
                      "DELETE FROM user WHERE id = ?",
                      [userId],
                      () => {}
                    );

                    return res.status(500).json({
                      message: "Gagal menambahkan data tentor",
                    });
                  }

                  console.log("TENTOR BERHASIL DITAMBAHKAN");

                  // =====================================
                  // LOG AKTIVITAS
                  // =====================================

                  const adminId = req.user?.id || null;
                  const adminNama = req.user?.nama || "Admin";
                  const adminRole = req.user?.role || "admin";

                  try {
                    await logAktivitas({
                      user_id: adminId,
                      nama_user: adminNama,
                      role: adminRole,
                      aktivitas: "Menambahkan tentor",
                      keterangan: `Admin menambahkan tentor "${namaFix}" dengan mata pelajaran "${mapel}".`,
                    });

                    console.log("LOG TAMBAH TENTOR BERHASIL");
                  } catch (logError) {
                    console.error(
                      "GAGAL MENYIMPAN LOG TAMBAH TENTOR:",
                      logError
                    );
                  }

                  // =====================================
                  // RESPONSE
                  // =====================================

                  return res.status(201).json({
                    message: "Tentor berhasil ditambahkan dan dapat login",
                    id: tentorResult.insertId,
                  });
                }
              );
            }
          );
        } catch (error) {
          console.log("ERROR HASH PASSWORD:", error);

          return res.status(500).json({
            message: "Gagal memproses password",
          });
        }
      }
    );
  } catch (error) {
    console.log("ERROR SERVER TENTOR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// UPDATE TENTOR
// =====================================================

router.put("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  const { nama, mapel, status, no_hp, email } = req.body;

  // ===================================================
  // VALIDASI
  // ===================================================

  if (!nama || !mapel || !email) {
    return res.status(400).json({
      message: "Nama, mata pelajaran, dan email wajib diisi",
    });
  }

  // ===================================================
  // AMBIL DATA LAMA
  // ===================================================

  db.query("SELECT * FROM tentor WHERE id = ?", [id], (err, tentorResult) => {
    if (err) {
      console.log("ERROR CEK TENTOR:", err);

      return res.status(500).json({
        message: "Gagal mengambil data tentor",
      });
    }

    if (tentorResult.length === 0) {
      return res.status(404).json({
        message: "Tentor tidak ditemukan",
      });
    }

    const tentorLama = tentorResult[0];

    // =================================================
    // UPDATE DATA TENTOR
    // =================================================

    const sql = `
        UPDATE tentor
        SET
          nama = ?,
          mapel = ?,
          status = ?,
          no_hp = ?,
          email = ?
        WHERE id = ?
      `;

    db.query(
      sql,
      [
        nama.trim(),
        mapel,
        status || "Aktif",
        no_hp || null,
        email.trim().toLowerCase(),
        id,
      ],
      async (err, result) => {
        if (err) {
          console.log("ERROR UPDATE TENTOR:", err);

          return res.status(500).json({
            message: "Gagal mengupdate tentor",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Tentor tidak ditemukan",
          });
        }

        // =============================================
        // LOG AKTIVITAS
        // =============================================

        const adminId = req.user?.id || null;
        const adminNama = req.user?.nama || "Admin";
        const adminRole = req.user?.role || "admin";

        try {
          await logAktivitas({
            user_id: adminId,
            nama_user: adminNama,
            role: adminRole,
            aktivitas: "Mengubah data tentor",
            keterangan: `Admin mengubah data tentor "${
              tentorLama.nama
            }" menjadi "${nama.trim()}".`,
          });

          console.log("LOG UPDATE TENTOR BERHASIL");
        } catch (logError) {
          console.error("GAGAL MENYIMPAN LOG UPDATE TENTOR:", logError);
        }

        // =============================================
        // RESPONSE
        // =============================================

        return res.json({
          message: "Tentor berhasil diupdate",
        });
      }
    );
  });
});

// =====================================================
// DELETE TENTOR
// =====================================================

router.delete("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;

  // ===================================================
  // AMBIL DATA TENTOR
  // ===================================================

  db.query("SELECT * FROM tentor WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.log("ERROR SELECT TENTOR:", err);

      return res.status(500).json({
        message: "Gagal mencari tentor",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Tentor tidak ditemukan",
      });
    }

    const tentor = result[0];
    const userId = tentor.user_id;

    // =================================================
    // HAPUS TENTOR
    // =================================================

    db.query("DELETE FROM tentor WHERE id = ?", [id], (err) => {
      if (err) {
        console.log("ERROR DELETE TENTOR:", err);

        return res.status(500).json({
          message: "Gagal menghapus tentor",
        });
      }

      // =============================================
      // FUNGSI SIMPAN LOG
      // =============================================

      const simpanLogDanResponse = async () => {
        const adminId = req.user?.id || null;
        const adminNama = req.user?.nama || "Admin";
        const adminRole = req.user?.role || "admin";

        try {
          await logAktivitas({
            user_id: adminId,
            nama_user: adminNama,
            role: adminRole,
            aktivitas: "Menghapus tentor",
            keterangan: `Admin menghapus tentor "${tentor.nama}" dengan email "${tentor.email}".`,
          });

          console.log("LOG DELETE TENTOR BERHASIL");
        } catch (logError) {
          console.error("GAGAL MENYIMPAN LOG DELETE TENTOR:", logError);
        }

        return res.json({
          message: userId
            ? "Tentor dan akun user berhasil dihapus"
            : "Tentor berhasil dihapus",
        });
      };

      // =============================================
      // HAPUS USER
      // =============================================

      if (userId) {
        db.query(
          "DELETE FROM user WHERE id = ? AND role = 'tentor'",
          [userId],
          async (err) => {
            if (err) {
              console.log("ERROR DELETE USER:", err);

              return res.status(500).json({
                message: "Data tentor terhapus tetapi akun user gagal dihapus",
              });
            }

            await simpanLogDanResponse();
          }
        );
      } else {
        simpanLogDanResponse();
      }
    });
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
