const express = require("express");
const router = express.Router();

const db = require("../db");
const multer = require("multer");
const path = require("path");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// UPLOAD
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-bukti-pembayaran" + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
});

// =====================================================
// GENERATE TAGIHAN
// =====================================================

router.post("/generate", (req, res) => {
  const sql = `
    INSERT INTO pembayaran
    (
      siswa_id,
      total_tagihan,
      sudah_dibayar,
      sisa_tagihan
    )
    SELECT
      siswa.id,
      program.harga,
      0,
      program.harga
    FROM siswa

    INNER JOIN program
      ON siswa.program_id = program.id

    LEFT JOIN pembayaran
      ON pembayaran.siswa_id = siswa.id

    WHERE siswa.status = 'approved'
      AND pembayaran.id IS NULL
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GENERATE PEMBAYARAN:", err);

      return res.status(500).json({
        message: "Gagal generate tagihan",
        error: err.message,
      });
    }

    return res.json({
      message: "Tagihan berhasil digenerate",
      inserted: result.affectedRows,
    });
  });
});

// =====================================================
// GET SEMUA PEMBAYARAN
// =====================================================

router.get("/", (req, res) => {
  const sql = `
    SELECT
      pembayaran.id,
      pembayaran.siswa_id,

      siswa.nama AS nama_siswa,
      siswa.email,
      siswa.user_id,

      siswa.kelas_id,
      kelas.nama_kelas,

      siswa.program_id,
      program.nama_program,

      pembayaran.total_tagihan,
      pembayaran.sudah_dibayar,

      GREATEST(
        pembayaran.total_tagihan -
        pembayaran.sudah_dibayar,
        0
      ) AS sisa_tagihan

    FROM pembayaran

    INNER JOIN siswa
      ON pembayaran.siswa_id = siswa.id

    LEFT JOIN kelas
      ON siswa.kelas_id = kelas.id

    LEFT JOIN program
      ON siswa.program_id = program.id

    WHERE siswa.status = 'approved'

    ORDER BY pembayaran.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("ERROR GET PEMBAYARAN:", err);

      return res.status(500).json({
        message: "Gagal mengambil data pembayaran",
        error: err.message,
      });
    }

    return res.json(result);
  });
});

// =====================================================
// GET PEMBAYARAN SISWA
// =====================================================

router.get("/siswa/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "ID siswa tidak valid",
    });
  }

  const sql = `
    SELECT
      pembayaran.id,
      pembayaran.siswa_id,

      siswa.id AS id_siswa,
      siswa.user_id,

      siswa.nama AS nama_siswa,
      siswa.email,

      siswa.kelas_id,
      kelas.nama_kelas,

      siswa.program_id,
      program.nama_program,

      pembayaran.total_tagihan,
      pembayaran.sudah_dibayar,

      GREATEST(
        pembayaran.total_tagihan -
        pembayaran.sudah_dibayar,
        0
      ) AS sisa_tagihan

    FROM pembayaran

    INNER JOIN siswa
      ON pembayaran.siswa_id = siswa.id

    LEFT JOIN kelas
      ON siswa.kelas_id = kelas.id

    LEFT JOIN program
      ON siswa.program_id = program.id

    WHERE
      siswa.user_id = ?
      OR siswa.id = ?

    ORDER BY
      CASE
        WHEN siswa.user_id = ? THEN 0
        ELSE 1
      END

    LIMIT 1
  `;

  db.query(sql, [id, id, id], (err, result) => {
    if (err) {
      console.error("ERROR GET PEMBAYARAN SISWA:", err);

      return res.status(500).json({
        message: "Gagal mengambil pembayaran siswa",
        error: err.message,
      });
    }

    return res.json(result);
  });
});

// =====================================================
// DETAIL PEMBAYARAN
//
// Digunakan untuk pembayaran berikutnya.
// Pembayaran pertama tetap tersimpan sebagai detail,
// tetapi tidak dibuatkan tampilan khusus.
// =====================================================

router.get("/detail/:id", (req, res) => {
  const pembayaranId = Number(req.params.id);

  if (!Number.isInteger(pembayaranId) || pembayaranId <= 0) {
    return res.status(400).json({
      message: "ID pembayaran tidak valid",
    });
  }

  const sql = `
    SELECT
      pembayaran_detail.id,
      pembayaran_detail.pembayaran_id,
      pembayaran_detail.jumlah,
      pembayaran_detail.tanggal,
      pembayaran_detail.bukti_pembayaran,
      pembayaran_detail.status,
      pembayaran_detail.catatan,

      pembayaran.siswa_id,

      siswa.id AS id_siswa,
      siswa.user_id,

      siswa.nama AS nama_siswa

    FROM pembayaran_detail

    INNER JOIN pembayaran
      ON pembayaran_detail.pembayaran_id =
         pembayaran.id

    INNER JOIN siswa
      ON pembayaran.siswa_id = siswa.id

    WHERE pembayaran_detail.pembayaran_id = ?

    ORDER BY
      pembayaran_detail.id DESC
  `;

  db.query(sql, [pembayaranId], (err, result) => {
    if (err) {
      console.error("ERROR GET DETAIL:", err);

      return res.status(500).json({
        message: "Gagal mengambil detail pembayaran",
        error: err.message,
      });
    }

    return res.json(result);
  });
});

