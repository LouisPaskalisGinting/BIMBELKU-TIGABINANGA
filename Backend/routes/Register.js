const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const db = require("../db");

// ========================================
// STORAGE MULTER
// ========================================

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

// ========================================
// REGISTER SISWA
// ========================================

const registerSiswa = (req, res) => {
  try {
    const {
      nama,
      kelas,
      asal_sekolah,
      no_hp,
      nama_orangtua,
      no_hp_orangtua,
      program_id,
      email,
      password,
      nominal_pembayaran,
    } = req.body;

    // ========================================
    // VALIDASI DATA
    // ========================================

    if (
      !nama ||
      !kelas ||
      !asal_sekolah ||
      !no_hp ||
      !nama_orangtua ||
      !no_hp_orangtua ||
      !program_id ||
      !email ||
      !password ||
      !nominal_pembayaran
    ) {
      return res.status(400).json({
        message: "Semua data wajib diisi.",
      });
    }

    // ========================================
    // VALIDASI NOMOR HP
    // ========================================

    if (!/^[0-9]{10,15}$/.test(no_hp)) {
      return res.status(400).json({
        message: "Nomor HP harus terdiri dari 10-15 digit angka.",
      });
    }

    if (!/^[0-9]{10,15}$/.test(no_hp_orangtua)) {
      return res.status(400).json({
        message: "Nomor HP Orang Tua harus terdiri dari 10-15 digit angka.",
      });
    }

    // ========================================
    // VALIDASI EMAIL
    // ========================================

    const emailFix = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailFix)) {
      return res.status(400).json({
        message: "Format email tidak valid.",
      });
    }

    // ========================================
    // VALIDASI NOMINAL
    // ========================================

    const nominal = Number(nominal_pembayaran);

    if (!Number.isInteger(nominal) || nominal <= 0) {
      return res.status(400).json({
        message: "Nominal pembayaran tidak valid.",
      });
    }

    // ========================================
    // VALIDASI BUKTI PEMBAYARAN
    // ========================================

    if (!req.file) {
      return res.status(400).json({
        message: "Bukti pembayaran wajib diupload.",
      });
    }

    const bukti_pembayaran = req.file.filename;

    // ========================================
    // CEK EMAIL
    // ========================================

    db.query(
      "SELECT id FROM siswa WHERE email = ?",
      [emailFix],
      (err, emailResult) => {
        if (err) {
          console.log("=================================");
          console.log("ERROR PROGRAM:", err);
          console.log("MESSAGE:", err.message);
          console.log("SQL:", err.sql);
          console.log("PROGRAM ID:", program_id);
          console.log("=================================");

          return res.status(500).json({
            message: "Gagal mengambil data program.",
            error: err.message,
          });
        }

        if (emailResult.length > 0) {
          return res.status(400).json({
            message: "Email sudah terdaftar, silakan gunakan email lain.",
          });
        }

        // ========================================
        // AMBIL DATA PROGRAM
        // ========================================

        db.query(
          "SELECT id, harga FROM program WHERE id = ?",
          [program_id],
          (err, programResult) => {
            if (err) {
              console.log("ERROR PROGRAM:", err);

              return res.status(500).json({
                message: "Gagal mengambil data program.",
              });
            }

            if (programResult.length === 0) {
              return res.status(404).json({
                message: "Program tidak ditemukan.",
              });
            }

            const total_tagihan = Number(programResult[0].harga);

            // ========================================
            // NOMINAL TIDAK BOLEH MELEBIHI TAGIHAN
            // ========================================

            if (nominal > total_tagihan) {
              return res.status(400).json({
                message:
                  "Nominal pembayaran tidak boleh lebih besar dari total tagihan.",
              });
            }

            // ========================================
            // INSERT SISWA
            // ========================================

            const sqlSiswa = `
                INSERT INTO siswa
                (
                  nama,
                  kelas,
                  asal_sekolah,
                  no_hp,
                  nama_orangtua,
                  no_hp_orangtua,
                  program_id,
                  email,
                  password,
                  bukti_pembayaran,
                  status
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
              `;

            db.query(
              sqlSiswa,
              [
                nama,
                kelas,
                asal_sekolah,
                no_hp,
                nama_orangtua,
                no_hp_orangtua,
                program_id,
                emailFix,
                password,
                bukti_pembayaran,
              ],
              (err, siswaResult) => {
                if (err) {
                  console.log("ERROR INSERT SISWA:", err);

                  return res.status(500).json({
                    message: "Gagal register siswa.",
                  });
                }

                // ========================================
                // ID SISWA
                // ========================================

                const siswa_id = siswaResult.insertId;

                // ========================================
                // BUAT TAGIHAN PEMBAYARAN
                // ========================================

                const sqlPembayaran = `
                    INSERT INTO pembayaran
                    (
                      siswa_id,
                      total_tagihan,
                      sudah_dibayar,
                      sisa_tagihan
                    )
                    VALUES (?, ?, ?, ?)
                  `;

                db.query(
                  sqlPembayaran,
                  [siswa_id, total_tagihan, 0, total_tagihan],
                  (err, pembayaranResult) => {
                    if (err) {
                      console.log("ERROR INSERT PEMBAYARAN:", err);

                      return res.status(500).json({
                        message: "Gagal membuat data pembayaran.",
                      });
                    }

                    // ========================================
                    // ID PEMBAYARAN
                    // ========================================

                    const pembayaran_id = pembayaranResult.insertId;

                    // ========================================
                    // SIMPAN PEMBAYARAN PENDING
                    // ========================================

                    const sqlDetail = `
                        INSERT INTO pembayaran_detail
                        (
                          pembayaran_id,
                          jumlah,
                          tanggal,
                          bukti_pembayaran,
                          status
                        )
                        VALUES
                        (?, ?, NOW(), ?, 'pending')
                      `;

                    db.query(
                      sqlDetail,
                      [pembayaran_id, nominal, bukti_pembayaran],
                      (err) => {
                        if (err) {
                          console.log("ERROR INSERT PEMBAYARAN DETAIL:", err);

                          return res.status(500).json({
                            message: "Gagal menyimpan detail pembayaran.",
                          });
                        }

                        // ========================================
                        // BERHASIL
                        // ========================================

                        return res.status(201).json({
                          message:
                            "Pendaftaran berhasil. Pembayaran menunggu verifikasi admin.",
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.log("ERROR REGISTER:", error);

    return res.status(500).json({
      message: "Server Error.",
    });
  }
};

// ========================================
// ROUTE REGISTER SISWA
// ========================================

router.post("/siswa", upload.single("bukti_pembayaran"), registerSiswa);

// ========================================
// EXPORT
// ========================================

module.exports = router;

// Export handler untuk kebutuhan pengujian Jest
module.exports.registerSiswa = registerSiswa;
