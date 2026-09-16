const express = require("express");
const router = express.Router();

const db = require("../db");
const bcrypt = require("bcryptjs");

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

const authMiddleware = require("../middleware/authMiddleware");

// ======================================================
// HELPER
// ======================================================

const isMaster = (user) => {
  return Number(user?.is_master) === 1;
};

// ======================================================
// GET SEMUA ADMIN
// ======================================================

router.get("/", authMiddleware, (req, res) => {
  const sql = `
    SELECT
      id,
      nama,
      email,
      role,
      is_master
    FROM user
    WHERE role = 'admin'
    ORDER BY is_master DESC, id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("ERROR GET ADMIN:", err);

      return res.status(500).json({
        message: "Gagal mengambil data admin",
      });
    }

    return res.json(result);
  });
});

// ======================================================
// GET ADMIN BERDASARKAN ID
// ======================================================

router.get("/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      id,
      nama,
      email,
      role,
      is_master
    FROM user
    WHERE id = ?
      AND role = 'admin'
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log("ERROR GET ADMIN BY ID:", err);

      return res.status(500).json({
        message: "Gagal mengambil data admin",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Admin tidak ditemukan",
      });
    }

    return res.json(result[0]);
  });
});

// ======================================================
// TAMBAH ADMIN
// ======================================================
//
// Hanya Admin Master yang boleh menambahkan admin baru.
// ======================================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    // --------------------------------------------------
    // CEK ADMIN MASTER
    // --------------------------------------------------

    if (!isMaster(req.user)) {
      return res.status(403).json({
        message:
          "Akses ditolak. Hanya Admin Master yang dapat menambahkan admin.",
      });
    }

    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({
        message: "Semua field wajib diisi",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter",
      });
    }

    const namaBersih = nama.trim();
    const emailBersih = email.trim().toLowerCase();

    if (!namaBersih || !emailBersih) {
      return res.status(400).json({
        message: "Nama dan email tidak boleh kosong",
      });
    }

    // --------------------------------------------------
    // CEK EMAIL
    // --------------------------------------------------

    db.query(
      `
        SELECT id
        FROM user
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1
      `,
      [emailBersih],
      async (err, result) => {
        if (err) {
          console.log("ERROR CEK EMAIL:", err);

          return res.status(500).json({
            message: "Gagal memeriksa email",
          });
        }

        if (result.length > 0) {
          return res.status(400).json({
            message: "Email sudah digunakan",
          });
        }

        try {
          // ------------------------------------------------
          // HASH PASSWORD
          // ------------------------------------------------

          const hashed = await bcrypt.hash(password, 10);

          // ------------------------------------------------
          // INSERT ADMIN
          // ------------------------------------------------

          const sql = `
            INSERT INTO user
            (
              nama,
              email,
              password,
              role,
              is_master
            )
            VALUES
            (
              ?,
              ?,
              ?,
              'admin',
              0
            )
          `;

          db.query(sql, [namaBersih, emailBersih, hashed], (err2, result2) => {
            if (err2) {
              console.log("ERROR INSERT ADMIN:", err2);

              return res.status(500).json({
                message: "Gagal menambahkan admin",
              });
            }

            return res.status(201).json({
              message: "Admin berhasil ditambahkan",
              id: result2.insertId,
            });
          });
        } catch (hashError) {
          console.log("ERROR HASH PASSWORD:", hashError);

          return res.status(500).json({
            message: "Gagal memproses password",
          });
        }
      }
    );
  } catch (error) {
    console.log("ERROR TAMBAH ADMIN:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
});

// ======================================================
// EDIT ADMIN
// ======================================================
//
// ATURAN:
// 1. Admin biasa hanya boleh edit dirinya sendiri.
// 2. Admin Master boleh edit admin lain.
// 3. is_master tidak pernah dapat diubah dari endpoint ini.
// ======================================================

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nama, email, password } = req.body;

  // ====================================================
  // CEK ID TARGET
  // ====================================================

  const targetId = Number(id);
  const loggedInId = Number(req.user.id);

  if (!Number.isInteger(targetId)) {
    return res.status(400).json({
      message: "ID admin tidak valid",
    });
  }

  // ====================================================
  // CEK HAK AKSES
  // ====================================================

  const userIsMaster = isMaster(req.user);

  // Admin biasa hanya boleh mengedit dirinya sendiri
  if (!userIsMaster && targetId !== loggedInId) {
    return res.status(403).json({
      message:
        "Akses ditolak. Admin hanya dapat mengubah data akunnya sendiri.",
    });
  }

  // ====================================================
  // VALIDASI
  // ====================================================

  if (!nama || !email) {
    return res.status(400).json({
      message: "Nama dan email wajib diisi",
    });
  }

  const namaBersih = nama.trim();
  const emailBersih = email.trim().toLowerCase();

  if (!namaBersih || !emailBersih) {
    return res.status(400).json({
      message: "Nama dan email tidak boleh kosong",
    });
  }

  try {
    // ==================================================
    // CEK ADMIN TARGET
    // ==================================================

    db.query(
      `
        SELECT
          id,
          nama,
          email,
          role,
          is_master
        FROM user
        WHERE id = ?
          AND role = 'admin'
        LIMIT 1
      `,
      [targetId],
      async (err, result) => {
        if (err) {
          console.log("ERROR GET ADMIN:", err);

          return res.status(500).json({
            message: "Gagal mengambil data admin",
          });
        }

        if (result.length === 0) {
          return res.status(404).json({
            message: "Admin tidak ditemukan",
          });
        }

        const adminTarget = result[0];

        // ==================================================
        // ADMIN BIASA
        // ==================================================
        //
        // Pengamanan tambahan:
        // walaupun token dimanipulasi, target tetap
        // harus sama dengan user yang sedang login.
        // ==================================================

        if (!userIsMaster && Number(adminTarget.id) !== loggedInId) {
          return res.status(403).json({
            message: "Anda tidak memiliki izin untuk mengubah admin tersebut.",
          });
        }

        // ==================================================
        // CEK EMAIL
        // ==================================================

        db.query(
          `
            SELECT id
            FROM user
            WHERE LOWER(email) = LOWER(?)
              AND id <> ?
            LIMIT 1
          `,
          [emailBersih, targetId],
          async (err2, cekEmail) => {
            if (err2) {
              console.log("ERROR CEK EMAIL:", err2);

              return res.status(500).json({
                message: "Gagal memeriksa email",
              });
            }

            if (cekEmail.length > 0) {
              return res.status(400).json({
                message: "Email sudah digunakan oleh admin lain",
              });
            }

            // ==================================================
            // JIKA PASSWORD DIUBAH
            // ==================================================

            if (password && password.trim() !== "") {
              if (password.length < 6) {
                return res.status(400).json({
                  message: "Password minimal 6 karakter",
                });
              }

              try {
                const hashedPassword = await bcrypt.hash(password, 10);

                const sql = `
                  UPDATE user
                  SET
                    nama = ?,
                    email = ?,
                    password = ?
                  WHERE id = ?
                    AND role = 'admin'
                `;

                db.query(
                  sql,
                  [namaBersih, emailBersih, hashedPassword, targetId],
                  (err3, result3) => {
                    if (err3) {
                      console.log("ERROR UPDATE ADMIN:", err3);

                      return res.status(500).json({
                        message: "Gagal memperbarui data admin",
                      });
                    }

                    if (result3.affectedRows === 0) {
                      return res.status(404).json({
                        message: "Data admin tidak berhasil diperbarui",
                      });
                    }

                    return res.json({
                      message:
                        targetId === loggedInId
                          ? "Data akun Anda berhasil diperbarui."
                          : "Data admin berhasil diperbarui.",
                    });
                  }
                );
              } catch (hashError) {
                console.log("ERROR HASH PASSWORD:", hashError);

                return res.status(500).json({
                  message: "Gagal memproses password",
                });
              }

              return;
            }

            // ==================================================
            // PASSWORD TIDAK DIUBAH
            // ==================================================

            const sql = `
              UPDATE user
              SET
                nama = ?,
                email = ?
              WHERE id = ?
                AND role = 'admin'
            `;

            db.query(
              sql,
              [namaBersih, emailBersih, targetId],
              (err3, result3) => {
                if (err3) {
                  console.log("ERROR UPDATE ADMIN:", err3);

                  return res.status(500).json({
                    message: "Gagal memperbarui data admin",
                  });
                }

                if (result3.affectedRows === 0) {
                  return res.status(404).json({
                    message: "Data admin tidak berhasil diperbarui",
                  });
                }

                return res.json({
                  message:
                    targetId === loggedInId
                      ? "Data akun Anda berhasil diperbarui."
                      : "Data admin berhasil diperbarui.",
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.log("ERROR EDIT ADMIN:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
});

// ======================================================
// HAPUS ADMIN
// ======================================================
//
// Hanya Admin Master yang dapat menghapus admin biasa.
// Admin Master sendiri tidak dapat dihapus.
// ======================================================

router.delete("/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const targetId = Number(id);

  // ====================================================
  // HANYA MASTER
  // ====================================================

  if (!isMaster(req.user)) {
    return res.status(403).json({
      message: "Akses ditolak. Hanya Admin Master yang dapat menghapus admin.",
    });
  }

  // ====================================================
  // VALIDASI ID
  // ====================================================

  if (!Number.isInteger(targetId)) {
    return res.status(400).json({
      message: "ID admin tidak valid",
    });
  }

  // ====================================================
  // CEK ADMIN
  // ====================================================

  db.query(
    `
      SELECT
        id,
        nama,
        email,
        role,
        is_master
      FROM user
      WHERE id = ?
        AND role = 'admin'
      LIMIT 1
    `,
    [targetId],
    (err, result) => {
      if (err) {
        console.log("ERROR CEK ADMIN HAPUS:", err);

        return res.status(500).json({
          message: "Gagal memeriksa admin",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "Admin tidak ditemukan",
        });
      }

      const admin = result[0];

      // ==================================================
      // ADMIN MASTER TIDAK BOLEH DIHAPUS
      // ==================================================

      if (Number(admin.is_master) === 1) {
        return res.status(403).json({
          message:
            "Admin Master tidak dapat dihapus. Akun ini merupakan akun utama sistem.",
        });
      }

      // ==================================================
      // HAPUS ADMIN BIASA
      // ==================================================

      db.query(
        `
          DELETE FROM user
          WHERE id = ?
            AND role = 'admin'
            AND is_master = 0
        `,
        [targetId],
        (err2, result2) => {
          if (err2) {
            console.log("ERROR DELETE ADMIN:", err2);

            return res.status(500).json({
              message: "Gagal menghapus admin",
            });
          }

          if (result2.affectedRows === 0) {
            return res.status(403).json({
              message: "Admin tidak dapat dihapus.",
            });
          }

          return res.json({
            message: "Admin berhasil dihapus",
          });
        }
      );
    }
  );
});

module.exports = router;
