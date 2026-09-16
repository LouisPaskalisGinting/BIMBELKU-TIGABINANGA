const request = require("supertest");
const fs = require("fs");
const path = require("path");

const app = require("../server");
const db = require("../db");

// ======================================================
// KONFIGURASI
// ======================================================

const BASE_URL = "/galeri";

let galeriId = null;

const createdFiles = [];

// ======================================================
// HELPER QUERY DATABASE
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
// BUAT FOLDER UPLOAD JIKA BELUM ADA
// ======================================================

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ======================================================
// TEST GALERI
// ======================================================

describe("GALERI ROUTES - WHITE BOX TESTING", () => {
  // ====================================================
  // GET ALL GALERI
  // ====================================================

  describe("GET /galeri", () => {
    test("berhasil mengambil semua data galeri", async () => {
      const response = await request(app).get(BASE_URL).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test("gagal mengambil data galeri ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error database"));
        }
      });

      const response = await request(app).get(BASE_URL).expect(500);

      // Route menggunakan res.json(err)
      // sehingga Error menjadi {}
      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // POST GALERI TANPA GAMBAR
  // ====================================================

  describe("POST /galeri", () => {
    test("berhasil menambahkan galeri tanpa gambar", async () => {
      const response = await request(app)
        .post(BASE_URL)
        .field("judul", "Galeri Testing Jest")
        .field("deskripsi", "Data galeri untuk pengujian white-box")
        .expect(200);

      expect(response.body).toEqual({
        message: "Galeri berhasil ditambahkan",
      });

      const data = await queryPromise(
        `SELECT id, judul, deskripsi, gambar
         FROM galeri
         WHERE judul=?
         ORDER BY id DESC
         LIMIT 1`,
        ["Galeri Testing Jest"]
      );

      expect(data.length).toBeGreaterThan(0);

      galeriId = data[0].id;

      expect(data[0].judul).toBe("Galeri Testing Jest");

      expect(data[0].deskripsi).toBe("Data galeri untuk pengujian white-box");

      expect(data[0].gambar).toBe("");
    });

    // ==================================================
    // POST DENGAN GAMBAR
    // ==================================================

    test("berhasil menambahkan galeri dengan gambar", async () => {
      const dummyImage = Buffer.from("dummy image untuk pengujian");

      const response = await request(app)
        .post(BASE_URL)
        .field("judul", "Galeri Dengan Gambar")
        .field("deskripsi", "Pengujian upload gambar")
        .attach("gambar", dummyImage, "galeri-test.jpg")
        .expect(200);

      expect(response.body).toEqual({
        message: "Galeri berhasil ditambahkan",
      });

      const data = await queryPromise(
        `SELECT id, judul, deskripsi, gambar
         FROM galeri
         WHERE judul=?
         ORDER BY id DESC
         LIMIT 1`,
        ["Galeri Dengan Gambar"]
      );

      expect(data.length).toBeGreaterThan(0);

      const row = data[0];

      expect(row.judul).toBe("Galeri Dengan Gambar");

      expect(row.deskripsi).toBe("Pengujian upload gambar");

      expect(row.gambar).toMatch(/^\/uploads\/.+\.jpg$/);

      galeriId = row.id;

      // Simpan nama file untuk cleanup
      if (row.gambar) {
        createdFiles.push(
          path.join(process.cwd(), row.gambar.replace(/^\/+/, ""))
        );
      }
    });

    // ==================================================
    // POST DATABASE ERROR
    // ==================================================

    test("gagal menambahkan galeri ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error INSERT galeri"));
        }
      });

      const response = await request(app)
        .post(BASE_URL)
        .field("judul", "Galeri Error")
        .field("deskripsi", "Testing database error")
        .expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // PUT GALERI
  // ====================================================

  describe("PUT /galeri/:id", () => {
    test("berhasil memperbarui galeri tanpa gambar baru", async () => {
      // Pastikan ada data untuk diupdate
      if (!galeriId) {
        const data = await queryPromise(
          "SELECT id FROM galeri ORDER BY id DESC LIMIT 1"
        );

        if (data.length === 0) {
          const insertResult = await queryPromise(
            `INSERT INTO galeri
             (judul, deskripsi, gambar)
             VALUES (?, ?, ?)`,
            ["Galeri Sementara", "Data sementara", ""]
          );

          galeriId = insertResult.insertId;
        } else {
          galeriId = data[0].id;
        }
      }

      const before = await queryPromise(
        "SELECT gambar FROM galeri WHERE id=?",
        [galeriId]
      );

      expect(before.length).toBe(1);

      const oldImage = before[0].gambar;

      const response = await request(app)
        .put(`${BASE_URL}/${galeriId}`)
        .field("judul", "Galeri Berhasil Diperbarui")
        .field("deskripsi", "Deskripsi galeri setelah diperbarui")
        .expect(200);

      expect(response.body).toEqual({
        message: "Galeri berhasil diperbarui",
      });

      const data = await queryPromise(
        `SELECT judul, deskripsi, gambar
         FROM galeri
         WHERE id=?`,
        [galeriId]
      );

      expect(data.length).toBe(1);

      expect(data[0].judul).toBe("Galeri Berhasil Diperbarui");

      expect(data[0].deskripsi).toBe("Deskripsi galeri setelah diperbarui");

      // Karena tidak upload gambar baru,
      // gambar lama tetap digunakan.
      expect(data[0].gambar).toBe(oldImage);
    });

    // ==================================================
    // PUT DENGAN GAMBAR BARU
    // ==================================================

    test("berhasil memperbarui galeri dengan gambar baru", async () => {
      if (!galeriId) {
        const insertResult = await queryPromise(
          `INSERT INTO galeri
           (judul, deskripsi, gambar)
           VALUES (?, ?, ?)`,
          ["Galeri Untuk Upload", "Data untuk testing upload", ""]
        );

        galeriId = insertResult.insertId;
      }

      const dummyImage = Buffer.from("gambar baru untuk pengujian");

      const response = await request(app)
        .put(`${BASE_URL}/${galeriId}`)
        .field("judul", "Galeri Dengan Gambar Baru")
        .field("deskripsi", "Deskripsi dengan gambar baru")
        .attach("gambar", dummyImage, "galeri-update.png")
        .expect(200);

      expect(response.body).toEqual({
        message: "Galeri berhasil diperbarui",
      });

      const data = await queryPromise(
        `SELECT judul, deskripsi, gambar
         FROM galeri
         WHERE id=?`,
        [galeriId]
      );

      expect(data.length).toBe(1);

      expect(data[0].judul).toBe("Galeri Dengan Gambar Baru");

      expect(data[0].deskripsi).toBe("Deskripsi dengan gambar baru");

      expect(data[0].gambar).toMatch(/^\/uploads\/.+\.png$/);

      if (data[0].gambar) {
        createdFiles.push(
          path.join(process.cwd(), data[0].gambar.replace(/^\/+/, ""))
        );
      }
    });

    // ==================================================
    // PUT SELECT ERROR
    // ==================================================

    test("gagal memperbarui galeri ketika query pencarian database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error SELECT galeri"));
        }
      });

      const response = await request(app)
        .put(`${BASE_URL}/1`)
        .field("judul", "Galeri Error")
        .field("deskripsi", "Testing SELECT error")
        .expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });

    // ==================================================
    // PUT UPDATE ERROR
    // ==================================================

    test("gagal memperbarui galeri ketika query UPDATE database error", async () => {
      // Buat data khusus
      const insertResult = await queryPromise(
        `INSERT INTO galeri
         (judul, deskripsi, gambar)
         VALUES (?, ?, ?)`,
        ["Galeri Untuk Update Error", "Data testing", ""]
      );

      const testId = insertResult.insertId;

      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const sql = String(args[0]);
        const callback = args[args.length - 1];

        if (typeof callback !== "function") {
          return;
        }

        // Query SELECT berhasil
        if (sql.includes("SELECT * FROM galeri WHERE id")) {
          callback(null, [
            {
              id: testId,
              judul: "Galeri Untuk Update Error",
              deskripsi: "Data testing",
              gambar: "",
            },
          ]);
          return;
        }

        // Query UPDATE error
        if (sql.includes("UPDATE galeri")) {
          callback(new Error("Simulasi error UPDATE galeri"));
          return;
        }

        callback(null, []);
      });

      const response = await request(app)
        .put(`${BASE_URL}/${testId}`)
        .field("judul", "Galeri Update Error")
        .field("deskripsi", "Deskripsi Update Error")
        .expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();

      // Hapus data testing
      await queryPromise("DELETE FROM galeri WHERE id=?", [testId]).catch(
        () => {}
      );
    });
  });

  // ====================================================
  // DELETE GALERI
  // ====================================================

  describe("DELETE /galeri/:id", () => {
    test("berhasil menghapus galeri", async () => {
      const insertResult = await queryPromise(
        `INSERT INTO galeri
         (judul, deskripsi, gambar)
         VALUES (?, ?, ?)`,
        ["Galeri Untuk Dihapus", "Data khusus pengujian delete", ""]
      );

      const deleteId = insertResult.insertId;

      const response = await request(app)
        .delete(`${BASE_URL}/${deleteId}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Galeri berhasil dihapus",
      });

      const data = await queryPromise("SELECT id FROM galeri WHERE id=?", [
        deleteId,
      ]);

      expect(data.length).toBe(0);
    });

    // ==================================================
    // DELETE ID TIDAK ADA
    // ==================================================

    test("menghapus ID galeri yang tidak ada tetap mengembalikan 200 sesuai implementasi route", async () => {
      const response = await request(app)
        .delete(`${BASE_URL}/999999999`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Galeri berhasil dihapus",
      });
    });

    // ==================================================
    // DELETE DATABASE ERROR
    // ==================================================

    test("gagal menghapus galeri ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error DELETE galeri"));
        }
      });

      const response = await request(app).delete(`${BASE_URL}/1`).expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // CLEANUP
  // ====================================================

  afterAll(async () => {
    // Hapus data yang dibuat oleh test
    await queryPromise(
      `DELETE FROM galeri
       WHERE judul IN (
         'Galeri Testing Jest',
         'Galeri Dengan Gambar',
         'Galeri Berhasil Diperbarui',
         'Galeri Dengan Gambar Baru'
       )`
    ).catch(() => {});

    // Hapus file hasil upload testing
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.log("Gagal menghapus file testing:", file);
      }
    }
  });
});
