const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// HELPER PROMISE
// =====================================================

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// =====================================================
// HELPER LOG AKTIVITAS
// =====================================================

const simpanLog = async ({ req, aktivitas, keterangan }) => {
  try {
    if (!req || !req.user) {
      console.error("USER TIDAK DITEMUKAN UNTUK LOG AKTIVITAS");
      return;
    }

    await logAktivitas({
      user_id: req.user.id,
      nama_user: req.user.nama,
      role: req.user.role,
      aktivitas,
      keterangan,
    });

    console.log("LOG SISWA BERHASIL:", aktivitas);
  } catch (error) {
    console.error("GAGAL MENYIMPAN LOG SISWA:", error);
  }
};

// =====================================================
// QUERY DATA SISWA
//
// PENTING:
// Tidak mengambil:
// siswa.nominal_pembayaran
// siswa.bukti_pembayaran
//
// Karena kolom tersebut tidak ada di tabel siswa.
// =====================================================

const queryDataSiswa = `
  SELECT
    siswa.id,
    siswa.id AS siswa_id,
    siswa.user_id,

    siswa.nama,
    siswa.email,
    siswa.asal_sekolah,
    siswa.no_hp,
    siswa.nama_orangtua,
    siswa.no_hp_orangtua,

    siswa.program_id,
    siswa.kelas_id,
    siswa.status,

    program.nama_program,
    program.harga,

    kelas.nama_kelas,

    (
      SELECT pd.bukti_pembayaran
      FROM pembayaran_detail pd
      INNER JOIN pembayaran p
        ON pd.pembayaran_id = p.id
      WHERE p.siswa_id = siswa.id
      ORDER BY pd.id ASC
      LIMIT 1
    ) AS bukti_pembayaran,

    (
      SELECT pd.jumlah
      FROM pembayaran_detail pd
      INNER JOIN pembayaran p
        ON pd.pembayaran_id = p.id
      WHERE p.siswa_id = siswa.id
      ORDER BY pd.id ASC
      LIMIT 1
    ) AS nominal_pembayaran

  FROM siswa

  LEFT JOIN program
    ON siswa.program_id = program.id

  LEFT JOIN kelas
    ON siswa.kelas_id = kelas.id
`;
// =====================================================
// GET DATA SISWA MILIK USER
// =====================================================

router.get("/me", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.user_id = ?
           OR LOWER(siswa.email) = LOWER(?)

        LIMIT 1
      `,
      [userId, userEmail]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data siswa belum terhubung dengan akun ini",
      });
    }

    const siswa = result[0];

    // =================================================
    // AUTO REPAIR USER ID
    // =================================================

    if (siswa.user_id !== userId && userId) {
      try {
        await query(
          `
            UPDATE siswa
            SET user_id = ?
            WHERE id = ?
          `,
          [userId, siswa.id]
        );

        console.log(
          `SUCCESS AUTO-FIX: user_id siswa ${siswa.id} diperbarui ke ${userId}`
        );
      } catch (updateError) {
        console.error("GAGAL AUTO-FIX USER ID:", updateError);
      }
    }

    return res.json(siswa);
  } catch (error) {
    console.error("ERROR GET ME SISWA:", error);

    return res.status(500).json({
      message: "Gagal mengambil data diri siswa",
      error: error.message,
    });
  }
});

// =====================================================
// GET SISWA BERDASARKAN USER ID
// =====================================================

router.get("/user/:user_id", async (req, res) => {
  const userId = Number(req.params.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "User ID tidak valid",
    });
  }

  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.user_id = ?

        LIMIT 1
      `,
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data siswa tidak ditemukan",
        user_id: userId,
      });
    }

    return res.json(result[0]);
  } catch (error) {
    console.error("ERROR GET SISWA USER:", error);

    return res.status(500).json({
      message: "Gagal mengambil data siswa",
      error: error.message,
    });
  }
});

// =====================================================
// GET DASHBOARD SISWA
// =====================================================

