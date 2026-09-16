const express = require("express");
const router = express.Router();
const db = require("../db");

const multer = require("multer");
const XLSX = require("xlsx");

const authMiddleware = require("../middleware/authMiddleware");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// HELPER QUERY PROMISE
// =====================================================

const queryPromise = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
};

// =====================================================
// HELPER NORMALISASI TEXT
// =====================================================

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

// =====================================================
// HELPER NORMALISASI KOLOM EXCEL
// =====================================================

const normalizeColumnName = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
};

// =====================================================
// HELPER CARI KOLOM EXCEL
// =====================================================

const findColumn = (row, possibleNames) => {
  const keys = Object.keys(row);

  for (const key of keys) {
    const normalizedKey = normalizeColumnName(key);

    for (const possibleName of possibleNames) {
      if (normalizedKey === normalizeColumnName(possibleName)) {
        return key;
      }
    }
  }

  return null;
};

// =====================================================
// HELPER NORMALISASI NILAI
// =====================================================

const normalizeNilai = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  let text = String(value).trim();

  if (!text) {
    return null;
  }

  text = text.replace(/,/g, ".");
  text = text.replace(/\s+/g, "");
  text = text.replace(/\.{2,}/g, ".");

  const number = Number(text);

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
};

// =====================================================
// HELPER CARI SISWA BERDASARKAN NAMA
// =====================================================

const cariSiswa = async (namaExcel) => {
  const namaNormal = normalizeText(namaExcel);

  if (!namaNormal) {
    return null;
  }

  // ---------------------------------------------------
  // 1. NAMA PERSIS
  // ---------------------------------------------------

  let result = await queryPromise(
    `
      SELECT
        id,
        user_id,
        nama,
        email,
        status
      FROM siswa
      WHERE status = 'approved'
        AND LOWER(TRIM(nama)) = ?
      LIMIT 1
    `,
    [namaNormal]
  );

  if (result.length > 0) {
    return result[0];
  }

  // ---------------------------------------------------
  // 2. NAMA DIAWALI NAMA EXCEL
  // ---------------------------------------------------

  result = await queryPromise(
    `
      SELECT
        id,
        user_id,
        nama,
        email,
        status
      FROM siswa
      WHERE status = 'approved'
        AND LOWER(TRIM(nama)) LIKE ?
      ORDER BY id ASC
    `,
    [`${namaNormal}%`]
  );

  if (result.length === 1) {
    return result[0];
  }

  // ---------------------------------------------------
  // 3. NAMA DEPAN
  // ---------------------------------------------------

  const namaDepan = namaNormal.split(" ")[0];

  result = await queryPromise(
    `
      SELECT
        id,
        user_id,
        nama,
        email,
        status
      FROM siswa
      WHERE status = 'approved'
        AND LOWER(TRIM(nama)) LIKE ?
      ORDER BY id ASC
    `,
    [`${namaDepan}%`]
  );

  if (result.length === 1) {
    return result[0];
  }

  return null;
};

// =====================================================
// GET SISWA BERDASARKAN USER ID
// =====================================================
//
// Contoh:
// user.id = 24
// siswa.user_id = 24
// siswa.id = 47
//
// GET /nilai/siswa/user/24
//
// =====================================================

router.get("/siswa/user/:user_id", authMiddleware, async (req, res) => {
  const { user_id } = req.params;

  try {
    console.log("====================================");
    console.log("MENCARI DATA SISWA BERDASARKAN USER ID");
    console.log("USER ID:", user_id);
    console.log("====================================");

    const result = await queryPromise(
      `
          SELECT
            siswa.id,
            siswa.user_id,
            siswa.nama,
            siswa.email,
            siswa.status
          FROM siswa
          WHERE siswa.user_id = ?
            AND siswa.status = 'approved'
          LIMIT 1
        `,
      [user_id]
    );

    console.log("HASIL SISWA:", result);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data siswa berdasarkan user ID tidak ditemukan.",
      });
    }

    return res.json(result[0]);
  } catch (error) {
    console.error("ERROR MENCARI SISWA BERDASARKAN USER ID:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data siswa.",
      error: error.message,
    });
  }
});