// =====================================================
// ADMIN INPUT PEMBAYARAN
//
// Pembayaran yang dimasukkan langsung oleh admin
// otomatis approved.
// =====================================================

router.post(
  "/admin/:id",
  authMiddleware,
  upload.single("bukti_pembayaran"),
  (req, res) => {
    const pembayaranId = Number(req.params.id);

    const jumlah = req.body?.jumlah;

    const buktiPembayaran = req.file ? req.file.filename : null;

    if (!Number.isInteger(pembayaranId) || pembayaranId <= 0) {
      return res.status(400).json({
        message: "ID pembayaran tidak valid",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "User tidak terautentikasi",
      });
    }

    if (
      jumlah === undefined ||
      jumlah === null ||
      jumlah === "" ||
      Number(jumlah) <= 0
    ) {
      return res.status(400).json({
        message: "Jumlah pembayaran tidak valid",
      });
    }

    if (!buktiPembayaran) {
      return res.status(400).json({
        message: "Bukti pembayaran wajib diupload",
      });
    }

    const bayar = Number(jumlah);

    const sqlTagihan = `
      SELECT
        pembayaran.id,
        pembayaran.siswa_id,
        pembayaran.total_tagihan,
        pembayaran.sudah_dibayar,

        siswa.nama AS nama_siswa

      FROM pembayaran

      INNER JOIN siswa
        ON pembayaran.siswa_id =
           siswa.id

      WHERE pembayaran.id = ?
    `;

    db.query(sqlTagihan, [pembayaranId], (err, rows) => {
      if (err) {
        console.error("ERROR CEK TAGIHAN:", err);

        return res.status(500).json({
          message: "Gagal mengambil data tagihan",
          error: err.message,
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Data pembayaran tidak ditemukan",
        });
      }

      const pembayaran = rows[0];

      const totalTagihan = Number(pembayaran.total_tagihan) || 0;

      const sudahDibayar = Number(pembayaran.sudah_dibayar) || 0;

      const sisaTagihan = Math.max(totalTagihan - sudahDibayar, 0);

      if (bayar > sisaTagihan) {
        return res.status(400).json({
          message: "Nominal pembayaran melebihi sisa tagihan",
          sisa_tagihan: sisaTagihan,
        });
      }

      // =============================================
      // INSERT DETAIL
      // =============================================

      const sqlDetail = `
          INSERT INTO pembayaran_detail
          (
            pembayaran_id,
            jumlah,
            tanggal,
            bukti_pembayaran,
            status,
            catatan
          )
          VALUES
          (
            ?,
            ?,
            NOW(),
            ?,
            'approved',
            ?
          )
        `;

      db.query(
        sqlDetail,
        [
          pembayaranId,
          bayar,
          buktiPembayaran,
          "Pembayaran dimasukkan oleh admin",
        ],
        (err) => {
          if (err) {
            console.error("ERROR INSERT DETAIL:", err);

            return res.status(500).json({
              message: "Gagal menyimpan detail pembayaran",
              error: err.message,
            });
          }

          // =========================================
          // UPDATE TAGIHAN
          // =========================================

          const sqlUpdate = `
              UPDATE pembayaran
              SET
                sudah_dibayar =
                  sudah_dibayar + ?,
                sisa_tagihan =
                  GREATEST(
                    total_tagihan -
                    (sudah_dibayar + ?),
                    0
                  )
              WHERE id = ?
            `;

          db.query(sqlUpdate, [bayar, bayar, pembayaranId], async (err) => {
            if (err) {
              console.error("ERROR UPDATE PEMBAYARAN:", err);

              return res.status(500).json({
                message: "Gagal memperbarui tagihan",
                error: err.message,
              });
            }

            try {
              await logAktivitas({
                user_id: req.user.id,
                nama_user: req.user.nama,
                role: req.user.role,

                aktivitas: "Menambahkan pembayaran",

                keterangan:
                  `Admin ${req.user.nama} ` +
                  `menambahkan pembayaran sebesar Rp ` +
                  `${bayar.toLocaleString("id-ID")} untuk siswa ` +
                  `${pembayaran.nama_siswa}`,
              });
            } catch (logError) {
              console.error("GAGAL LOG PEMBAYARAN:", logError);
            }

            const sudahDibayarBaru = sudahDibayar + bayar;

            const sisaBaru = Math.max(totalTagihan - sudahDibayarBaru, 0);

            return res.status(201).json({
              message: "Pembayaran siswa berhasil ditambahkan",

              siswa: pembayaran.nama_siswa,

              total_tagihan: totalTagihan,

              sudah_dibayar: sudahDibayarBaru,

              sisa_tagihan: sisaBaru,
            });
          });
        }
      );
    });
  }
);

