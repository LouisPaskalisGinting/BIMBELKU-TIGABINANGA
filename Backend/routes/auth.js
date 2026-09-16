const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "bimbelku_secret_key_2026";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// ======================================================
// KONFIGURASI EMAIL
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================================================
// LOGIN
// ======================================================

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email dan password wajib diisi",
    });
  }

  const emailFix = email.trim().toLowerCase();

  const sql = `
    SELECT
      id,
      nama,
      email,
      password,
      role,
      is_master
    FROM user
    WHERE LOWER(email) = ?
    LIMIT 1
  `;

  db.query(sql, [emailFix], async (err, result) => {
    if (err) {
      console.error("ERROR LOGIN:", err);

      return res.status(500).json({
        message: "Terjadi kesalahan pada server",
      });
    }

    if (result.length === 0) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    const user = result[0];

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Email atau password salah",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          is_master: user.is_master,
        },
        JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return res.status(200).json({
        message: "Login berhasil",

        token,

        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          is_master: user.is_master,
        },
      });
    } catch (error) {
      console.error("ERROR PASSWORD/JWT:", error);

      return res.status(500).json({
        message: "Terjadi kesalahan saat login",
      });
    }
  });
});

// ======================================================
// CEK USER
// ======================================================

router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token tidak ditemukan",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "Format token tidak valid",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const sql = `
      SELECT
        id,
        nama,
        email,
        role
      FROM user
      WHERE id = ?
      LIMIT 1
    `;

    db.query(sql, [decoded.id], (err, result) => {
      if (err) {
        console.error("ERROR GET USER:", err);

        return res.status(500).json({
          message: "Gagal mengambil data user",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      return res.json({
        user: result[0],
      });
    });
  } catch (error) {
    return res.status(401).json({
      message: "Token tidak valid atau sudah expired",
    });
  }
});

// ======================================================
// LUPA PASSWORD
// ======================================================

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({
      message: "Email wajib diisi",
    });
  }

  const emailFix = email.trim().toLowerCase();

  const sql = `
    SELECT
      id,
      nama,
      email
    FROM user
    WHERE LOWER(email) = ?
    LIMIT 1
  `;

  db.query(sql, [emailFix], (err, result) => {
    if (err) {
      console.error("ERROR CEK EMAIL:", err);

      return res.status(500).json({
        message: "Terjadi kesalahan server",
      });
    }

    // Untuk keamanan, jangan memberi tahu
    // apakah email terdaftar atau tidak.
    if (result.length === 0) {
      return res.status(200).json({
        message:
          "Jika email terdaftar, link reset password akan dikirim ke email tersebut.",
      });
    }

    const user = result[0];

    // ==================================================
    // BUAT TOKEN RESET PASSWORD
    // ==================================================

    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "reset-password",
      },
      JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // ==================================================
    // LINK RESET
    // ==================================================

    const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

    // ==================================================
    // ISI EMAIL
    // ==================================================

    const mailOptions = {
      from: `"Bimbelku Tigabinanga" <${process.env.EMAIL_USER}>`,

      to: user.email,

      subject: "Reset Password Bimbelku",

      html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 10px;
          ">

            <h2 style="color: #2563eb;">
              Reset Password Bimbelku
            </h2>

            <p>
              Halo <strong>${user.nama}</strong>,
            </p>

            <p>
              Kami menerima permintaan untuk
              mengatur ulang password akun Bimbelku Anda.
            </p>

            <p>
              Klik tombol berikut untuk membuat
              password baru:
            </p>

            <div style="text-align:center; margin:30px 0;">

              <a
                href="${resetLink}"
                style="
                  background:#2563eb;
                  color:white;
                  padding:12px 25px;
                  text-decoration:none;
                  border-radius:6px;
                  display:inline-block;
                "
              >
                Reset Password
              </a>

            </div>

            <p>
              Link ini hanya berlaku selama
              <strong>15 menit</strong>.
            </p>

            <p>
              Jika Anda tidak meminta reset password,
              abaikan email ini.
            </p>

            <hr />

            <p style="font-size:12px;color:#777;">
              Bimbelku Tigabinanga
            </p>

          </div>
        `,
    };

    // ==================================================
    // KIRIM EMAIL
    // ==================================================
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("====================================");
        console.error("❌ GAGAL MENGIRIM EMAIL RESET PASSWORD");
        console.error("====================================");
        console.error("Error:", error);
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Command:", error.command);
        console.error("====================================");

        return res.status(500).json({
          message: "Gagal mengirim email reset password",
          error: error.message,
        });
      }

      console.log("====================================");
      console.log("✅ EMAIL RESET PASSWORD TERKIRIM");
      console.log("====================================");
      console.log("Dari:", process.env.EMAIL_USER);
      console.log("Ke:", user.email);
      console.log("Message ID:", info.messageId);
      console.log("Response:", info.response);
      console.log("====================================");

      return res.status(200).json({
        message: "Link reset password telah dikirim ke email Anda.",
      });
    });
  });
});

// ======================================================
// RESET PASSWORD
// ======================================================

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Token reset password tidak ditemukan",
    });
  }

  if (!password) {
    return res.status(400).json({
      message: "Password baru wajib diisi",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password minimal terdiri dari 6 karakter",
    });
  }

  try {
    // ==================================================
    // VERIFIKASI TOKEN
    // ==================================================

    const decoded = jwt.verify(token, JWT_SECRET);

    // Pastikan token memang token reset password
    if (decoded.type !== "reset-password") {
      return res.status(401).json({
        message: "Token reset password tidak valid",
      });
    }

    // ==================================================
    // HASH PASSWORD BARU
    // ==================================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ==================================================
    // UPDATE PASSWORD
    // ==================================================

    const sql = `
      UPDATE user
      SET password = ?
      WHERE id = ?
    `;

    db.query(sql, [hashedPassword, decoded.id], (err, result) => {
      if (err) {
        console.error("ERROR UPDATE PASSWORD:", err);

        return res.status(500).json({
          message: "Gagal memperbarui password",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Password berhasil diperbarui. Silakan login kembali.",
      });
    });
  } catch (error) {
    console.error("RESET TOKEN ERROR:", error.message);

    return res.status(401).json({
      message: "Token tidak valid atau sudah expired",
    });
  }
});

// ======================================================
// LOGOUT
// ======================================================

router.post("/logout", (req, res) => {
  res.json({
    message: "Logout berhasil",
  });
});

module.exports = router;
