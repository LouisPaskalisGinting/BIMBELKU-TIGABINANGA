const request = require("supertest");

const app = require("../server");
const db = require("../db");

// ======================================================
// KONFIGURASI
// ======================================================

const BASE_URL = "/faq";

// ======================================================
// HELPER
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
// TEST FAQ
// ======================================================

describe("FAQ ROUTES - WHITE BOX TESTING", () => {
  let faqId = null;

  // ====================================================
  // GET ALL FAQ
  // ====================================================

  describe("GET /faq", () => {
    test("berhasil mengambil semua FAQ", async () => {
      const response = await request(app).get(BASE_URL).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test("gagal mengambil semua FAQ ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error database"));
        }
      });

      const response = await request(app).get(BASE_URL).expect(500);

      // Karena route menggunakan res.json(err),
      // objek Error akan diserialisasi menjadi {}
      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // GET FAQ BY ID
  // ====================================================

  describe("GET /faq/:id", () => {
    test("berhasil mengambil FAQ berdasarkan ID", async () => {
      const data = await queryPromise(
        "SELECT id FROM faq ORDER BY id DESC LIMIT 1"
      );

      if (data.length === 0) {
        console.log("Tidak ada data FAQ untuk pengujian.");
        return;
      }

      faqId = data[0].id;

      const response = await request(app)
        .get(`${BASE_URL}/${faqId}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", faqId);
      expect(response.body).toHaveProperty("question");
      expect(response.body).toHaveProperty("answer");
    });

    test("mengembalikan 404 jika FAQ tidak ditemukan", async () => {
      const response = await request(app)
        .get(`${BASE_URL}/999999999`)
        .expect(404);

      expect(response.body).toEqual({
        message: "FAQ tidak ditemukan",
      });
    });

    test("gagal mengambil FAQ berdasarkan ID ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error database"));
        }
      });

      const response = await request(app).get(`${BASE_URL}/1`).expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // POST FAQ
  // ====================================================

  describe("POST /faq", () => {
    test("berhasil menambahkan FAQ", async () => {
      const response = await request(app)
        .post(BASE_URL)
        .send({
          question: "Apa itu Bimbelku?",
          answer: "Bimbelku merupakan sistem informasi bimbingan belajar.",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "FAQ berhasil ditambahkan",
      });

      // Ambil ID FAQ yang baru dibuat
      const data = await queryPromise(
        "SELECT id FROM faq WHERE question=? ORDER BY id DESC LIMIT 1",
        ["Apa itu Bimbelku?"]
      );

      expect(data.length).toBeGreaterThan(0);

      faqId = data[0].id;
    });

    test("tetap dapat memproses FAQ dengan field kosong sesuai implementasi route", async () => {
      const response = await request(app)
        .post(BASE_URL)
        .send({
          question: "",
          answer: "",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "FAQ berhasil ditambahkan",
      });

      const data = await queryPromise(
        "SELECT id FROM faq WHERE question=? AND answer=? ORDER BY id DESC LIMIT 1",
        ["", ""]
      );

      expect(data.length).toBeGreaterThan(0);

      const temporaryId = data[0].id;

      await queryPromise("DELETE FROM faq WHERE id=?", [temporaryId]);
    });

    test("gagal menambahkan FAQ ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error INSERT FAQ"));
        }
      });

      const response = await request(app)
        .post(BASE_URL)
        .send({
          question: "FAQ Test Error",
          answer: "Jawaban test error",
        })
        .expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // PUT FAQ
  // ====================================================

  describe("PUT /faq/:id", () => {
    test("berhasil memperbarui FAQ", async () => {
      // Pastikan memiliki data FAQ
      if (!faqId) {
        const data = await queryPromise(
          "SELECT id FROM faq ORDER BY id DESC LIMIT 1"
        );

        if (data.length === 0) {
          const insertResult = await queryPromise(
            "INSERT INTO faq(question, answer) VALUES(?, ?)",
            ["FAQ Sementara Untuk Test", "Jawaban sementara"]
          );

          faqId = insertResult.insertId;
        } else {
          faqId = data[0].id;
        }
      }

      const response = await request(app)
        .put(`${BASE_URL}/${faqId}`)
        .send({
          question: "Apa fungsi Bimbelku?",
          answer:
            "Bimbelku digunakan untuk mengelola kegiatan bimbingan belajar.",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "FAQ berhasil diperbarui",
      });

      // Verifikasi database
      const data = await queryPromise(
        "SELECT question, answer FROM faq WHERE id=?",
        [faqId]
      );

      expect(data.length).toBe(1);
      expect(data[0].question).toBe("Apa fungsi Bimbelku?");
      expect(data[0].answer).toBe(
        "Bimbelku digunakan untuk mengelola kegiatan bimbingan belajar."
      );
    });

    test("berhasil memperbarui FAQ dengan field kosong sesuai implementasi route", async () => {
      if (!faqId) {
        const data = await queryPromise(
          "SELECT id FROM faq ORDER BY id DESC LIMIT 1"
        );

        if (data.length === 0) {
          const insertResult = await queryPromise(
            "INSERT INTO faq(question, answer) VALUES(?, ?)",
            ["FAQ Test", "Jawaban Test"]
          );

          faqId = insertResult.insertId;
        } else {
          faqId = data[0].id;
        }
      }

      const response = await request(app)
        .put(`${BASE_URL}/${faqId}`)
        .send({
          question: "",
          answer: "",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "FAQ berhasil diperbarui",
      });
    });

    test("gagal memperbarui FAQ ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error UPDATE FAQ"));
        }
      });

      const response = await request(app)
        .put(`${BASE_URL}/1`)
        .send({
          question: "FAQ Error",
          answer: "Jawaban Error",
        })
        .expect(500);

      expect(response.body).toEqual({});

      spy.mockRestore();
    });
  });

  // ====================================================
  // DELETE FAQ
  // ====================================================

  describe("DELETE /faq/:id", () => {
    test("berhasil menghapus FAQ", async () => {
      // Buat data khusus untuk pengujian DELETE
      const insertResult = await queryPromise(
        "INSERT INTO faq(question, answer) VALUES(?, ?)",
        ["FAQ Untuk Dihapus", "Data ini dibuat khusus untuk pengujian."]
      );

      const deleteId = insertResult.insertId;

      const response = await request(app)
        .delete(`${BASE_URL}/${deleteId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "FAQ berhasil dihapus",
      });

      // Verifikasi data sudah terhapus
      const data = await queryPromise("SELECT id FROM faq WHERE id=?", [
        deleteId,
      ]);

      expect(data.length).toBe(0);
    });

    test("menghapus FAQ dengan ID yang tidak ada tetap mengembalikan 200 sesuai implementasi route", async () => {
      const response = await request(app)
        .delete(`${BASE_URL}/999999999`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "FAQ berhasil dihapus",
      });
    });

    test("gagal menghapus FAQ ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback === "function") {
          callback(new Error("Simulasi error DELETE FAQ"));
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
    // Bersihkan data yang dibuat oleh pengujian.
    // Jangan menghapus FAQ yang sudah ada sebelumnya.

    await queryPromise(
      `DELETE FROM faq
       WHERE question IN (
         'Apa itu Bimbelku?',
         'Apa fungsi Bimbelku?'
       )`
    ).catch(() => {});

    await queryPromise(
      `DELETE FROM faq
       WHERE question = '' AND answer = ''`
    ).catch(() => {});
  });
});
