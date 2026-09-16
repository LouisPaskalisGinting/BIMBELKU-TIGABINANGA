const request = require("supertest");
const app = require("../server");
const db = require("../db");

// ======================================================
// Helper Query Promise
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
// Variabel Test
// ======================================================
let programId = null;
let programAktifId = null;

// ======================================================
// Data Program Test
// ======================================================
const programTest = {
  nama_program: "Program Jest Test",
  deskripsi: "Program untuk pengujian white-box testing",
  harga: 1500000,
  durasi: "6 Bulan",
  level: "Pemula",
  jumlah_pertemuan: 24,
  gambar: "jest-test.jpg",
  status: "aktif",
};

// ======================================================
// TEST SUITE
// ======================================================
describe("PROGRAM ROUTES - WHITE BOX TESTING", () => {
  // ====================================================
  // GET SEMUA PROGRAM
  // ====================================================
  describe("GET /program", () => {
    test("berhasil mengambil semua program", async () => {
      const response = await request(app).get("/program").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ====================================================
  // GET PROGRAM AKTIF
  // ====================================================
  describe("GET /program/aktif", () => {
    test("berhasil mengambil semua program aktif", async () => {
      const response = await request(app).get("/program/aktif").expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Memastikan seluruh program memiliki status aktif
      response.body.forEach((program) => {
        expect(program.status).toBe("aktif");
      });
    });
  });

  // ====================================================
  // POST PROGRAM
  // ====================================================
  describe("POST /program", () => {
    test("berhasil menambahkan program baru", async () => {
      const response = await request(app)
        .post("/program")
        .send(programTest)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Program berhasil ditambahkan"
      );

      // Mengambil data yang baru dimasukkan
      const result = await queryPromise(
        "SELECT * FROM program WHERE nama_program=? ORDER BY id DESC LIMIT 1",
        [programTest.nama_program]
      );

      expect(result.length).toBe(1);

      programId = result[0].id;

      expect(result[0].nama_program).toBe(programTest.nama_program);

      expect(result[0].deskripsi).toBe(programTest.deskripsi);

      expect(Number(result[0].harga)).toBe(programTest.harga);

      expect(result[0].durasi).toBe(programTest.durasi);

      expect(result[0].level).toBe(programTest.level);

      expect(Number(result[0].jumlah_pertemuan)).toBe(
        programTest.jumlah_pertemuan
      );

      expect(result[0].gambar).toBe(programTest.gambar);

      expect(result[0].status).toBe(programTest.status);
    });

    test("berhasil menambahkan program dengan status nonaktif", async () => {
      const data = {
        nama_program: "Program Jest Nonaktif",
        deskripsi: "Program nonaktif untuk pengujian",
        harga: 1000000,
        durasi: "3 Bulan",
        level: "Menengah",
        jumlah_pertemuan: 12,
        gambar: "nonaktif-test.jpg",
        status: "nonaktif",
      };

      const response = await request(app)
        .post("/program")
        .send(data)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Program berhasil ditambahkan"
      );

      const result = await queryPromise(
        "SELECT * FROM program WHERE nama_program=? ORDER BY id DESC LIMIT 1",
        [data.nama_program]
      );

      expect(result.length).toBe(1);

      expect(result[0].status).toBe("nonaktif");

      // Hapus data setelah pengujian
      await queryPromise("DELETE FROM program WHERE id=?", [result[0].id]);
    });

    test("tetap menjalankan POST meskipun body kosong", async () => {
      const response = await request(app)
        .post("/program")
        .send({})
        .expect((res) => {
          /*
           * Route tidak memiliki validasi body.
           *
           * Jika database mengizinkan NULL:
           * response = 200.
           *
           * Jika database menolak NULL:
           * response = 500.
           */
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        const result = await queryPromise(
          "SELECT * FROM program ORDER BY id DESC LIMIT 1"
        );

        /*
         * Jika data kosong berhasil dibuat,
         * hapus kembali data tersebut.
         */
        if (result.length > 0 && result[0].nama_program === null) {
          await queryPromise("DELETE FROM program WHERE id=?", [result[0].id]);
        }
      }
    });
  });

  // ====================================================
  // PUT PROGRAM
  // ====================================================
  describe("PUT /program/:id", () => {
    test("berhasil mengupdate program", async () => {
      expect(programId).not.toBeNull();

      const updateData = {
        nama_program: "Program Jest Test Updated",
        deskripsi: "Deskripsi program setelah diperbarui",
        harga: 2000000,
        durasi: "8 Bulan",
        level: "Lanjutan",
        jumlah_pertemuan: 32,
        gambar: "updated-test.jpg",
        status: "aktif",
      };

      const response = await request(app)
        .put(`/program/${programId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Program berhasil diupdate"
      );

      // Verifikasi langsung ke database
      const result = await queryPromise("SELECT * FROM program WHERE id=?", [
        programId,
      ]);

      expect(result.length).toBe(1);

      expect(result[0].nama_program).toBe(updateData.nama_program);

      expect(result[0].deskripsi).toBe(updateData.deskripsi);

      expect(Number(result[0].harga)).toBe(updateData.harga);

      expect(result[0].durasi).toBe(updateData.durasi);

      expect(result[0].level).toBe(updateData.level);

      expect(Number(result[0].jumlah_pertemuan)).toBe(
        updateData.jumlah_pertemuan
      );

      expect(result[0].gambar).toBe(updateData.gambar);

      expect(result[0].status).toBe(updateData.status);
    });

    test("berhasil mengupdate sebagian data program", async () => {
      expect(programId).not.toBeNull();

      const response = await request(app)
        .put(`/program/${programId}`)
        .send({
          harga: 2500000,
        })
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Program berhasil diupdate"
      );

      const result = await queryPromise("SELECT * FROM program WHERE id=?", [
        programId,
      ]);

      expect(result.length).toBe(1);

      expect(Number(result[0].harga)).toBe(2500000);
    });

    test("PUT dengan ID program yang tidak ada", async () => {
      const response = await request(app)
        .put("/program/999999999")
        .send({
          nama_program: "Program Tidak Ada",
        })
        .expect(200);

      /*
       * Route tidak memeriksa affectedRows.
       * Oleh karena itu ID yang tidak ditemukan
       * tetap menghasilkan response 200 selama
       * query SQL tidak error.
       */
      expect(response.body).toHaveProperty(
        "message",
        "Program berhasil diupdate"
      );
    });

    test("PUT dengan ID tidak valid", async () => {
      const response = await request(app).put("/program/abc").send({
        nama_program: "Program Test",
      });

      /*
       * Karena route langsung meneruskan ID
       * ke query SQL, hasil bergantung pada
       * konfigurasi MySQL.
       */
      expect([200, 500]).toContain(response.status);
    });
  });

  // ====================================================
  // DELETE PROGRAM
  // ====================================================
  describe("DELETE /program/:id", () => {
    test("ID program tidak ditemukan", async () => {
      const response = await request(app)
        .delete("/program/999999999")
        .expect(200);

      /*
       * Route tidak memeriksa affectedRows.
       * DELETE tetap menghasilkan 200 jika query berhasil.
       */
      expect(response.body).toHaveProperty("message", "Program dihapus");
    });

    test("berhasil menghapus program", async () => {
      expect(programId).not.toBeNull();

      const response = await request(app)
        .delete(`/program/${programId}`)
        .expect(200);

      expect(response.body).toHaveProperty("message", "Program dihapus");

      // Pastikan data benar-benar terhapus
      const result = await queryPromise("SELECT * FROM program WHERE id=?", [
        programId,
      ]);

      expect(result.length).toBe(0);

      programId = null;
    });
  });

  // ====================================================
  // VERIFIKASI PROGRAM AKTIF
  // ====================================================
  describe("GET /program/aktif - verifikasi", () => {
    test("program dengan status aktif dapat ditemukan", async () => {
      const data = {
        nama_program: "Program Aktif Jest",
        deskripsi: "Data aktif untuk pengujian",
        harga: 1200000,
        durasi: "4 Bulan",
        level: "Pemula",
        jumlah_pertemuan: 16,
        gambar: "aktif-jest.jpg",
        status: "aktif",
      };

      const insertResult = await queryPromise(
        `INSERT INTO program
        (
          nama_program,
          deskripsi,
          harga,
          durasi,
          level,
          jumlah_pertemuan,
          gambar,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.nama_program,
          data.deskripsi,
          data.harga,
          data.durasi,
          data.level,
          data.jumlah_pertemuan,
          data.gambar,
          data.status,
        ]
      );

      programAktifId = insertResult.insertId;

      const response = await request(app).get("/program/aktif").expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      const ditemukan = response.body.find(
        (program) => program.id === programAktifId
      );

      expect(ditemukan).toBeDefined();

      expect(ditemukan.status).toBe("aktif");
    });
  });

  // ====================================================
  // DATABASE ERROR TESTING
  // ====================================================
  describe("PROGRAM - DATABASE ERROR", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    // --------------------------------------------------
    // GET SEMUA PROGRAM
    // --------------------------------------------------
    test("GET /program gagal ketika database error", async () => {
      jest.spyOn(db, "query").mockImplementation((sql, callback) => {
        callback(new Error("Database error"), null);
      });

      const response = await request(app).get("/program");

      expect(response.status).toBe(500);

      /*
       * Route menggunakan:
       * res.status(500).json(err)
       *
       * Object Error akan diserialisasi
       * menjadi object kosong.
       */
      expect(response.body).toEqual({});
    });

    // --------------------------------------------------
    // GET PROGRAM AKTIF
    // --------------------------------------------------
    test("GET /program/aktif gagal ketika database error", async () => {
      jest.spyOn(db, "query").mockImplementation((sql, callback) => {
        callback(new Error("Database error"), null);
      });

      const response = await request(app).get("/program/aktif");

      expect(response.status).toBe(500);

      expect(response.body).toEqual({});
    });

    // --------------------------------------------------
    // POST PROGRAM
    // --------------------------------------------------
    test("POST /program gagal ketika database error", async () => {
      jest.spyOn(db, "query").mockImplementation((sql, values, callback) => {
        callback(new Error("Database error"), null);
      });

      const response = await request(app).post("/program").send(programTest);

      expect(response.status).toBe(500);

      expect(response.body).toEqual({});
    });

    // --------------------------------------------------
    // PUT PROGRAM
    // --------------------------------------------------
    test("PUT /program/:id gagal ketika database error", async () => {
      jest.spyOn(db, "query").mockImplementation((sql, values, callback) => {
        callback(new Error("Database error"), null);
      });

      const response = await request(app).put("/program/1").send({
        nama_program: "Program Error",
      });

      expect(response.status).toBe(500);

      expect(response.body).toEqual({});
    });

    // --------------------------------------------------
    // DELETE PROGRAM
    // --------------------------------------------------
    test("DELETE /program/:id gagal ketika database error", async () => {
      jest.spyOn(db, "query").mockImplementation((sql, values, callback) => {
        callback(new Error("Database error"), null);
      });

      const response = await request(app).delete("/program/1");

      expect(response.status).toBe(500);

      expect(response.body).toEqual({});
    });
  });

  // ====================================================
  // CLEANUP
  // ====================================================
  afterAll(async () => {
    // Pastikan mock dikembalikan
    jest.restoreAllMocks();

    // Hapus program test utama jika masih ada
    if (programId !== null) {
      await queryPromise("DELETE FROM program WHERE id=?", [programId]);
    }

    // Hapus program aktif test
    if (programAktifId !== null) {
      await queryPromise("DELETE FROM program WHERE id=?", [programAktifId]);
    }

    // Hapus kemungkinan data test berdasarkan nama
    await queryPromise(
      `DELETE FROM program
       WHERE nama_program IN (?, ?, ?)`,
      [
        "Program Jest Test Updated",
        "Program Jest Nonaktif",
        "Program Aktif Jest",
      ]
    );
  });
});