// =====================================================
// SISWA AJUKAN PEMBAYARAN
//
// Semua pembayaran dari siswa masuk PENDING.
// Admin kemudian approve/reject.
// =====================================================

router.post("/:id", upload.single("bukti_pembayaran"), (req, res) => {
  const pembayaranId = Number(req.params.id);

  const jumlah = req.body?.jumlah;

  const buktiPembayaran = req.file ? req.file.filename : null;

  if (!Number.isInteger(pembayaranId) || pembayaranId <= 0) {
    return res.status(400).json({
      message: "ID pembayaran tidak valid",
    });
  }

  if (
    jumlah === undefined ||
    jumlah === null ||
    jumlah === "" ||
    Number(jumlah) <= 0
  ) {
    return res.status(400).json({
      message: "Jumlah pembayaran tidak valid",
    });
  }

  if (!buktiPembayaran) {
    return res.status(400).json({
      message: "Bukti pembayaran wajib diupload",
    });
  }

  const bayar = Number(jumlah);

  const sql = `
      SELECT
        pembayaran.id,
        pembayaran.siswa_id,
        pembayaran.total_tagihan,
        pembayaran.sudah_dibayar,

        siswa.nama AS nama_siswa

      FROM pembayaran

      INNER JOIN siswa
        ON pembayaran.siswa_id =
           siswa.id

      WHERE pembayaran.id = ?
    `;

  db.query(sql, [pembayaranId], (err, rows) => {
    if (err) {
      console.error("ERROR CEK PEMBAYARAN:", err);

      return res.status(500).json({
        message: "Gagal mengambil data pembayaran",
        error: err.message,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Data pembayaran tidak ditemukan",
      });
    }

    const pembayaran = rows[0];

    const totalTagihan = Number(pembayaran.total_tagihan) || 0;

    const sudahDibayar = Number(pembayaran.sudah_dibayar) || 0;

    const sisa = Math.max(totalTagihan - sudahDibayar, 0);

    if (bayar > sisa) {
      return res.status(400).json({
        message: "Jumlah melebihi sisa tagihan",
        sisa_tagihan: sisa,
      });
    }

    // =============================================
    // SIMPAN SEBAGAI PENDING
    // =============================================

    const sqlDetail = `
          INSERT INTO pembayaran_detail
          (
            pembayaran_id,
            jumlah,
            tanggal,
            bukti_pembayaran,
            status,
            catatan
          )
          VALUES
          (
            ?,
            ?,
            NOW(),
            ?,
            'pending',
            NULL
          )
        `;

    db.query(sqlDetail, [pembayaranId, bayar, buktiPembayaran], (err) => {
      if (err) {
        console.error("ERROR INSERT PEMBAYARAN SISWA:", err);

        return res.status(500).json({
          message: "Gagal menyimpan pembayaran",
          error: err.message,
        });
      }

      return res.status(201).json({
        message: "Pembayaran berhasil diajukan, menunggu persetujuan admin",

        nama_siswa: pembayaran.nama_siswa,
      });
    });
  });
});

// =====================================================
// ADMIN APPROVE PEMBAYARAN
// =====================================================