router.get("/dashboard/:user_id", async (req, res) => {
  const userId = Number(req.params.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "User ID tidak valid",
    });
  }

  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.user_id = ?

        LIMIT 1
      `,
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data siswa belum terhubung dengan akun",
        user_id: userId,
      });
    }

    return res.json(result[0]);
  } catch (error) {
    console.error("ERROR GET DASHBOARD SISWA:", error);

    return res.status(500).json({
      message: "Gagal mengambil data siswa",
      error: error.message,
    });
  }
});

// =====================================================
// GET SEMUA SISWA APPROVED
// =====================================================

router.get("/", async (req, res) => {
  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.status = 'approved'

        ORDER BY siswa.id DESC
      `
    );

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET SISWA:", error);

    return res.status(500).json({
      message: "Gagal mengambil data siswa",
      error: error.message,
    });
  }
});

// =====================================================
// GET SISWA PENDING
// =====================================================

router.get("/pending", async (req, res) => {
  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.status = 'pending'

        ORDER BY siswa.id DESC
      `
    );

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET PENDING:", error);

    return res.status(500).json({
      message: "Gagal mengambil data siswa pending",
      error: error.message,
    });
  }
});

// =====================================================
// SEARCH SISWA
// =====================================================

router.get("/search/:nama", async (req, res) => {
  const nama = req.params.nama;

  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.nama LIKE ?
          AND siswa.status = 'approved'

        ORDER BY siswa.id DESC
      `,
      [`%${nama}%`]
    );

    return res.json(result);
  } catch (error) {
    console.error("ERROR SEARCH SISWA:", error);

    return res.status(500).json({
      message: "Gagal mencari siswa",
      error: error.message,
    });
  }
});

// =====================================================
// SISWA BERDASARKAN KELAS
// =====================================================

