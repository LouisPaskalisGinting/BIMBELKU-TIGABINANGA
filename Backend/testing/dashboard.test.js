const request = require("supertest");

const app = require("../server");
const db = require("../db");

// ======================================================
// KONFIGURASI
// ======================================================

const BASE_URL = "/dashboard";

// ======================================================
// HELPER
// ======================================================

const mockQueryError = (message) => {
  return jest.spyOn(db, "query").mockImplementation((...args) => {
    const callback = args[args.length - 1];

    if (typeof callback === "function") {
      callback(new Error(message));
    }
  });
};

// ======================================================
// TEST DASHBOARD
// ======================================================

describe("DASHBOARD ROUTES - WHITE BOX TESTING", () => {
  // ====================================================
  // GET /dashboard/stats
  // ====================================================

  describe("GET /dashboard/stats", () => {
    test("berhasil mengambil statistik dashboard", async () => {
      const response = await request(app).get(`${BASE_URL}/stats`).expect(200);

      expect(response.body).toHaveProperty("total_siswa");
      expect(response.body).toHaveProperty("total_tentor");
      expect(response.body).toHaveProperty("kelas_hari_ini");
      expect(response.body).toHaveProperty("pendaftar_bulan_ini");

      expect(typeof response.body.total_siswa).toBe("number");

      expect(typeof response.body.total_tentor).toBe("number");

      expect(typeof response.body.kelas_hari_ini).toBe("number");

      expect(typeof response.body.pendaftar_bulan_ini).toBe("number");
    });

    // ==================================================
    // ERROR TOTAL SISWA
    // ==================================================

    test("gagal mengambil total siswa ketika database error", async () => {
      const spy = mockQueryError("Simulasi error total siswa");

      const response = await request(app).get(`${BASE_URL}/stats`).expect(500);

      expect(response.body).toHaveProperty(
        "message",
        "Gagal mengambil total siswa"
      );

      expect(response.body).toHaveProperty("error");

      spy.mockRestore();
    });

    // ==================================================
    // ERROR TOTAL TENTOR
    // ==================================================

    test("gagal mengambil total tentor ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback !== "function") {
          return;
        }

        const sql = String(args[0]);

        // Query total siswa berhasil
        if (
          sql.includes("SELECT COUNT(*) AS total") &&
          sql.includes("FROM siswa")
        ) {
          callback(null, [{ total: 10 }]);
          return;
        }

        // Query total tentor error
        if (sql.includes("FROM tentor")) {
          callback(new Error("Simulasi error total tentor"));
          return;
        }

        callback(null, [{ total: 0 }]);
      });

      const response = await request(app).get(`${BASE_URL}/stats`).expect(500);

      expect(response.body).toHaveProperty(
        "message",
        "Gagal mengambil total tentor"
      );

      expect(response.body).toHaveProperty("error");

      spy.mockRestore();
    });

    // ==================================================
    // ERROR KELAS HARI INI
    // ==================================================

    test("gagal mengambil kelas hari ini ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback !== "function") {
          return;
        }

        const sql = String(args[0]);

        // Query total siswa
        if (sql.includes("FROM siswa") && sql.includes("status = 'approved'")) {
          callback(null, [{ total: 10 }]);
          return;
        }

        // Query total tentor
        if (sql.includes("FROM tentor")) {
          callback(null, [{ total: 5 }]);
          return;
        }

        // Query kelas hari ini
        if (sql.includes("FROM jadwal")) {
          callback(new Error("Simulasi error kelas hari ini"));
          return;
        }

        callback(null, [{ total: 0 }]);
      });

      const response = await request(app).get(`${BASE_URL}/stats`).expect(500);

      expect(response.body).toHaveProperty(
        "message",
        "Gagal mengambil kelas hari ini"
      );

      expect(response.body).toHaveProperty("error");

      spy.mockRestore();
    });

    // ==================================================
    // ERROR PENDAFTAR BULAN INI
    // ==================================================

    test("gagal mengambil pendaftar bulan ini ketika database error", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback !== "function") {
          return;
        }

        const sql = String(args[0]);

        // Query total siswa
        if (sql.includes("FROM siswa") && sql.includes("status = 'approved'")) {
          callback(null, [{ total: 10 }]);
          return;
        }

        // Query total tentor
        if (sql.includes("FROM tentor")) {
          callback(null, [{ total: 5 }]);
          return;
        }

        // Query kelas hari ini
        if (sql.includes("FROM jadwal")) {
          callback(null, [{ total: 3 }]);
          return;
        }

        // Query pendaftar bulan ini
        if (sql.includes("MONTH(created_at)")) {
          callback(new Error("Simulasi error pendaftar bulan ini"));
          return;
        }

        callback(null, [{ total: 0 }]);
      });

      const response = await request(app).get(`${BASE_URL}/stats`).expect(500);

      expect(response.body).toHaveProperty(
        "message",
        "Gagal mengambil pendaftar bulan ini"
      );

      expect(response.body).toHaveProperty("error");

      spy.mockRestore();
    });

    // ==================================================
    // VERIFIKASI NILAI STATISTIK
    // ==================================================

    test("mengembalikan nilai statistik sesuai hasil database", async () => {
      const spy = jest.spyOn(db, "query").mockImplementation((...args) => {
        const callback = args[args.length - 1];

        if (typeof callback !== "function") {
          return;
        }

        const sql = String(args[0]);

        // Total siswa
        if (sql.includes("FROM siswa") && sql.includes("status = 'approved'")) {
          callback(null, [{ total: 25 }]);
          return;
        }

        // Total tentor
        if (sql.includes("FROM tentor")) {
          callback(null, [{ total: 8 }]);
          return;
        }

        // Kelas hari ini
        if (sql.includes("FROM jadwal")) {
          callback(null, [{ total: 4 }]);
          return;
        }

        // Pendaftar bulan ini
        if (sql.includes("MONTH(created_at)")) {
          callback(null, [{ total: 12 }]);
          return;
        }

        callback(null, [{ total: 0 }]);
      });

      const response = await request(app).get(`${BASE_URL}/stats`).expect(200);

      expect(response.body).toEqual({
        total_siswa: 25,
        total_tentor: 8,
        kelas_hari_ini: 4,
        pendaftar_bulan_ini: 12,
      });

      spy.mockRestore();
    });
  });
});
