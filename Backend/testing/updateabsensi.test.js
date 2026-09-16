const request = require("supertest");
const db = require("../db");
const app = require("../server");

describe("PUT /absensi/:id", () => {
  let absensiId;
  let tempAbsensiId;

  // ======================================================
  // HELPER QUERY
  // ======================================================

  const query = (sql, values = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  // ======================================================
  // SETUP DATA ABSENSI UNTUK TEST
  // ======================================================

  beforeAll(async () => {
    // ----------------------------------------------------
    // Cari siswa approved yang mempunyai kelas
    // ----------------------------------------------------

    const siswaResult = await query(`
      SELECT id, kelas_id
      FROM siswa
      WHERE status = 'approved'
        AND kelas_id IS NOT NULL
      LIMIT 1
    `);

    if (siswaResult.length === 0) {
      throw new Error(
        "Tidak ditemukan siswa approved yang mempunyai kelas_id."
      );
    }

    const siswaId = siswaResult[0].id;
    const kelasId = siswaResult[0].kelas_id;

    // ----------------------------------------------------
    // Cari jadwal dari kelas siswa
    // ----------------------------------------------------

    const jadwalResult = await query(
      `
      SELECT id
      FROM jadwal
      WHERE kelas_id = ?
      LIMIT 1
      `,
      [kelasId]
    );

    if (jadwalResult.length === 0) {
      throw new Error("Tidak ditemukan jadwal untuk kelas siswa.");
    }

    const jadwalId = jadwalResult[0].id;

    // ----------------------------------------------------
    // Buat data absensi sementara
    // ----------------------------------------------------

    const insertResult = await query(
      `
      INSERT INTO absensi
      (
        jadwal_id,
        siswa_id,
        tanggal,
        status
      )
      VALUES (?, ?, '2099-12-31', 'alpha')
      `,
      [jadwalId, siswaId]
    );

    tempAbsensiId = insertResult.insertId;
    absensiId = tempAbsensiId;

    console.log("");
    console.log("======================================");
    console.log("SETUP UPDATE ABSENSI TEST");
    console.log("Siswa ID   :", siswaId);
    console.log("Jadwal ID  :", jadwalId);
    console.log("Absensi ID :", absensiId);
    console.log("======================================");
    console.log("");
  });

  // ======================================================
  // 1. ID TIDAK VALID
  // ======================================================

  test("gagal jika ID absensi tidak valid", async () => {
    const response = await request(app).put("/absensi/abc").send({
      status: "hadir",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("ID absensi tidak valid");
  });

  // ======================================================
  // 2. ID = 0
  // ======================================================

  test("gagal jika ID absensi bernilai 0", async () => {
    const response = await request(app).put("/absensi/0").send({
      status: "hadir",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("ID absensi tidak valid");
  });

  // ======================================================
  // 3. ID NEGATIF
  // ======================================================

  test("gagal jika ID absensi bernilai negatif", async () => {
    const response = await request(app).put("/absensi/-1").send({
      status: "hadir",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("ID absensi tidak valid");
  });

  // ======================================================
  // 4. STATUS TIDAK DIISI
  // ======================================================

  test("gagal jika status tidak diisi", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({});

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("Status wajib diisi");
  });

  // ======================================================
  // 5. STATUS NULL
  // ======================================================

  test("gagal jika status bernilai null", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({
      status: null,
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("Status wajib diisi");
  });

  // ======================================================
  // 6. STATUS BUKAN STRING
  // ======================================================

  test("gagal jika status bukan string", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({
      status: 123,
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Status tidak valid. Gunakan hadir, izin, sakit, atau alpha."
    );
  });

  // ======================================================
  // 7. STATUS TIDAK VALID
  // ======================================================

  test("gagal jika status tidak valid", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({
      status: "terlambat",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Status tidak valid. Gunakan hadir, izin, sakit, atau alpha."
    );
  });

  // ======================================================
  // 8. STATUS STRING KOSONG
  // ======================================================

  test("gagal jika status berupa string kosong", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({
      status: "",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("Status wajib diisi");
  });

  // ======================================================
  // 9. DATA ABSENSI TIDAK DITEMUKAN
  // ======================================================

  test("gagal jika data absensi tidak ditemukan", async () => {
    const response = await request(app).put("/absensi/999999999").send({
      status: "hadir",
    });

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("Data absensi tidak ditemukan");
  });

  // ======================================================
  // 10. BERHASIL MENGUBAH STATUS MENJADI HADIR
  // ======================================================

  test("berhasil mengubah status menjadi hadir", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({
      status: "hadir",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe("Status absensi berhasil diupdate");

    expect(response.body.status).toBe("hadir");

    // Verifikasi langsung ke database
    const rows = await query(
      `
      SELECT status
      FROM absensi
      WHERE id = ?
      `,
      [absensiId]
    );

    expect(rows.length).toBe(1);

    expect(rows[0].status).toBe("hadir");
  });

  // ======================================================
  // 11. HURUF BESAR MENJADI LOWERCASE
  // ======================================================

  test("berhasil mengubah status huruf besar menjadi lowercase", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({
      status: "IZIN",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe("Status absensi berhasil diupdate");

    expect(response.body.status).toBe("izin");

    // Verifikasi database
    const rows = await query(
      `
      SELECT status
      FROM absensi
      WHERE id = ?
      `,
      [absensiId]
    );

    expect(rows.length).toBe(1);

    expect(rows[0].status).toBe("izin");
  });

  // ======================================================
  // 12. MEMBERSIHKAN SPASI
  // ======================================================

  test("berhasil membersihkan spasi pada status", async () => {
    // Buat absensi sementara baru khusus untuk test ini
    const siswaResult = await query(`
      SELECT id, kelas_id
      FROM siswa
      WHERE status = 'approved'
        AND kelas_id IS NOT NULL
      LIMIT 1
    `);

    expect(siswaResult.length).toBeGreaterThan(0);

    const siswaId = siswaResult[0].id;
    const kelasId = siswaResult[0].kelas_id;

    const jadwalResult = await query(
      `
      SELECT id
      FROM jadwal
      WHERE kelas_id = ?
      LIMIT 1
      `,
      [kelasId]
    );

    expect(jadwalResult.length).toBeGreaterThan(0);

    const jadwalId = jadwalResult[0].id;

    const insertResult = await query(
      `
      INSERT INTO absensi
      (
        jadwal_id,
        siswa_id,
        tanggal,
        status
      )
      VALUES (?, ?, '2099-12-30', 'alpha')
      `,
      [jadwalId, siswaId]
    );

    const testAbsensiId = insertResult.insertId;

    try {
      // ==============================================
      // REQUEST
      // ==============================================

      const response = await request(app)
        .put(`/absensi/${testAbsensiId}`)
        .send({
          status: " sakit ",
        });

      // ==============================================
      // CEK RESPONSE
      // ==============================================

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe("Status absensi berhasil diupdate");

      expect(response.body.status).toBe("sakit");

      // ==============================================
      // CEK DATABASE
      // ==============================================

      const rows = await query(
        `
        SELECT status
        FROM absensi
        WHERE id = ?
        `,
        [testAbsensiId]
      );

      expect(rows.length).toBe(1);

      expect(rows[0].status).toBe("sakit");
    } finally {
      // ==============================================
      // CLEANUP
      // ==============================================

      await query(
        `
        DELETE FROM absensi
        WHERE id = ?
        `,
        [testAbsensiId]
      );
    }
  });
  // ======================================================
  // 13. BERHASIL MENGUBAH MENJADI ALPHA
  // ======================================================

  test("berhasil mengubah status menjadi alpha", async () => {
    const response = await request(app).put(`/absensi/${absensiId}`).send({
      status: "alpha",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe("Status absensi berhasil diupdate");

    expect(response.body.status).toBe("alpha");

    // Verifikasi database
    const rows = await query(
      `
      SELECT status
      FROM absensi
      WHERE id = ?
      `,
      [absensiId]
    );

    expect(rows.length).toBe(1);

    expect(rows[0].status).toBe("alpha");
  });

  // ======================================================
  // CLEANUP
  // ======================================================

  afterAll(async () => {
    if (tempAbsensiId) {
      await query(
        `
        DELETE FROM absensi
        WHERE id = ?
        `,
        [tempAbsensiId]
      );

      console.log("");
      console.log(`Data absensi test ID ${tempAbsensiId} berhasil dihapus.`);
      console.log("");
    }
  });
});