// =====================================================
// GET SEMUA NILAI BERDASARKAN USER ID
// =====================================================
//
// Ini endpoint utama untuk halaman siswa.
//
// user.id Louis = 24
//
// GET:
// /nilai/siswa/user/24
//
// Backend mencari:
// siswa.user_id = 24
//
// kemudian mengambil:
// nilai.siswa_id = siswa.id
//
// =====================================================

router.get("/siswa/user/:user_id/nilai", authMiddleware, async (req, res) => {
  const { user_id } = req.params;

  try {
    console.log("====================================");
    console.log("MENGAMBIL SEMUA NILAI BERDASARKAN USER ID");
    console.log("USER ID:", user_id);
    console.log("====================================");

    const sql = `
        SELECT
          nilai.id,
          nilai.siswa_id,
          nilai.event_id,
          nilai.nilai,
          siswa.nama,
          siswa.email,
          siswa.user_id,
          event.judul AS nama_event
        FROM nilai
        INNER JOIN siswa
          ON nilai.siswa_id = siswa.id
        LEFT JOIN event
          ON nilai.event_id = event.id
        WHERE siswa.user_id = ?
        ORDER BY nilai.id DESC
      `;

    const result = await queryPromise(sql, [user_id]);

    console.log("HASIL NILAI:", result);

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET NILAI BERDASARKAN USER ID:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil nilai siswa.",
      error: error.message,
    });
  }
});

// =====================================================
// GET NILAI BERDASARKAN USER ID + EVENT
// =====================================================
//
// Contoh Louis:
//
// user.id = 24
// event.id = 57
//
// GET:
// /nilai/siswa/user/24/event/57
//
// =====================================================

router.get(
  "/siswa/user/:user_id/event/:event_id",
  authMiddleware,
  async (req, res) => {
    const { user_id, event_id } = req.params;

    try {
      console.log("====================================");
      console.log("MENGAMBIL NILAI SISWA");
      console.log("USER ID:", user_id);
      console.log("EVENT ID:", event_id);
      console.log("====================================");

      const sql = `
        SELECT
          nilai.id,
          nilai.siswa_id,
          nilai.event_id,
          nilai.nilai,
          siswa.nama,
          siswa.email,
          siswa.user_id,
          event.judul AS nama_event
        FROM nilai
        INNER JOIN siswa
          ON nilai.siswa_id = siswa.id
        LEFT JOIN event
          ON nilai.event_id = event.id
        WHERE siswa.user_id = ?
          AND nilai.event_id = ?
        ORDER BY nilai.id DESC
      `;

      const result = await queryPromise(sql, [user_id, event_id]);

      console.log("HASIL NILAI EVENT:", result);

      return res.json(result);
    } catch (error) {
      console.error("ERROR GET NILAI SISWA EVENT:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil nilai siswa berdasarkan event.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET NILAI BERDASARKAN SISWA ID
// =====================================================
//
// Tetap dipertahankan.
//
// GET:
// /nilai/siswa/:siswa_id
//
// =====================================================

router.get("/siswa/:siswa_id", authMiddleware, async (req, res) => {
  const { siswa_id } = req.params;

  try {
    console.log("====================================");
    console.log("MENGAMBIL NILAI BERDASARKAN SISWA ID");
    console.log("SISWA ID:", siswa_id);
    console.log("====================================");

    const sql = `
        SELECT
          nilai.id,
          nilai.siswa_id,
          nilai.event_id,
          nilai.nilai,
          siswa.nama,
          event.judul AS nama_event
        FROM nilai
        INNER JOIN siswa
          ON nilai.siswa_id = siswa.id
        LEFT JOIN event
          ON nilai.event_id = event.id
        WHERE nilai.siswa_id = ?
        ORDER BY nilai.id DESC
      `;

    const result = await queryPromise(sql, [siswa_id]);

    console.log("HASIL NILAI:", result);

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET SEMUA NILAI SISWA:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil seluruh nilai siswa.",
      error: error.message,
    });
  }
});

// =====================================================
// GET NILAI BERDASARKAN SISWA ID + EVENT ID
// =====================================================
//
// GET:
// /nilai/siswa/:event_id/:siswa_id
//
// =====================================================

router.get("/siswa/:event_id/:siswa_id", authMiddleware, async (req, res) => {
  const { event_id, siswa_id } = req.params;

  try {
    console.log("====================================");
    console.log("MENGAMBIL NILAI SISWA BERDASARKAN EVENT");
    console.log("EVENT ID:", event_id);
    console.log("SISWA ID:", siswa_id);
    console.log("====================================");

    const sql = `
        SELECT
          nilai.id,
          nilai.siswa_id,
          nilai.event_id,
          nilai.nilai,
          siswa.nama,
          event.judul AS nama_event
        FROM nilai
        INNER JOIN siswa
          ON nilai.siswa_id = siswa.id
        LEFT JOIN event
          ON nilai.event_id = event.id
        WHERE nilai.event_id = ?
          AND nilai.siswa_id = ?
        ORDER BY nilai.id DESC
      `;

    const result = await queryPromise(sql, [event_id, siswa_id]);

    console.log("HASIL NILAI EVENT:", result);

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET NILAI SISWA:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data nilai siswa.",
      error: error.message,
    });
  }
});

