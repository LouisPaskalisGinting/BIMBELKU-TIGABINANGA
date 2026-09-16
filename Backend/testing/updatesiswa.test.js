const request = require("supertest");
const app = require("../server");
const db = require("../db");
const jwt = require("jsonwebtoken");

let adminToken;
let siswaValid;
let dataOriginal;

// =====================================================
// HELPER QUERY DATABASE
// =====================================================

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// =====================================================
// SETUP
// =====================================================

beforeAll(async () => {
  // ---------------------------------------------
  // Ambil data admin
  // ---------------------------------------------

  const adminResult = await query(`
    SELECT id, nama, email, role
    FROM user
    WHERE role = 'admin'
    LIMIT 1
  `);

  if (adminResult.length === 0) {
    throw new Error("Data admin tidak ditemukan.");
  }

  const admin = adminResult[0];

  // ---------------------------------------------
  // Generate JWT admin
  // ---------------------------------------------

  adminToken = jwt.sign(
    {
      id: admin.id,
      nama: admin.nama,
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET || "bimbelku_secret_key_2026",
    {
      expiresIn: "1h",
    }
  );

  // ---------------------------------------------
  // Ambil siswa yang dapat digunakan untuk testing
  // ---------------------------------------------

  const siswaResult = await query(`
    SELECT
      id,
      user_id,
      nama,
      email,
      asal_sekolah,
      no_hp,
      nama_orangtua,
      no_hp_orangtua,
      program_id,
      kelas_id
    FROM siswa
    WHERE status = 'approved'
    LIMIT 1
  `);

  if (siswaResult.length === 0) {
    throw new Error("Tidak ditemukan siswa approved untuk pengujian.");
  }

  siswaValid = siswaResult[0];

  // Simpan data asli agar dapat dikembalikan
  dataOriginal = {
    nama: siswaValid.nama,
    email: siswaValid.email,
    asal_sekolah: siswaValid.asal_sekolah,
    no_hp: siswaValid.no_hp,
    nama_orangtua: siswaValid.nama_orangtua,
    no_hp_orangtua: siswaValid.no_hp_orangtua,
    program_id: siswaValid.program_id,
    kelas_id: siswaValid.kelas_id,
  };

  console.log("\n===== DATA UPDATE SISWA =====");
  console.log("SISWA ID :", siswaValid.id);
  console.log("NAMA     :", siswaValid.nama);
  console.log("USER ID  :", siswaValid.user_id);
  console.log("==============================\n");
});

// =====================================================
// PUT /siswa/:id
// =====================================================

describe("UPDATE SISWA - PUT /siswa/:id", () => {
  // ===================================================
  // TEST 1
  // ID TIDAK VALID
  // ===================================================

  test("gagal jika ID siswa bukan angka", async () => {
    const response = await request(app)
      .put("/siswa/abc")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nama: "Testing",
        email: "testing@gmail.com",
        asal_sekolah: "SMA Testing",
        no_hp: "081234567890",
        nama_orangtua: "Orangtua Testing",
        no_hp_orangtua: "081234567891",
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("ID siswa tidak valid");
  });

  // ===================================================
  // TEST 2
  // ID NEGATIF
  // ===================================================

  test("gagal jika ID siswa bernilai negatif", async () => {
    const response = await request(app)
      .put("/siswa/-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nama: "Testing",
        email: "testing@gmail.com",
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("ID siswa tidak valid");
  });

  // ===================================================
  // TEST 3
  // ID NOL
  // ===================================================

  test("gagal jika ID siswa bernilai nol", async () => {
    const response = await request(app)
      .put("/siswa/0")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nama: "Testing",
        email: "testing@gmail.com",
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("ID siswa tidak valid");
  });

  // ===================================================
  // TEST 4
  // SISWA TIDAK DITEMUKAN
  // ===================================================

  test("gagal jika siswa tidak ditemukan", async () => {
    const response = await request(app)
      .put("/siswa/999999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nama: "Siswa Testing",
        email: "testing@gmail.com",
        asal_sekolah: "SMA Testing",
        no_hp: "081234567890",
        nama_orangtua: "Orangtua Testing",
        no_hp_orangtua: "081234567891",
        program_id: null,
        kelas_id: null,
      });

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Siswa tidak ditemukan");
  });

  // ===================================================
  // TEST 5
  // TANPA TOKEN
  // ===================================================

  test("gagal jika tidak menggunakan token autentikasi", async () => {
    const response = await request(app).put(`/siswa/${siswaValid.id}`).send({
      nama: "Testing Tanpa Token",
      email: "testing@gmail.com",
    });

    expect([401, 403]).toContain(response.status);
  });

  // ===================================================
  // TEST 6
  // UPDATE DATA SISWA
  // ===================================================

  test("berhasil mengupdate data siswa", async () => {
    const dataUpdate = {
      nama: "Siswa Jest Updated",
      email: `siswa_updated_${Date.now()}@gmail.com`,
      asal_sekolah: "SMA Jest Updated",
      no_hp: "081234567899",
      nama_orangtua: "Orangtua Jest Updated",
      no_hp_orangtua: "081234567898",
      program_id: siswaValid.program_id || null,
      kelas_id: siswaValid.kelas_id || null,
    };

    const response = await request(app)
      .put(`/siswa/${siswaValid.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(dataUpdate);

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Data siswa berhasil diupdate");

    expect(response.body).toHaveProperty("siswa_id");

    expect(response.body.siswa_id).toBe(siswaValid.id);

    expect(response.body).toHaveProperty("user_id");

    // ---------------------------------------------
    // Verifikasi database siswa
    // ---------------------------------------------

    const result = await query(
      `
        SELECT
          nama,
          email,
          asal_sekolah,
          no_hp,
          nama_orangtua,
          no_hp_orangtua,
          program_id,
          kelas_id
        FROM siswa
        WHERE id = ?
      `,
      [siswaValid.id]
    );

    expect(result.length).toBe(1);

    expect(result[0].nama).toBe(dataUpdate.nama);

    expect(result[0].email).toBe(dataUpdate.email);

    expect(result[0].asal_sekolah).toBe(dataUpdate.asal_sekolah);

    expect(result[0].no_hp).toBe(dataUpdate.no_hp);
  });

  // ===================================================
  // TEST 7
  // UPDATE DENGAN PROGRAM NULL
  // ===================================================

  test("berhasil mengupdate siswa tanpa program dan kelas", async () => {
    const dataUpdate = {
      nama: "Siswa Jest Null",
      email: `siswa_null_${Date.now()}@gmail.com`,
      asal_sekolah: "SMA Testing",
      no_hp: "081234567877",
      nama_orangtua: "Orangtua Testing",
      no_hp_orangtua: "081234567876",
      program_id: null,
      kelas_id: null,
    };

    const response = await request(app)
      .put(`/siswa/${siswaValid.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(dataUpdate);

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Data siswa berhasil diupdate");

    // Verifikasi nilai NULL
    const result = await query(
      `
        SELECT program_id, kelas_id
        FROM siswa
        WHERE id = ?
      `,
      [siswaValid.id]
    );

    expect(result.length).toBe(1);

    expect(result[0].program_id).toBeNull();
    expect(result[0].kelas_id).toBeNull();
  });

  // ===================================================
  // TEST 8
  // VERIFIKASI SINKRONISASI USER
  // ===================================================

  test("berhasil melakukan sinkronisasi nama dan email ke tabel user", async () => {
    // Ambil siswa terbaru
    const siswaResult = await query(
      `
        SELECT user_id, nama, email
        FROM siswa
        WHERE id = ?
      `,
      [siswaValid.id]
    );

    expect(siswaResult.length).toBe(1);

    const siswa = siswaResult[0];

    // Jika siswa tidak memiliki user_id,
    // branch sinkronisasi memang tidak dijalankan.
    if (!siswa.user_id) {
      console.log("Siswa tidak memiliki user_id, sinkronisasi user dilewati.");
      return;
    }

    const userResult = await query(
      `
        SELECT nama, email
        FROM user
        WHERE id = ?
      `,
      [siswa.user_id]
    );

    expect(userResult.length).toBe(1);

    expect(userResult[0].nama).toBe(siswa.nama);

    expect(userResult[0].email).toBe(siswa.email);
  });
});

// =====================================================
// RESTORE DATA
// =====================================================

afterAll(async () => {
  if (!siswaValid || !dataOriginal) {
    return;
  }

  try {
    // ---------------------------------------------
    // Kembalikan data siswa seperti semula
    // ---------------------------------------------

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
        dataOriginal.nama,
        dataOriginal.email,
        dataOriginal.asal_sekolah,
        dataOriginal.no_hp,
        dataOriginal.nama_orangtua,
        dataOriginal.no_hp_orangtua,
        dataOriginal.program_id,
        dataOriginal.kelas_id,
        siswaValid.id,
      ]
    );

    // ---------------------------------------------
    // Kembalikan data user jika siswa memiliki user_id
    // ---------------------------------------------

    if (siswaValid.user_id) {
      await query(
        `
          UPDATE user
          SET
            nama = ?,
            email = ?
          WHERE id = ?
        `,
        [dataOriginal.nama, dataOriginal.email, siswaValid.user_id]
      );
    }

    console.log("Data siswa berhasil dikembalikan seperti semula.");
  } catch (error) {
    console.error("Gagal mengembalikan data siswa:", error.message);
  }
});
