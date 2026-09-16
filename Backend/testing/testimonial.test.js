const request = require("supertest");
const app = require("../server");
const db = require("../db");
const fs = require("fs");
const path = require("path");

const BASE_URL = "/testimonial";

const uploadDir = path.join(__dirname, "../uploads");

function queryPromise(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

describe("Whitebox Testing - Testimonial", () => {
  let testimonialId = null;
  let dataAwal = null;
  const fileTest = [];

  // =====================================================
  // SETUP
  // =====================================================
  beforeAll(async () => {
    // Pastikan folder uploads tersedia
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const rows = await queryPromise(
      "SELECT * FROM testimonial ORDER BY id DESC LIMIT 1"
    );

    if (rows.length > 0) {
      testimonialId = rows[0].id;
      dataAwal = { ...rows[0] };
    }
  });

  // =====================================================
  // 1. GET SEMUA TESTIMONI - SUCCESS
  // =====================================================
  test("GET /testimonial - berhasil mengambil semua testimoni", async () => {
    const response = await request(app).get(BASE_URL).expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("nama");
      expect(response.body[0]).toHaveProperty("asal_sekolah");
      expect(response.body[0]).toHaveProperty("universitas");
      expect(response.body[0]).toHaveProperty("pesan");
      expect(response.body[0]).toHaveProperty("signature");
      expect(response.body[0]).toHaveProperty("foto");
    }
  });

  // =====================================================
  // 2. GET SEMUA TESTIMONI - DATABASE ERROR
  // =====================================================
  test("GET /testimonial - database error", async () => {
    const originalQuery = db.query;

    db.query = jest.fn((sql, callback) => {
      callback(new Error("Database error"), null);
    });

    const response = await request(app).get(BASE_URL).expect(500);

    // res.json(err) menghasilkan object kosong
    expect(response.body).toEqual({});

    db.query = originalQuery;
  });

  // =====================================================
  // 3. GET TESTIMONI BERDASARKAN ID - SUCCESS
  // =====================================================
  test("GET /testimonial/:id - berhasil mengambil detail testimoni", async () => {
    if (!testimonialId) {
      console.warn("Tidak ada data testimonial pada database.");
      return;
    }

    const response = await request(app)
      .get(`${BASE_URL}/${testimonialId}`)
      .expect(200);

    expect(response.body).toHaveProperty("id", testimonialId);
    expect(response.body).toHaveProperty("nama");
  });

  // =====================================================
  // 4. GET TESTIMONI - ID TIDAK DITEMUKAN
  // =====================================================
  test("GET /testimonial/:id - testimoni tidak ditemukan", async () => {
    const response = await request(app)
      .get(`${BASE_URL}/999999999`)
      .expect(404);

    expect(response.body).toEqual({
      message: "Testimoni tidak ditemukan",
    });
  });

  // =====================================================
  // 5. GET TESTIMONI - DATABASE ERROR
  // =====================================================
  test("GET /testimonial/:id - database error", async () => {
    const originalQuery = db.query;

    db.query = jest.fn((sql, params, callback) => {
      callback(new Error("Database error"), null);
    });

    const response = await request(app).get(`${BASE_URL}/1`).expect(500);

    expect(response.body).toEqual({});

    db.query = originalQuery;
  });

  // =====================================================
  // 6. POST TESTIMONI - TANPA FOTO
  // =====================================================
  test("POST /testimonial - berhasil menambahkan testimoni tanpa foto", async () => {
    const response = await request(app)
      .post(BASE_URL)
      .field("nama", "Test Whitebox")
      .field("asal_sekolah", "SMA Test")
      .field("universitas", "Universitas Test")
      .field("pesan", "Pesan untuk pengujian whitebox")
      .field("signature", "Test User")
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Testimoni berhasil ditambahkan",
    });

    const rows = await queryPromise(
      `SELECT * FROM testimonial
       WHERE nama = ?
       ORDER BY id DESC
       LIMIT 1`,
      ["Test Whitebox"]
    );

    expect(rows.length).toBeGreaterThan(0);

    const insertedId = rows[0].id;

    await queryPromise("DELETE FROM testimonial WHERE id = ?", [insertedId]);
  });

  // =====================================================
  // 7. POST TESTIMONI - DENGAN FOTO
  // =====================================================
  test("POST /testimonial - berhasil menambahkan testimoni dengan foto", async () => {
    const response = await request(app)
      .post(BASE_URL)
      .field("nama", "Test Foto Whitebox")
      .field("asal_sekolah", "SMA Test")
      .field("universitas", "Universitas Test")
      .field("pesan", "Test upload foto")
      .field("signature", "Test Foto")
      .attach(
        "foto",
        Buffer.from("file gambar untuk pengujian"),
        "testimonial-test.jpg"
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Testimoni berhasil ditambahkan");

    const rows = await queryPromise(
      `SELECT * FROM testimonial
       WHERE nama = ?
       ORDER BY id DESC
       LIMIT 1`,
      ["Test Foto Whitebox"]
    );

    expect(rows.length).toBeGreaterThan(0);

    const inserted = rows[0];

    expect(inserted.foto).toMatch(/^\/uploads\/.+\.jpg$/);

    fileTest.push(inserted.foto);

    await queryPromise("DELETE FROM testimonial WHERE id = ?", [inserted.id]);
  });

  // =====================================================
  // 8. POST TESTIMONI - DATABASE ERROR
  // =====================================================
  test("POST /testimonial - database error", async () => {
    const originalQuery = db.query;

    db.query = jest.fn((sql, params, callback) => {
      callback(new Error("Database error"), null);
    });

    const response = await request(app)
      .post(BASE_URL)
      .field("nama", "Test Error")
      .field("asal_sekolah", "SMA Test")
      .field("universitas", "Universitas Test")
      .field("pesan", "Test error")
      .field("signature", "Test")
      .expect(500);

    expect(response.body).toEqual({});

    db.query = originalQuery;
  });

  // =====================================================
  // 9. PUT TESTIMONI - DATA TIDAK DITEMUKAN
  // =====================================================
  test("PUT /testimonial/:id - data tidak ditemukan", async () => {
    const response = await request(app)
      .put(`${BASE_URL}/999999999`)
      .field("nama", "Test")
      .field("asal_sekolah", "Test")
      .field("universitas", "Test")
      .field("pesan", "Test")
      .field("signature", "Test")
      .expect(404);

    expect(response.body).toEqual({
      message: "Data tidak ditemukan",
    });
  });

  // =====================================================
  // 10. PUT TESTIMONI - TANPA FOTO BARU
  // =====================================================
  test("PUT /testimonial/:id - berhasil memperbarui tanpa foto baru", async () => {
    if (!testimonialId) {
      console.warn("Tidak ada data testimonial.");
      return;
    }

    const response = await request(app)
      .put(`${BASE_URL}/${testimonialId}`)
      .field("nama", "Test Update Whitebox")
      .field("asal_sekolah", "Sekolah Update")
      .field("universitas", "Universitas Update")
      .field("pesan", "Pesan Update")
      .field("signature", "Signature Update")
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Testimoni berhasil diperbarui",
    });

    const rows = await queryPromise("SELECT * FROM testimonial WHERE id = ?", [
      testimonialId,
    ]);

    expect(rows.length).toBe(1);
    expect(rows[0].nama).toBe("Test Update Whitebox");
    expect(rows[0].asal_sekolah).toBe("Sekolah Update");
    expect(rows[0].universitas).toBe("Universitas Update");
    expect(rows[0].pesan).toBe("Pesan Update");
    expect(rows[0].signature).toBe("Signature Update");
  });

  // =====================================================
  // 11. PUT TESTIMONI - DENGAN FOTO BARU
  // =====================================================
  test("PUT /testimonial/:id - berhasil memperbarui dengan foto baru", async () => {
    if (!testimonialId) {
      console.warn("Tidak ada data testimonial.");
      return;
    }

    const response = await request(app)
      .put(`${BASE_URL}/${testimonialId}`)
      .field("nama", "Test Update Foto")
      .field("asal_sekolah", "Sekolah Foto")
      .field("universitas", "Universitas Foto")
      .field("pesan", "Pesan Foto")
      .field("signature", "Signature Foto")
      .attach(
        "foto",
        Buffer.from("gambar update untuk testing"),
        "testimonial-update.jpg"
      )
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Testimoni berhasil diperbarui",
    });

    const rows = await queryPromise("SELECT * FROM testimonial WHERE id = ?", [
      testimonialId,
    ]);

    expect(rows.length).toBe(1);

    expect(rows[0].foto).toMatch(/^\/uploads\/.+\.jpg$/);

    fileTest.push(rows[0].foto);
  });

  // =====================================================
  // 12. PUT TESTIMONI - DATABASE ERROR SAAT SELECT
  // =====================================================
  test("PUT /testimonial/:id - database error saat mengambil data", async () => {
    const originalQuery = db.query;

    db.query = jest.fn((sql, params, callback) => {
      callback(new Error("Database error"), null);
    });

    const response = await request(app)
      .put(`${BASE_URL}/1`)
      .field("nama", "Test")
      .field("asal_sekolah", "Test")
      .field("universitas", "Test")
      .field("pesan", "Test")
      .field("signature", "Test")
      .expect(500);

    expect(response.body).toEqual({});

    db.query = originalQuery;
  });

  // =====================================================
  // 13. PUT TESTIMONI - DATABASE ERROR SAAT UPDATE
  // =====================================================
  test("PUT /testimonial/:id - database error saat update", async () => {
    if (!testimonialId) {
      console.warn("Tidak ada data testimonial.");
      return;
    }

    const originalQuery = db.query;
    let queryCount = 0;

    db.query = jest.fn((sql, params, callback) => {
      queryCount++;

      if (queryCount === 1) {
        callback(null, [
          {
            id: testimonialId,
            foto: dataAwal?.foto || "",
          },
        ]);
      } else {
        callback(new Error("Database update error"), null);
      }
    });

    const response = await request(app)
      .put(`${BASE_URL}/${testimonialId}`)
      .field("nama", "Test Error Update")
      .field("asal_sekolah", "Test")
      .field("universitas", "Test")
      .field("pesan", "Test")
      .field("signature", "Test")
      .expect(500);

    expect(response.body).toEqual({});

    db.query = originalQuery;
  });

  // =====================================================
  // 14. DELETE TESTIMONI - SUCCESS
  // =====================================================
  test("DELETE /testimonial/:id - berhasil menghapus testimoni", async () => {
    const insert = await queryPromise(
      `INSERT INTO testimonial
      (nama, asal_sekolah, universitas, pesan, signature, foto)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Test Delete Whitebox",
        "Sekolah Delete",
        "Universitas Delete",
        "Pesan Delete",
        "Signature Delete",
        "",
      ]
    );

    const idDelete = insert.insertId;

    const response = await request(app)
      .delete(`${BASE_URL}/${idDelete}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Testimoni berhasil dihapus",
    });

    const rows = await queryPromise("SELECT * FROM testimonial WHERE id = ?", [
      idDelete,
    ]);

    expect(rows.length).toBe(0);
  });

  // =====================================================
  // 15. DELETE TESTIMONI - ID TIDAK ADA
  // =====================================================
  test("DELETE /testimonial/:id - ID tidak ditemukan", async () => {
    const response = await request(app)
      .delete(`${BASE_URL}/999999999`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Testimoni berhasil dihapus",
    });
  });

  // =====================================================
  // 16. DELETE TESTIMONI - DATABASE ERROR
  // =====================================================
  test("DELETE /testimonial/:id - database error", async () => {
    const originalQuery = db.query;

    db.query = jest.fn((sql, params, callback) => {
      callback(new Error("Database delete error"), null);
    });

    const response = await request(app).delete(`${BASE_URL}/1`).expect(500);

    expect(response.body).toEqual({});

    db.query = originalQuery;
  });

  // =====================================================
  // RESTORE DATA
  // =====================================================
  afterAll(async () => {
    // Kembalikan data testimonial asli
    if (testimonialId && dataAwal) {
      await queryPromise(
        `UPDATE testimonial
         SET nama=?,
             asal_sekolah=?,
             universitas=?,
             pesan=?,
             signature=?,
             foto=?
         WHERE id=?`,
        [
          dataAwal.nama,
          dataAwal.asal_sekolah,
          dataAwal.universitas,
          dataAwal.pesan,
          dataAwal.signature,
          dataAwal.foto,
          testimonialId,
        ]
      );
    }

    // Hapus file hasil testing
    fileTest.forEach((fileUrl) => {
      if (!fileUrl) return;

      const fileName = path.basename(fileUrl);
      const filePath = path.join(uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.warn("Gagal menghapus file test:", filePath);
        }
      }
    });
  });
});
