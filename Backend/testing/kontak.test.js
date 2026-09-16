const request = require("supertest");

const app = require("../server");
const db = require("../db");

// ======================================================
// KONFIGURASI
// ======================================================

const BASE_URL = "/kontak";

// ======================================================
// HELPER DATABASE
// ======================================================

const queryPromise = (sql, params = []) => {
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

// ======================================================
// TEST KONTAK
// ======================================================

describe("KONTAK ROUTES - WHITE BOX TESTING", () => {
  let kontakId = null;

  let dataAwal = null;

  // ====================================================
  // AMBIL DATA AWAL
  // ====================================================

  beforeAll(async () => {
    const result = await queryPromise("SELECT * FROM kontak LIMIT 1");

    if (result.length > 0) {
      kontakId = result[0].id;
      dataAwal = result[0];
    }
  });

  // ====================================================
  // GET KONTAK
  // ====================================================

  describe("GET /kontak", () => {
    test("berhasil mengambil data kontak", async () => {
      const response = await request(app).get(BASE_URL).expect(200);

      // Jika tabel kontak memiliki data,
      // route mengembalikan object kontak.
      if (kontakId) {
        expect(response.body).toHaveProperty("id", kontakId);

        expect(response.body).toHaveProperty("nama_bimbel");

        expect(response.body).toHaveProperty("alamat");

        expect(response.body).toHaveProperty("telepon");

        expect(response.body).toHaveProperty("whatsapp");

        expect(response.body).toHaveProperty("email");
      }
    });

    // ==================================================
    // GET DATABASE ERROR
    // ==================================================

    test("gagal mengambil data kontak ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error database"));
        }
      });

      const response = await request(app).get(BASE_URL).expect(500);

      // kontak.js menggunakan res.json(err)
      // sehingga objek Error menjadi {}
      expect(response.body).toEqual({});

      spy.mockRestore();
    });

    // ==================================================
    // GET DATA KOSONG
    // ==================================================

    test("mengembalikan undefined jika data kontak kosong sesuai implementasi route", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(null, []);
        }
      });

      const response = await request(app).get(BASE_URL).expect(200);

      // res.json(undefined) pada Express
      // menghasilkan response kosong.
      expect(response.text === "" || response.body === undefined).toBe(true);

      spy.mockRestore();
    });
  });

  // ====================================================
  // PUT KONTAK
  // ====================================================

  describe("PUT /kontak/:id", () => {
    test("berhasil memperbarui seluruh data kontak", async () => {
      if (!kontakId) {
        console.log("Tidak ada data kontak untuk pengujian PUT.");

        return;
      }

      const response = await request(app)
        .put(`${BASE_URL}/${kontakId}`)
        .send({
          nama_bimbel: "BIMBELKU TIGABINANGA",
          alamat: "Tigabinanga, Kabupaten Karo",
          telepon: "081234567890",
          whatsapp: "081234567890",
          email: "bimbelku.testing@gmail.com",
          instagram: "@bimbelku_testing",
          facebook: "Bimbelku Testing",
          youtube: "Bimbelku Testing Channel",
          maps: "https://maps.google.com/?q=Tigabinanga",
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Kontak berhasil diperbarui",
      });

      // Verifikasi data benar-benar masuk database
      const result = await queryPromise(
        `SELECT
          nama_bimbel,
          alamat,
          telepon,
          whatsapp,
          email,
          instagram,
          facebook,
          youtube,
          maps
         FROM kontak
         WHERE id=?`,
        [kontakId]
      );

      expect(result.length).toBe(1);

      expect(result[0].nama_bimbel).toBe("BIMBELKU TIGABINANGA");

      expect(result[0].alamat).toBe("Tigabinanga, Kabupaten Karo");

      expect(result[0].telepon).toBe("081234567890");

      expect(result[0].whatsapp).toBe("081234567890");

      expect(result[0].email).toBe("bimbelku.testing@gmail.com");

      expect(result[0].instagram).toBe("@bimbelku_testing");

      expect(result[0].facebook).toBe("Bimbelku Testing");

      expect(result[0].youtube).toBe("Bimbelku Testing Channel");

      expect(result[0].maps).toBe("https://maps.google.com/?q=Tigabinanga");
    });

    // ==================================================
    // PUT DATABASE ERROR
    // ==================================================

    test("gagal memperbarui kontak ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error UPDATE kontak"));
        }
      });

      const response = await request(app)
        .put(`${BASE_URL}/1`)
        .send({
          nama_bimbel: "Kontak Error",
          alamat: "Alamat Error",
          telepon: "081111111111",
          whatsapp: "081111111111",
          email: "error@test.com",
          instagram: "@error",
          facebook: "Error",
          youtube: "Error",
          maps: "Error",
        })
        .expect(500);

      // Route menggunakan res.json(err)
      expect(response.body).toEqual({});

      spy.mockRestore();
    });

    // ==================================================
    // PUT DENGAN FIELD KOSONG
    // ==================================================

    test("tetap memproses field kosong sesuai implementasi route", async () => {
      if (!kontakId) {
        console.log("Tidak ada data kontak untuk pengujian.");

        return;
      }

      const response = await request(app)
        .put(`${BASE_URL}/${kontakId}`)
        .send({
          nama_bimbel: "",
          alamat: "",
          telepon: "",
          whatsapp: "",
          email: "",
          instagram: "",
          facebook: "",
          youtube: "",
          maps: "",
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Kontak berhasil diperbarui",
      });

      // Kembalikan data asli setelah test
      if (dataAwal) {
        await queryPromise(
          `UPDATE kontak
           SET
             nama_bimbel=?,
             alamat=?,
             telepon=?,
             whatsapp=?,
             email=?,
             instagram=?,
             facebook=?,
             youtube=?,
             maps=?
           WHERE id=?`,
          [
            dataAwal.nama_bimbel,
            dataAwal.alamat,
            dataAwal.telepon,
            dataAwal.whatsapp,
            dataAwal.email,
            dataAwal.instagram,
            dataAwal.facebook,
            dataAwal.youtube,
            dataAwal.maps,
            kontakId,
          ]
        );
      }
    });
  });

  // ====================================================
  // CLEANUP
  // ====================================================

  afterAll(async () => {
    // Pastikan data kontak dikembalikan ke kondisi awal
    if (kontakId && dataAwal) {
      await queryPromise(
        `UPDATE kontak
         SET
           nama_bimbel=?,
           alamat=?,
           telepon=?,
           whatsapp=?,
           email=?,
           instagram=?,
           facebook=?,
           youtube=?,
           maps=?
         WHERE id=?`,
        [
          dataAwal.nama_bimbel,
          dataAwal.alamat,
          dataAwal.telepon,
          dataAwal.whatsapp,
          dataAwal.email,
          dataAwal.instagram,
          dataAwal.facebook,
          dataAwal.youtube,
          dataAwal.maps,
          kontakId,
        ]
      ).catch(() => {});
    }
  });
});
