const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const db = require("../db");

// =====================================================
// HELPER QUERY
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
// DATA TEST
// =====================================================

let token;

let adminId;
let adminNama;
let adminRole;

let pembayaranId;
let siswaId;
let namaSiswa;

let detailId;

let originalSudahDibayar;

const nominalTest = 1000;

// =====================================================
// BEFORE ALL
// =====================================================

beforeAll(async () => {
  // ===================================================
  // AMBIL ADMIN
  // ===================================================

  const admin = await query(`
    SELECT
      id,
      nama,
      role
    FROM user
    WHERE role = 'admin'
    LIMIT 1
  `);

  if (admin.length === 0) {
    throw new Error("Data admin tidak ditemukan di database");
  }

  adminId = admin[0].id;
  adminNama = admin[0].nama;
  adminRole = admin[0].role;

  // ===================================================
  // BUAT TOKEN ADMIN
  // ===================================================

  token = jwt.sign(
    {
      id: adminId,
      nama: adminNama,
      role: adminRole,
    },
    process.env.JWT_SECRET || "bimbelku_secret_key_2026",
    {
      expiresIn: "1h",
    }
  );

  // ===================================================
  // AMBIL DATA PEMBAYARAN
  // ===================================================

  const pembayaran = await query(`
    SELECT
      pembayaran.id,
      pembayaran.siswa_id,
      pembayaran.total_tagihan,
      pembayaran.sudah_dibayar,
      siswa.nama AS nama_siswa
    FROM pembayaran
    INNER JOIN siswa
      ON pembayaran.siswa_id = siswa.id
    ORDER BY pembayaran.id DESC
    LIMIT 1
  `);

  if (pembayaran.length === 0) {
    throw new Error("Data pembayaran tidak ditemukan di database");
  }

  pembayaranId = pembayaran[0].id;
  siswaId = pembayaran[0].siswa_id;
  namaSiswa = pembayaran[0].nama_siswa;

  originalSudahDibayar = Number(pembayaran[0].sudah_dibayar) || 0;

  // ===================================================
  // CEK SISA TAGIHAN
  // ===================================================

  const totalTagihan = Number(pembayaran[0].total_tagihan) || 0;

  const sudahDibayar = Number(pembayaran[0].sudah_dibayar) || 0;

  const sisaTagihan = totalTagihan - sudahDibayar;

  // ===================================================
  // JIKA TIDAK ADA SISA TAGIHAN
  // BUAT PEMBAYARAN SEMENTARA
  // ===================================================

  if (sisaTagihan < nominalTest) {
    const temporaryPayment = await query(
      `
      INSERT INTO pembayaran
      (
        siswa_id,
        total_tagihan,
        sudah_dibayar
      )
      VALUES (?, ?, ?)
      `,
      [siswaId, 100000, 0]
    );

    pembayaranId = temporaryPayment.insertId;

    originalSudahDibayar = 0;
  }

  // ===================================================
  // BUAT DETAIL PEMBAYARAN PENDING
  // ===================================================

  const detail = await query(
    `
    INSERT INTO pembayaran_detail
    (
      pembayaran_id,
      jumlah,
      tanggal,
      bukti_pembayaran,
      status
    )
    VALUES
    (
      ?,
      ?,
      NOW(),
      ?,
      'pending'
    )
    `,
    [pembayaranId, nominalTest, "test-approve-pembayaran.jpg"]
  );

  detailId = detail.insertId;
});

// =====================================================
// PUT /pembayaran/approve/:detailId
// =====================================================

describe("PUT /pembayaran/approve/:detailId", () => {
  // ===================================================
  // TEST 1
  // ===================================================

  test("gagal tanpa token autentikasi", async () => {
    const response = await request(app)
      .put(`/pembayaran/approve/${detailId}`)
      .expect(401);

    expect(response.body).toBeDefined();
  });

  // ===================================================
  // TEST 2
  // ===================================================

  test("gagal jika detail pembayaran tidak ditemukan", async () => {
    const response = await request(app)
      .put("/pembayaran/approve/999999999")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body.message).toBe("Detail pembayaran tidak ditemukan");
  });

  // ===================================================
  // TEST 3
  // ===================================================

  test("berhasil menyetujui pembayaran", async () => {
    // -----------------------------------------------
    // Ambil kondisi pembayaran sebelum approve
    // -----------------------------------------------

    const before = await query(
      `
      SELECT
        sudah_dibayar
      FROM pembayaran
      WHERE id = ?
      `,
      [pembayaranId]
    );

    expect(before.length).toBe(1);

    const sudahDibayarSebelum = Number(before[0].sudah_dibayar) || 0;

    // -----------------------------------------------
    // Pastikan detail masih pending
    // -----------------------------------------------

    const detailBefore = await query(
      `
      SELECT
        id,
        pembayaran_id,
        jumlah,
        status
      FROM pembayaran_detail
      WHERE id = ?
      `,
      [detailId]
    );

    expect(detailBefore.length).toBe(1);

    expect(detailBefore[0].status).toBe("pending");

    expect(Number(detailBefore[0].jumlah)).toBe(nominalTest);

    // -----------------------------------------------
    // Jalankan endpoint approve
    // -----------------------------------------------

    const response = await request(app)
      .put(`/pembayaran/approve/${detailId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // -----------------------------------------------
    // Periksa response
    // -----------------------------------------------

    expect(response.body.message).toBe("Pembayaran disetujui");

    expect(response.body.nama_siswa).toBe(namaSiswa);

    // -----------------------------------------------
    // Periksa status detail
    // -----------------------------------------------

    const detailAfter = await query(
      `
      SELECT
        status
      FROM pembayaran_detail
      WHERE id = ?
      `,
      [detailId]
    );

    expect(detailAfter.length).toBe(1);

    expect(detailAfter[0].status).toBe("approved");

    // -----------------------------------------------
    // Periksa jumlah pembayaran
    // -----------------------------------------------

    const after = await query(
      `
      SELECT
        sudah_dibayar
      FROM pembayaran
      WHERE id = ?
      `,
      [pembayaranId]
    );

    expect(after.length).toBe(1);

    const sudahDibayarSesudah = Number(after[0].sudah_dibayar) || 0;

    expect(sudahDibayarSesudah).toBe(sudahDibayarSebelum + nominalTest);
  });

  // ===================================================
  // TEST 4
  // ===================================================

  test("gagal jika pembayaran sudah diproses", async () => {
    const response = await request(app)
      .put(`/pembayaran/approve/${detailId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(response.body.message).toBe("Pembayaran sudah diproses");
  });
});

// =====================================================
// CLEANUP
// =====================================================

afterAll(async () => {
  // ===================================================
  // HAPUS DETAIL TEST
  // ===================================================

  if (detailId) {
    await query(
      `
      DELETE FROM pembayaran_detail
      WHERE id = ?
      `,
      [detailId]
    );
  }

  // ===================================================
  // KEMBALIKAN NILAI PEMBAYARAN
  // ===================================================

  if (pembayaranId) {
    await query(
      `
      UPDATE pembayaran
      SET sudah_dibayar = ?
      WHERE id = ?
      `,
      [originalSudahDibayar, pembayaranId]
    );
  }
});