router.put("/approve/:detailId", authMiddleware, (req, res) => {
  const detailId = Number(req.params.detailId);

  if (!Number.isInteger(detailId) || detailId <= 0) {
    return res.status(400).json({
      message: "ID detail pembayaran tidak valid",
    });
  }

  const sql = `
      SELECT
        pembayaran_detail.*,

        pembayaran.siswa_id,
        pembayaran.total_tagihan,
        pembayaran.sudah_dibayar,

        siswa.nama AS nama_siswa

      FROM pembayaran_detail

      INNER JOIN pembayaran
        ON pembayaran_detail.pembayaran_id =
           pembayaran.id

      INNER JOIN siswa
        ON pembayaran.siswa_id =
           siswa.id

      WHERE pembayaran_detail.id = ?
    `;

  db.query(sql, [detailId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Gagal mengambil detail pembayaran",
        error: err.message,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Detail pembayaran tidak ditemukan",
      });
    }

    const detail = rows[0];

    if (detail.status !== "pending") {
      return res.status(400).json({
        message: "Pembayaran sudah diproses",
      });
    }

    const jumlah = Number(detail.jumlah) || 0;

    const totalTagihan = Number(detail.total_tagihan) || 0;

    const sudahDibayar = Number(detail.sudah_dibayar) || 0;

    const sisaTagihan = Math.max(totalTagihan - sudahDibayar, 0);

    if (jumlah > sisaTagihan) {
      return res.status(400).json({
        message: "Pembayaran melebihi sisa tagihan",
        sisa_tagihan: sisaTagihan,
      });
    }

    // =============================================
    // APPROVE DETAIL
    // =============================================

    db.query(
      `
          UPDATE pembayaran_detail
          SET
            status = 'approved',
            catatan = ?
          WHERE id = ?
            AND status = 'pending'
          `,
      ["Pembayaran disetujui oleh admin.", detailId],
      (err, updateResult) => {
        if (err) {
          return res.status(500).json({
            message: "Gagal menyetujui pembayaran",
            error: err.message,
          });
        }

        if (updateResult.affectedRows === 0) {
          return res.status(400).json({
            message: "Pembayaran sudah diproses",
          });
        }

        // =========================================
        // UPDATE TAGIHAN
        // =========================================

        db.query(
          `
              UPDATE pembayaran
              SET
                sudah_dibayar =
                  sudah_dibayar + ?,
                sisa_tagihan =
                  GREATEST(
                    total_tagihan -
                    (sudah_dibayar + ?),
                    0
                  )
              WHERE id = ?
              `,
          [jumlah, jumlah, detail.pembayaran_id],
          async (err) => {
            if (err) {
              return res.status(500).json({
                message: "Gagal memperbarui tagihan",
                error: err.message,
              });
            }

            // =====================================
            // LOG
            // =====================================

            try {
              await logAktivitas({
                user_id: req.user.id,
                nama_user: req.user.nama,
                role: req.user.role,

                aktivitas: "Menyetujui pembayaran",

                keterangan:
                  `Admin ${req.user.nama} ` +
                  `menyetujui pembayaran sebesar Rp ` +
                  `${jumlah.toLocaleString("id-ID")} untuk siswa ` +
                  `${detail.nama_siswa}`,
              });
            } catch (logError) {
              console.error("GAGAL LOG APPROVE:", logError);
            }

            return res.json({
              message: "Pembayaran disetujui",

              nama_siswa: detail.nama_siswa,
            });
          }
        );
      }
    );
  });
});

// =====================================================
// ADMIN TOLAK PEMBAYARAN
// =====================================================

router.put("/reject/:detailId", authMiddleware, (req, res) => {
  const detailId = Number(req.params.detailId);

  const catatan = req.body?.catatan;

  if (!Number.isInteger(detailId) || detailId <= 0) {
    return res.status(400).json({
      message: "ID detail pembayaran tidak valid",
    });
  }

  const sql = `
      SELECT
        pembayaran_detail.*,

        pembayaran.siswa_id,

        siswa.nama AS nama_siswa

      FROM pembayaran_detail

      INNER JOIN pembayaran
        ON pembayaran_detail.pembayaran_id =
           pembayaran.id

      INNER JOIN siswa
        ON pembayaran.siswa_id =
           siswa.id

      WHERE pembayaran_detail.id = ?
    `;

  db.query(sql, [detailId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Gagal mengambil detail pembayaran",
        error: err.message,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Detail pembayaran tidak ditemukan",
      });
    }

    const detail = rows[0];

    if (detail.status !== "pending") {
      return res.status(400).json({
        message: "Pembayaran sudah diproses",
      });
    }

    const alasan = catatan || "Pembayaran ditolak";

    db.query(
      `
          UPDATE pembayaran_detail
          SET
            status = 'rejected',
            catatan = ?
          WHERE id = ?
            AND status = 'pending'
          `,
      [alasan, detailId],
      async (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Gagal menolak pembayaran",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(400).json({
            message: "Pembayaran tidak ditemukan atau sudah diproses",
          });
        }

        try {
          await logAktivitas({
            user_id: req.user.id,
            nama_user: req.user.nama,
            role: req.user.role,

            aktivitas: "Menolak pembayaran",

            keterangan:
              `Admin ${req.user.nama} ` +
              `menolak pembayaran sebesar Rp ` +
              `${Number(detail.jumlah).toLocaleString("id-ID")} untuk siswa ` +
              `${detail.nama_siswa}. ` +
              `Alasan: ${alasan}`,
          });
        } catch (logError) {
          console.error("GAGAL LOG REJECT:", logError);
        }

        return res.json({
          message: "Pembayaran ditolak",

          nama_siswa: detail.nama_siswa,
        });
      }
    );
  });
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
