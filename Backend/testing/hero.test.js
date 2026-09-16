const request = require("supertest");
const fs = require("fs");
const path = require("path");

const app = require("../server");
const db = require("../db");

// ======================================================
// KONFIGURASI
// ======================================================

const BASE_URL = "/hero";

let heroId = null;

// Menyimpan data hero asli sebelum testing
let originalHero = null;

// Menyimpan file hasil upload testing
const createdFiles = [];

const uploadDir = path.join(process.cwd(), "uploads");

// Pastikan folder uploads tersedia
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
// TEST HERO
// ======================================================

describe("HERO ROUTES - WHITE BOX TESTING", () => {
  // ====================================================
  // SIAPKAN DATA HERO ASLI
  // ====================================================

  beforeAll(async () => {
    const data = await queryPromise(
      "SELECT * FROM hero_section ORDER BY id ASC LIMIT 1"
    );

    if (data.length > 0) {
      heroId = data[0].id;

      // Simpan seluruh data asli
      originalHero = {
        id: data[0].id,
        title: data[0].title,
        subtitle: data[0].subtitle,
        button_text: data[0].button_text,
        background: data[0].background,
      };

      console.log("Data hero asli berhasil disimpan:", originalHero);
    }
  });

  // ====================================================
  // GET HERO
  // ====================================================

  describe("GET /hero", () => {
    test("berhasil mengambil data hero", async () => {
      const response = await request(app).get(BASE_URL).expect(200);

      expect(response.body).toBeDefined();

      if (Object.keys(response.body).length > 0) {
        expect(response.body).toHaveProperty("id");
      }
    });

    // --------------------------------------------------
    // GET HERO - DATA KOSONG
    // --------------------------------------------------

    test("mengembalikan object kosong jika data hero tidak ditemukan", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(null, []);
        }
      });

      const response = await request(app).get(BASE_URL).expect(200);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });

    // --------------------------------------------------
    // GET HERO - DATABASE ERROR
    // --------------------------------------------------

    test("gagal mengambil data hero ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error database"));
        }
      });

      const response = await request(app).get(BASE_URL).expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // PUT HERO
  // ====================================================

  describe("PUT /hero/:id", () => {
    // --------------------------------------------------
    // DATA HERO TIDAK DITEMUKAN
    // --------------------------------------------------

    test("mengembalikan 404 jika data hero tidak ditemukan", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/999999999`)
        .field("title", "Hero Test")
        .field("subtitle", "Subtitle Test")
        .field("button_text", "Daftar Sekarang")
        .expect(404);

      expect(response.body).toEqual({
        message: "Data tidak ditemukan",
      });
    });

    // --------------------------------------------------
    // PUT TANPA GAMBAR BARU
    // --------------------------------------------------

    test("berhasil memperbarui hero tanpa gambar baru", async () => {
      if (!heroId) {
        console.log("Tidak ada data hero untuk pengujian PUT.");
        return;
      }

      const before = await queryPromise(
        "SELECT background FROM hero_section WHERE id=?",
        [heroId]
      );

      expect(before.length).toBe(1);

      const oldBackground = before[0].background;

      const response = await request(app)
        .put(`${BASE_URL}/${heroId}`)
        .field("title", "Hero Testing Jest")
        .field("subtitle", "Subtitle Testing Jest")
        .field("button_text", "Daftar Sekarang")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Hero berhasil diperbarui",
      });

      const after = await queryPromise(
        `SELECT title, subtitle, button_text, background
         FROM hero_section
         WHERE id=?`,
        [heroId]
      );

      expect(after.length).toBe(1);

      expect(after[0].title).toBe("Hero Testing Jest");

      expect(after[0].subtitle).toBe("Subtitle Testing Jest");

      expect(after[0].button_text).toBe("Daftar Sekarang");

      // Background lama harus tetap
      expect(after[0].background).toBe(oldBackground);
    });

    // --------------------------------------------------
    // PUT DENGAN GAMBAR BARU
    // --------------------------------------------------

    test("berhasil memperbarui hero dengan background baru", async () => {
      if (!heroId) {
        console.log("Tidak ada data hero untuk pengujian upload.");
        return;
      }

      const dummyImage = Buffer.from("dummy image untuk pengujian hero");

      const response = await request(app)
        .put(`${BASE_URL}/${heroId}`)
        .field("title", "Hero Dengan Background Baru")
        .field("subtitle", "Subtitle Dengan Background Baru")
        .field("button_text", "Mulai Belajar")
        .attach("background", dummyImage, "hero-test.jpg")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Hero berhasil diperbarui",
      });

      const after = await queryPromise(
        `SELECT title, subtitle, button_text, background
         FROM hero_section
         WHERE id=?`,
        [heroId]
      );

      expect(after.length).toBe(1);

      expect(after[0].title).toBe("Hero Dengan Background Baru");

      expect(after[0].subtitle).toBe("Subtitle Dengan Background Baru");

      expect(after[0].button_text).toBe("Mulai Belajar");

      expect(after[0].background).toMatch(/^\/uploads\/.+\.jpg$/);

      // Simpan file hasil testing
      if (after[0].background) {
        const filePath = path.join(
          process.cwd(),
          after[0].background.replace(/^\/+/, "")
        );

        createdFiles.push(filePath);
      }
    });

    // --------------------------------------------------
    // PUT - ERROR SELECT
    // --------------------------------------------------

    test("gagal memperbarui hero ketika query SELECT mengalami error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error SELECT hero"));
        }
      });

      const response = await request(app)
        .put(`${BASE_URL}/1`)
        .field("title", "Hero Error")
        .field("subtitle", "Subtitle Error")
        .field("button_text", "Button Error")
        .expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });

    // --------------------------------------------------
    // PUT - ERROR UPDATE
    // --------------------------------------------------

    test("gagal memperbarui hero ketika query UPDATE mengalami error", async () => {
      if (!heroId) {
        console.log("Tidak ada data hero untuk pengujian UPDATE error.");
        return;
      }

      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const sql = String(args[0]);
        const callback = args[args.length - 1];

        if (typeof callback !== "function") {
          return;
        }

        // SELECT berhasil
        if (sql.includes("SELECT * FROM hero_section WHERE id")) {
          callback(null, [
            {
              id: heroId,
              title: "Hero Test",
              subtitle: "Subtitle Test",
              button_text: "Button Test",
              background: "/uploads/test.jpg",
            },
          ]);

          return;
        }

        // UPDATE mengalami error
        if (sql.includes("UPDATE hero_section")) {
          callback(new Error("Simulasi error UPDATE hero"));

          return;
        }

        callback(null, []);
      });

      const response = await request(app)
        .put(`${BASE_URL}/${heroId}`)
        .field("title", "Hero Update Error")
        .field("subtitle", "Subtitle Update Error")
        .field("button_text", "Button Update Error")
        .expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // CLEANUP
  // ====================================================

  afterAll(async () => {
    // --------------------------------------------------
    // KEMBALIKAN DATA HERO ASLI
    // --------------------------------------------------

    if (originalHero && heroId) {
      try {
        await queryPromise(
          `UPDATE hero_section
           SET
             title = ?,
             subtitle = ?,
             button_text = ?,
             background = ?
           WHERE id = ?`,
          [
            originalHero.title,
            originalHero.subtitle,
            originalHero.button_text,
            originalHero.background,
            heroId,
          ]
        );

        console.log("Data hero berhasil dikembalikan ke kondisi awal.");
      } catch (error) {
        console.error("Gagal mengembalikan data hero:", error.message);
      }
    }

    // --------------------------------------------------
    // HAPUS FILE HASIL TESTING
    // --------------------------------------------------

    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);

          console.log("File testing dihapus:", file);
        }
      } catch (error) {
        console.log("Gagal menghapus file testing:", file);
      }
    }
  });
});
