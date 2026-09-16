const request = require("supertest");
const app = require("../server");
const db = require("../db");

const BASE_URL = "/notifikasi";

// =====================================================
// HELPER QUERY
// =====================================================
function queryPromise(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// =====================================================
// TEST NOTIFIKASI
// =====================================================
describe("Whitebox Testing - Notifikasi", () => {
  // ===================================================
  // 1. GET SEMUA NOTIFIKASI
  // ===================================================
  test("GET /notifikasi - berhasil mengambil notifikasi", async () => {
    const response = await request(app).get(BASE_URL).expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    // Jika terdapat data, periksa struktur datanya
    if (response.body.length > 0) {
      response.body.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("tipe");
        expect(item).toHaveProperty("nama");
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("description");
        expect(item).toHaveProperty("waktu");
        expect(item).toHaveProperty("urutan");

        expect(["pendaftaran", "pembayaran"]).toContain(item.tipe);
      });
    }
  });

  // ===================================================
  // 2. MEMASTIKAN MAKSIMAL 10 NOTIFIKASI
  // ===================================================
  test("GET /notifikasi - maksimal mengembalikan 10 notifikasi", async () => {
    const response = await request(app).get(BASE_URL).expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(10);
  });

  // ===================================================
  // 3. MEMERIKSA NOTIFIKASI PENDAFTARAN
  // ===================================================
  test("GET /notifikasi - notifikasi pendaftaran memiliki format yang benar", async () => {
    const response = await request(app).get(BASE_URL).expect(200);

    const pendaftaran = response.body.filter(
      (item) => item.tipe === "pendaftaran"
    );

    pendaftaran.forEach((item) => {
      expect(item.title).toContain(item.nama);
      expect(item.title).toContain("baru saja mendaftar");

      expect(item.description).toBe(
        "Pendaftaran siswa baru menunggu persetujuan admin."
      );
    });
  });

  // ===================================================
  // 4. MEMERIKSA NOTIFIKASI PEMBAYARAN
  // ===================================================
  test("GET /notifikasi - notifikasi pembayaran memiliki format yang benar", async () => {
    const response = await request(app).get(BASE_URL).expect(200);

    const pembayaran = response.body.filter(
      (item) => item.tipe === "pembayaran"
    );

    pembayaran.forEach((item) => {
      expect(item.title).toContain(item.nama);
      expect(item.title).toContain("mengirim pembayaran");

      expect(item.description).toContain("Pembayaran sebesar Rp");

      expect(item.description).toContain("menunggu verifikasi.");
    });
  });

  // ===================================================
  // 5. MEMASTIKAN URUTAN WAKTU DESC
  // ===================================================
  test("GET /notifikasi - data diurutkan berdasarkan waktu terbaru", async () => {
    const response = await request(app).get(BASE_URL).expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    for (let i = 0; i < response.body.length - 1; i++) {
      const waktuSekarang = new Date(response.body[i].waktu);
      const waktuBerikutnya = new Date(response.body[i + 1].waktu);

      expect(waktuSekarang.getTime()).toBeGreaterThanOrEqual(
        waktuBerikutnya.getTime()
      );
    }
  });

  // ===================================================
  // 6. DATABASE ERROR
  // ===================================================
  test("GET /notifikasi - database error mengembalikan status 500", async () => {
    const originalQuery = db.query;

    db.query = jest.fn((sql, callback) => {
      callback(new Error("Database error"), null);
    });

    const response = await request(app).get(BASE_URL).expect(500);

    expect(response.body).toHaveProperty(
      "message",
      "Gagal mengambil notifikasi"
    );

    expect(response.body).toHaveProperty("error");

    db.query = originalQuery;
  });

  // ===================================================
  // 7. DATABASE MENGEMBALIKAN DATA KOSONG
  // ===================================================
  test("GET /notifikasi - ketika tidak ada notifikasi", async () => {
    const originalQuery = db.query;

    db.query = jest.fn((sql, callback) => {
      callback(null, []);
    });

    const response = await request(app).get(BASE_URL).expect(200);

    expect(response.body).toEqual([]);

    db.query = originalQuery;
  });
});