router.get("/kelas/:kelas_id", async (req, res) => {
  const kelasId = Number(req.params.kelas_id);

  if (!Number.isInteger(kelasId) || kelasId <= 0) {
    return res.status(400).json({
      message: "Kelas ID tidak valid",
    });
  }

  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.kelas_id = ?
          AND siswa.status = 'approved'

        ORDER BY siswa.nama ASC
      `,
      [kelasId]
    );

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET SISWA KELAS:", error);

    return res.status(500).json({
      message: "Gagal mengambil siswa berdasarkan kelas",
      error: error.message,
    });
  }
});

// =====================================================
// GET DETAIL SISWA
// =====================================================

router.get("/:id", async (req, res) => {
  const siswaId = Number(req.params.id);

  if (!Number.isInteger(siswaId) || siswaId <= 0) {
    return res.status(400).json({
      message: "ID siswa tidak valid",
    });
  }

  try {
    const result = await query(
      `
        ${queryDataSiswa}

        WHERE siswa.id = ?

        LIMIT 1
      `,
      [siswaId]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data siswa tidak ditemukan",
      });
    }

    return res.json(result[0]);
  } catch (error) {
    console.error("ERROR GET DETAIL SISWA:", error);

    return res.status(500).json({
      message: "Gagal mengambil detail siswa",
      error: error.message,
    });
  }
});

// =====================================================
// APPROVE SISWA
//
// ALUR:
//
// 1. Ambil siswa pending
// 2. Ambil pembayaran pertama dari data pembayaran/detail
// 3. Buat akun user
// 4. Approve siswa
// 5. Buat tagihan
// 6. Pembayaran pertama otomatis approved
// 7. Update sudah_dibayar
// 8. Update sisa_tagihan
//
// PEMBAYARAN PERTAMA TIDAK DITAMPILKAN SEBAGAI
// PERMINTAAN PEMBAYARAN.
// =====================================================

router.put("/approve/:id", authMiddleware, async (req, res) => {
  const siswaId = Number(req.params.id);

  if (!Number.isInteger(siswaId) || siswaId <= 0) {
    return res.status(400).json({
      message: "ID siswa tidak valid",
    });
  }

  try {
    // =================================================
    // AMBIL DATA SISWA
    // =================================================

    const siswaResult = await query(
      `
        SELECT
          siswa.*,
          program.nama_program,
          program.harga
        FROM siswa

        LEFT JOIN program
          ON siswa.program_id = program.id

        WHERE siswa.id = ?

        LIMIT 1
      `,
      [siswaId]
    );

    if (siswaResult.length === 0) {
      return res.status(404).json({
        message: "Siswa tidak ditemukan",
      });
    }

    const siswa = siswaResult[0];

    // =================================================
    // CEK STATUS
    // =================================================

    if (siswa.status === "approved") {
      return res.status(400).json({
        message: "Siswa sudah disetujui sebelumnya",
      });
    }

    // =================================================
    // CARI PEMBAYARAN YANG SUDAH DIAJUKAN
    //
    // Pembayaran pertama akan berasal dari
    // pembayaran_detail.
    // =================================================

    let pembayaranPertama = null;

    try {
      const detailAwal = await query(
        `
          SELECT
            pembayaran_detail.id,
            pembayaran_detail.pembayaran_id,
            pembayaran_detail.jumlah,
            pembayaran_detail.bukti_pembayaran,
            pembayaran_detail.status

          FROM pembayaran_detail

          INNER JOIN pembayaran
            ON pembayaran_detail.pembayaran_id =
               pembayaran.id

          WHERE pembayaran.siswa_id = ?

          ORDER BY pembayaran_detail.id ASC

          LIMIT 1
        `,
        [siswaId]
      );

      if (detailAwal.length > 0) {
        pembayaranPertama = detailAwal[0];
      }
    } catch (detailError) {
      console.log("Belum ada detail pembayaran pertama:", detailError.message);
    }

    // =================================================
    // BUAT / CARI USER
    // =================================================

    const userResult = await query(
      `
        SELECT *
        FROM user
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1
      `,
      [siswa.email]
    );

    let userId;

    // =================================================
    // USER SUDAH ADA
    // =================================================

    if (userResult.length > 0) {
      userId = userResult[0].id;

      await query(
        `
          UPDATE siswa
          SET
            status = 'approved',
            user_id = ?
          WHERE id = ?
        `,
        [userId, siswaId]
      );
    } else {
      // =================================================
      // USER BARU
      // =================================================

      if (!siswa.password) {
        return res.status(400).json({
          message:
            "Password siswa tidak tersedia sehingga akun tidak dapat dibuat.",
        });
      }

      const hashedPassword = await bcrypt.hash(siswa.password, 10);

      const insertUser = await query(
        `
          INSERT INTO user
          (
            nama,
            email,
            password,
            role
          )
          VALUES (?, ?, ?, ?)
        `,
        [siswa.nama, siswa.email, hashedPassword, "siswa"]
      );

      userId = insertUser.insertId;

      await query(
        `
          UPDATE siswa
          SET
            status = 'approved',
            user_id = ?
          WHERE id = ?
        `,
        [userId, siswaId]
      );
    }

    // =================================================
    // CEK / BUAT TAGIHAN
    // =================================================

    let pembayaranResult = await query(
      `
        SELECT *
        FROM pembayaran
        WHERE siswa_id = ?
        LIMIT 1
      `,
      [siswaId]
    );

    let pembayaranId;
    let totalTagihan;

    // =================================================
    // BELUM ADA TAGIHAN
    // =================================================

    if (pembayaranResult.length === 0) {
      totalTagihan = Number(siswa.harga) || 0;

      const insertPembayaran = await query(
        `
          INSERT INTO pembayaran
          (
            siswa_id,
            total_tagihan,
            sudah_dibayar,
            sisa_tagihan
          )
          VALUES (?, ?, ?, ?)
        `,
        [siswaId, totalTagihan, 0, totalTagihan]
      );

      pembayaranId = insertPembayaran.insertId;
    } else {
      pembayaranId = pembayaranResult[0].id;

      totalTagihan =
        Number(pembayaranResult[0].total_tagihan) || Number(siswa.harga) || 0;
    }

    // =================================================
    // PROSES PEMBAYARAN PERTAMA
    // =================================================

    if (pembayaranPertama) {
      // ===============================================
      // Jika masih pending
      // otomatis approve
      // ===============================================

      if (pembayaranPertama.status === "pending") {
        await query(
          `
            UPDATE pembayaran_detail
            SET
              status = 'approved',
              catatan = ?
            WHERE id = ?
          `,
          [
            "Pembayaran pertama otomatis disetujui bersamaan dengan approval pendaftaran siswa.",
            pembayaranPertama.id,
          ]
        );
      }

      // ===============================================
      // Jika belum dihitung ke pembayaran
      // hitung berdasarkan detail approved
      // ===============================================

      const totalPembayaranApproved = await query(
        `
          SELECT
            COALESCE(SUM(jumlah), 0) AS total
          FROM pembayaran_detail
          WHERE pembayaran_id = ?
            AND status = 'approved'
        `,
        [pembayaranId]
      );

      const sudahDibayar = Number(totalPembayaranApproved[0].total) || 0;

      const sisaTagihan = Math.max(totalTagihan - sudahDibayar, 0);

      await query(
        `
          UPDATE pembayaran
          SET
            sudah_dibayar = ?,
            sisa_tagihan = ?
          WHERE id = ?
        `,
        [sudahDibayar, sisaTagihan, pembayaranId]
      );
    }

    // =================================================
    // JIKA BELUM ADA PEMBAYARAN PERTAMA
    // =================================================
    else {
      // Tidak membuat detail pembayaran.
      //
      // Tagihan tetap dibuat dengan:
      //
      // sudah_dibayar = 0
      // sisa_tagihan = total_tagihan

      await query(
        `
          UPDATE pembayaran
          SET
            sudah_dibayar = 0,
            sisa_tagihan = ?
          WHERE id = ?
        `,
        [totalTagihan, pembayaranId]
      );
    }

    // =================================================
    // LOG
    // =================================================

    await simpanLog({
      req,
      aktivitas: "Menyetujui pendaftaran siswa",

      keterangan:
        `Admin ${req.user.nama} menyetujui ` +
        `pendaftaran siswa ${siswa.nama}` +
        `${
          pembayaranPertama
            ? " dan pembayaran pertama otomatis disetujui."
            : "."
        }`,
    });

    // =================================================
    // RESPONSE
    // =================================================

    return res.json({
      message: pembayaranPertama
        ? "Pendaftaran siswa berhasil disetujui dan pembayaran pertama otomatis disetujui."
        : "Pendaftaran siswa berhasil disetujui.",
      siswa_id: siswaId,
      user_id: userId,
      pembayaran_id: pembayaranId,
    });
  } catch (error) {
    console.error("ERROR APPROVE SISWA:", error);

    return res.status(500).json({
      message: "Gagal menyetujui pendaftaran siswa",
      error: error.message,
    });
  }
});

// =====================================================
// MASUKKAN SISWA KE KELAS
// =====================================================

router.put(
  "/masuk-kelas/:siswa_id/:kelas_id",
  authMiddleware,
  async (req, res) => {
    const siswaId = Number(req.params.siswa_id);
    const kelasId = Number(req.params.kelas_id);

    if (
      !Number.isInteger(siswaId) ||
      !Number.isInteger(kelasId) ||
      siswaId <= 0 ||
      kelasId <= 0
    ) {
      return res.status(400).json({
        message: "ID siswa atau kelas tidak valid",
      });
    }

    try {
      const result = await query(
        `
          SELECT
            siswa.nama AS nama_siswa,
            kelas.nama_kelas

          FROM siswa

          LEFT JOIN kelas
            ON kelas.id = ?

          WHERE siswa.id = ?
        `,
        [kelasId, siswaId]
      );

      if (result.length === 0) {
        return res.status(404).json({
          message: "Siswa tidak ditemukan",
        });
      }

      const namaSiswa = result[0].nama_siswa;
      const namaKelas = result[0].nama_kelas || "-";

      const updateResult = await query(
        `
          UPDATE siswa
          SET kelas_id = ?
          WHERE id = ?
        `,
        [kelasId, siswaId]
      );

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          message: "Siswa tidak ditemukan",
        });
      }

      await simpanLog({
        req,
        aktivitas: "Memasukkan siswa ke kelas",

        keterangan:
          `Admin ${req.user.nama} memasukkan siswa ` +
          `${namaSiswa} ke kelas ${namaKelas}`,
      });

      return res.json({
        message: "Siswa berhasil dimasukkan ke kelas",
      });
    } catch (error) {
      console.error("ERROR MASUKKAN SISWA KE KELAS:", error);

      return res.status(500).json({
        message: "Gagal memasukkan siswa ke kelas",
        error: error.message,
      });
    }
  }
);

// =====================================================
// KELUARKAN SISWA DARI KELAS
// =====================================================

router.put("/keluar-kelas/:siswa_id", authMiddleware, async (req, res) => {
  const siswaId = Number(req.params.siswa_id);

  if (!Number.isInteger(siswaId) || siswaId <= 0) {
    return res.status(400).json({
      message: "ID siswa tidak valid",
    });
  }

  try {
    const result = await query(
      `
          SELECT
            siswa.nama AS nama_siswa,
            kelas.nama_kelas

          FROM siswa

          LEFT JOIN kelas
            ON siswa.kelas_id = kelas.id

          WHERE siswa.id = ?
        `,
      [siswaId]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Siswa tidak ditemukan",
      });
    }

    const namaSiswa = result[0].nama_siswa;

    const namaKelas = result[0].nama_kelas || "-";

    const updateResult = await query(
      `
          UPDATE siswa
          SET kelas_id = NULL
          WHERE id = ?
        `,
      [siswaId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        message: "Siswa tidak ditemukan",
      });
    }

    await simpanLog({
      req,
      aktivitas: "Mengeluarkan siswa dari kelas",

      keterangan:
        `Admin ${req.user.nama} mengeluarkan siswa ` +
        `${namaSiswa} dari kelas ${namaKelas}`,
    });

    return res.json({
      message: "Siswa berhasil dikeluarkan dari kelas",
    });
  } catch (error) {
    console.error("ERROR KELUAR KELAS:", error);

    return res.status(500).json({
      message: "Gagal mengeluarkan siswa dari kelas",
      error: error.message,
    });
  }
});

// =====================================================
// TAMBAH SISWA
// =====================================================

router.post("/", authMiddleware, async (req, res) => {
  const {
    nama,
    email,
    password,
    asal_sekolah,
    no_hp,
    nama_orangtua,
    no_hp_orangtua,
    program_id,
  } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({
      message: "Nama, email, dan password wajib diisi",
    });
  }

  const dataSiswa = {
    nama,
    email,
    password,
    asal_sekolah,
    no_hp,
    nama_orangtua,
    no_hp_orangtua,
    program_id: program_id || null,
    status: "pending",
  };

  try {
    const result = await query("INSERT INTO siswa SET ?", dataSiswa);

    await simpanLog({
      req,
      aktivitas: "Menambahkan siswa",

      keterangan: `Admin ${req.user.nama} menambahkan siswa ` + `${nama}`,
    });

    return res.status(201).json({
      message: "Siswa berhasil ditambahkan",
      id: result.insertId,
    });
  } catch (error) {
    console.error("ERROR TAMBAH SISWA:", error);

    return res.status(500).json({
      message: "Gagal menambahkan siswa",
      error: error.message,
    });
  }
});

// =====================================================
// UPDATE SISWA
// =====================================================

router.put("/:id", authMiddleware, async (req, res) => {
  const siswaId = Number(req.params.id);

  if (!Number.isInteger(siswaId) || siswaId <= 0) {
    return res.status(400).json({
      message: "ID siswa tidak valid",
    });
  }

  const {
    nama,
    email,
    asal_sekolah,
    no_hp,
    nama_orangtua,
    no_hp_orangtua,
    program_id,
    kelas_id,
  } = req.body;

  try {
    const oldResult = await query(
      `
          SELECT *
          FROM siswa
          WHERE id = ?
          LIMIT 1
        `,
      [siswaId]
    );

    if (oldResult.length === 0) {
      return res.status(404).json({
        message: "Siswa tidak ditemukan",
      });
    }

    const siswaLama = oldResult[0];

    await query(
      `
          UPDATE siswa
          SET
            nama = ?,
            email = ?,
            asal_sekolah = ?,
            no_hp = ?,
            nama_orangtua = ?,
            no_hp_orangtua = ?,
            program_id = ?,
            kelas_id = ?
          WHERE id = ?
        `,
      [
        nama,
        email,
        asal_sekolah,
        no_hp,
        nama_orangtua,
        no_hp_orangtua,
        program_id || null,
        kelas_id || null,
        siswaId,
      ]
    );

    // =================================================
    // SINKRON USER
    // =================================================

    if (siswaLama.user_id) {
      try {
        await query(
          `
              UPDATE user
              SET
                nama = ?,
                email = ?
              WHERE id = ?
            `,
          [nama, email, siswaLama.user_id]
        );
      } catch (userError) {
        console.error("GAGAL SINKRON USER:", userError);
      }
    }

    await simpanLog({
      req,
      aktivitas: "Mengubah data siswa",

      keterangan:
        `${req.user.nama} mengubah data siswa ` + `${nama || siswaLama.nama}`,
    });

    return res.json({
      message: "Data siswa berhasil diupdate",

      siswa_id: siswaId,

      user_id: siswaLama.user_id || null,
    });
  } catch (error) {
    console.error("ERROR UPDATE SISWA:", error);

    return res.status(500).json({
      message: "Gagal mengubah data siswa",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE SISWA
// =====================================================

router.delete("/:id", authMiddleware, async (req, res) => {
  const siswaId = Number(req.params.id);

  if (!Number.isInteger(siswaId) || siswaId <= 0) {
    return res.status(400).json({
      message: "ID siswa tidak valid",
    });
  }

  try {
    const result = await query(
      `
          SELECT
            siswa.*,
            kelas.nama_kelas,
            program.nama_program

          FROM siswa

          LEFT JOIN kelas
            ON siswa.kelas_id = kelas.id

          LEFT JOIN program
            ON siswa.program_id = program.id

          WHERE siswa.id = ?

          LIMIT 1
        `,
      [siswaId]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Siswa tidak ditemukan",
      });
    }

    const siswa = result[0];
    const userId = siswa.user_id;

    const aktivitas =
      siswa.status === "pending"
        ? "Menolak pendaftaran siswa"
        : "Menghapus siswa";

    await query("DELETE FROM siswa WHERE id = ?", [siswaId]);

    if (userId) {
      await query(
        `
            DELETE FROM user
            WHERE id = ?
              AND role = 'siswa'
          `,
        [userId]
      );
    }

    await simpanLog({
      req,
      aktivitas,

      keterangan: `Admin ${req.user.nama} ${
        siswa.status === "pending"
          ? "menolak pendaftaran siswa"
          : "menghapus siswa"
      } ${siswa.nama}`,
    });

    return res.json({
      message:
        siswa.status === "pending"
          ? "Pendaftaran siswa berhasil ditolak"
          : userId
          ? "Siswa dan akun user berhasil dihapus"
          : "Siswa berhasil dihapus",
    });
  } catch (error) {
    console.error("ERROR DELETE SISWA:", error);

    return res.status(500).json({
      message: "Gagal menghapus siswa",
      error: error.message,
    });
  }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