// =====================================================
// KONFIGURASI MULTER
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "-");

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});

// =====================================================
// UPLOAD NILAI DARI EXCEL
// =====================================================
//
// POST:
// /nilai/upload/:event_id
//
// =====================================================

router.post(
  "/upload/:event_id",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    console.log("====================================");
    console.log("UPLOAD NILAI DIMULAI");
    console.log("====================================");

    console.log("USER LOGIN:");
    console.log(req.user);

    const event_id = req.params.event_id;

    console.log("EVENT ID:", event_id);

    if (req.file) {
      console.log("FILE:", req.file.filename);
    }

    // ---------------------------------------------------
    // CEK FILE
    // ---------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File Excel tidak ditemukan.",
      });
    }

    // ---------------------------------------------------
    // CEK EXTENSION
    // ---------------------------------------------------

    const namaFile = req.file.originalname.toLowerCase();

    if (!namaFile.endsWith(".xlsx")) {
      return res.status(400).json({
        success: false,
        message: "File harus berformat Excel (.xlsx).",
      });
    }

    try {
      // -------------------------------------------------
      // CEK EVENT
      // -------------------------------------------------

      const eventResult = await queryPromise(
        `
          SELECT
            id,
            judul,
            tanggal
          FROM event
          WHERE id = ?
          LIMIT 1
        `,
        [event_id]
      );

      if (eventResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Event tidak ditemukan.",
        });
      }

      const eventData = eventResult[0];
      const namaEvent = eventData.judul || "-";

      console.log("NAMA EVENT:", namaEvent);

      // -------------------------------------------------
      // BACA EXCEL
      // -------------------------------------------------

      const workbook = XLSX.readFile(req.file.path);

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Sheet Excel tidak ditemukan.",
        });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      console.log("SHEET:", sheetName);

      // -------------------------------------------------
      // DATA EXCEL
      // -------------------------------------------------

      const data = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      });

      console.log("====================================");
      console.log("DATA RAW EXCEL");
      console.log("====================================");

      console.log(data);

      if (!data || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "File Excel tidak memiliki data.",
        });
      }

      // -------------------------------------------------
      // CARI KOLOM NAMA
      // -------------------------------------------------

      const namaColumn = findColumn(data[0], [
        "Nama Siswa",
        "nama siswa",
        "Nama",
        "nama",
        "NamaSiswa",
      ]);

      // -------------------------------------------------
      // CARI KOLOM NILAI
      // -------------------------------------------------

      const nilaiColumn = findColumn(data[0], [
        "Nilai",
        "nilai",
        "Nilai Akhir",
        "nilai akhir",
      ]);

      console.log("KOLOM NAMA:", namaColumn);
      console.log("KOLOM NILAI:", nilaiColumn);

      // -------------------------------------------------
      // VALIDASI
      // -------------------------------------------------

      if (!namaColumn) {
        return res.status(400).json({
          success: false,
          message: "Kolom 'Nama Siswa' tidak ditemukan dalam spreadsheet.",
          kolom_tersedia: Object.keys(data[0]),
        });
      }

      if (!nilaiColumn) {
        return res.status(400).json({
          success: false,
          message: "Kolom 'Nilai' tidak ditemukan dalam spreadsheet.",
          kolom_tersedia: Object.keys(data[0]),
        });
      }

      // -------------------------------------------------
      // HASIL
      // -------------------------------------------------

      let jumlahNilai = 0;

      const siswaTidakDitemukan = [];
      const dataTidakValid = [];
      const dataBerhasil = [];

      // -------------------------------------------------
      // PROSES EXCEL
      // -------------------------------------------------

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const nomorBarisExcel = i + 2;

        console.log("------------------------------------");
        console.log(`MEMPROSES BARIS EXCEL: ${nomorBarisExcel}`);
        console.log("DATA:", row);

        // ------------------------------------------------
        // NAMA
        // ------------------------------------------------

        const namaExcel = String(row[namaColumn] || "").trim();

        // ------------------------------------------------
        // NILAI
        // ------------------------------------------------

        const nilaiRaw = row[nilaiColumn];

        console.log("NAMA SISWA:", namaExcel);
        console.log("NILAI RAW:", nilaiRaw);

        // ------------------------------------------------
        // NAMA KOSONG
        // ------------------------------------------------

        if (!namaExcel) {
          console.log("NAMA SISWA KOSONG");

          dataTidakValid.push({
            baris: nomorBarisExcel,
            nama: "",
            nilai: nilaiRaw,
            alasan: "Nama siswa kosong",
          });

          continue;
        }

        // ------------------------------------------------
        // NORMALISASI NILAI
        // ------------------------------------------------

        const nilaiNumber = normalizeNilai(nilaiRaw);

        console.log("NILAI SETELAH NORMALISASI:", nilaiNumber);

        if (nilaiNumber === null) {
          dataTidakValid.push({
            baris: nomorBarisExcel,
            nama: namaExcel,
            nilai: nilaiRaw,
            alasan: "Nilai bukan angka",
          });

          continue;
        }

        // ------------------------------------------------
        // VALIDASI NILAI
        // ------------------------------------------------

        if (nilaiNumber < 0 || nilaiNumber > 100) {
          dataTidakValid.push({
            baris: nomorBarisExcel,
            nama: namaExcel,
            nilai: nilaiNumber,
            alasan: "Nilai harus berada pada rentang 0-100",
          });

          continue;
        }

        // ------------------------------------------------
        // CARI SISWA
        // ------------------------------------------------

        console.log("MENCARI SISWA:", namaExcel);

        const siswa = await cariSiswa(namaExcel);

        // ------------------------------------------------
        // TIDAK DITEMUKAN
        // ------------------------------------------------

        if (!siswa) {
          console.log("SISWA TIDAK DITEMUKAN:", namaExcel);

          siswaTidakDitemukan.push({
            baris: nomorBarisExcel,
            nama_excel: namaExcel,
            nilai: nilaiNumber,
            alasan: "Siswa tidak ditemukan atau nama tidak unik",
          });

          continue;
        }

        // ------------------------------------------------
        // DATA SISWA
        // ------------------------------------------------

        const siswa_id = siswa.id;

        console.log("SISWA DITEMUKAN");
        console.log("NAMA DATABASE:", siswa.nama);
        console.log("SISWA ID:", siswa_id);
        console.log("USER ID:", siswa.user_id);
        console.log("NILAI:", nilaiNumber);

        // ------------------------------------------------
        // CEK NILAI EXISTING
        // ------------------------------------------------

        const nilaiExisting = await queryPromise(
          `
            SELECT
              id,
              nilai
            FROM nilai
            WHERE siswa_id = ?
              AND event_id = ?
            LIMIT 1
          `,
          [siswa_id, event_id]
        );

        // ------------------------------------------------
        // UPDATE
        // ------------------------------------------------

        if (nilaiExisting.length > 0) {
          console.log("NILAI SUDAH ADA, MELAKUKAN UPDATE");

          await queryPromise(
            `
              UPDATE nilai
              SET nilai = ?
              WHERE id = ?
            `,
            [nilaiNumber, nilaiExisting[0].id]
          );

          console.log("NILAI BERHASIL DIUPDATE:", siswa.nama, nilaiNumber);
        }

        // ------------------------------------------------
        // INSERT
        // ------------------------------------------------
        else {
          console.log("NILAI BELUM ADA, MELAKUKAN INSERT");

          const insertResult = await queryPromise(
            `
                INSERT INTO nilai
                (
                  siswa_id,
                  event_id,
                  nilai
                )
                VALUES (?, ?, ?)
              `,
            [siswa_id, event_id, nilaiNumber]
          );

          console.log("NILAI BERHASIL DIINSERT");

          console.log("NILAI ID:", insertResult.insertId);
        }

        // ------------------------------------------------
        // BERHASIL
        // ------------------------------------------------

        jumlahNilai++;

        dataBerhasil.push({
          siswa_id: siswa_id,
          user_id: siswa.user_id,
          nama: siswa.nama,
          nama_excel: namaExcel,
          event_id: Number(event_id),
          nilai: nilaiNumber,
        });
      }

      // ---------------------------------------------------
      // SIMPAN FILE
      // ---------------------------------------------------

      await queryPromise(
        `
          INSERT INTO file_nilai
          (
            event_id,
            nama_file,
            path_file
          )
          VALUES (?, ?, ?)
        `,
        [event_id, req.file.originalname, req.file.filename]
      );

      console.log("FILE NILAI BERHASIL DISIMPAN");

      // ---------------------------------------------------
      // LOG AKTIVITAS
      // ---------------------------------------------------

      try {
        await logAktivitas({
          user_id: req.user?.id,
          nama_user: req.user?.nama,
          role: req.user?.role,
          aktivitas: "Upload Nilai",
          keterangan:
            `Mengupload file nilai "${req.file.originalname}" ` +
            `untuk event "${namaEvent}". ` +
            `${jumlahNilai} data nilai berhasil diproses.`,
        });

        console.log("LOG AKTIVITAS BERHASIL DISIMPAN");
      } catch (logError) {
        console.error("GAGAL MENYIMPAN LOG AKTIVITAS:", logError);
      }

      // ---------------------------------------------------
      // RESPONSE
      // ---------------------------------------------------

      console.log("====================================");
      console.log("UPLOAD NILAI SELESAI");
      console.log("====================================");

      console.log("JUMLAH BERHASIL:", jumlahNilai);

      console.log("TIDAK DITEMUKAN:", siswaTidakDitemukan.length);

      console.log("TIDAK VALID:", dataTidakValid.length);

      console.log("====================================");

      return res.json({
        success: true,
        message: "File nilai berhasil diproses.",
        event_id: Number(event_id),
        nama_event: namaEvent,
        nama_file: req.file.originalname,
        jumlah_data: jumlahNilai,
        jumlah_tidak_ditemukan: siswaTidakDitemukan.length,
        jumlah_data_tidak_valid: dataTidakValid.length,
        siswa_tidak_ditemukan: siswaTidakDitemukan,
        data_tidak_valid: dataTidakValid,
        data_berhasil: dataBerhasil,
      });
    } catch (error) {
      console.error("====================================");
      console.error("ERROR UPLOAD NILAI:");
      console.error(error);
      console.error("====================================");

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memproses file nilai.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET FILE NILAI BERDASARKAN EVENT
// =====================================================

router.get("/files/:event_id", authMiddleware, async (req, res) => {
  const event_id = req.params.event_id;

  try {
    const result = await queryPromise(
      `
          SELECT
            id,
            event_id,
            nama_file,
            path_file
          FROM file_nilai
          WHERE event_id = ?
          ORDER BY id DESC
        `,
      [event_id]
    );

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET FILE NILAI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil file nilai.",
      error: error.message,
    });
  }
});

// =====================================================
// GET SEMUA NILAI BERDASARKAN EVENT
// =====================================================

router.get("/event/:event_id", authMiddleware, async (req, res) => {
  const event_id = req.params.event_id;

  try {
    const result = await queryPromise(
      `
          SELECT
            nilai.id,
            nilai.siswa_id,
            nilai.event_id,
            nilai.nilai,
            siswa.nama,
            siswa.email,
            siswa.user_id,
            event.judul AS nama_event
          FROM nilai
          INNER JOIN siswa
            ON nilai.siswa_id = siswa.id
          LEFT JOIN event
            ON nilai.event_id = event.id
          WHERE nilai.event_id = ?
          ORDER BY siswa.nama ASC
        `,
      [event_id]
    );

    return res.json(result);
  } catch (error) {
    console.error("ERROR GET NILAI EVENT:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil nilai berdasarkan event.",
      error: error.message,
    });
  }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
