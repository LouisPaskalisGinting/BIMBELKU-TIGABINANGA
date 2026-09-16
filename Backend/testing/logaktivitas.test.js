const request = require("supertest");

// =====================================================
// MOCK DATABASE
// =====================================================

jest.mock("../db", () => ({
  query: jest.fn(),
}));

// =====================================================
// MOCK AUTH MIDDLEWARE
// =====================================================

jest.mock("../middleware/authMiddleware", () => {
  return (req, res, next) => {
    // Simulasi tidak memiliki token
    if (req.headers.authorization === "NO_TOKEN") {
      return res.status(401).json({
        message: "Token tidak ditemukan",
      });
    }

    // Simulasi admin
    if (req.headers["x-test-role"] === "admin") {
      req.user = {
        id: 1,
        nama: "Admin Test",
        role: "admin",
      };
    }

    // Simulasi user biasa
    else {
      req.user = {
        id: 2,
        nama: "User Test",
        role: "tentor",
      };
    }

    next();
  };
});

// =====================================================
// IMPORT
// =====================================================

const db = require("../db");
const app = require("../server");

// =====================================================
// HELPER DATABASE
// =====================================================

const mockDbSuccess = (result) => {
  db.query.mockImplementationOnce((sql, params, callback) => {
    // Mendukung:
    // db.query(sql, callback)
    // db.query(sql, params, callback)

    if (typeof params === "function") {
      callback = params;
    }

    callback(null, result);
  });
};

const mockDbError = (message = "Database error") => {
  db.query.mockImplementationOnce((sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
    }

    callback(new Error(message), null);
  });
};

// =====================================================
// DATA TEST
// =====================================================

const sampleLogs = [
  {
    id: 1,
    user_id: 1,
    nama_user: "Admin Test",
    role: "admin",
    aktivitas: "Tambah Data",
    keterangan: "Menambahkan data siswa",
    tanggal: "2026-09-01 10:00:00",
  },
  {
    id: 2,
    user_id: 2,
    nama_user: "Tentor Test",
    role: "tentor",
    aktivitas: "Update Data",
    keterangan: "Mengubah data nilai",
    tanggal: "2026-09-01 09:00:00",
  },
];

// =====================================================
// RESET MOCK
// =====================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// =====================================================
// GET SEMUA LOG AKTIVITAS
// =====================================================

describe("GET /log-aktivitas", () => {
  test("berhasil mengambil semua log aktivitas", async () => {
    mockDbSuccess(sampleLogs);

    const response = await request(app)
      .get("/log-aktivitas")
      .set("x-test-role", "admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleLogs);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("gagal mengambil log karena database error", async () => {
    mockDbError("Database gagal");

    const response = await request(app)
      .get("/log-aktivitas")
      .set("x-test-role", "admin");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mengambil data log aktivitas",
      error: "Database gagal",
    });
  });

  test("gagal karena tidak memiliki token", async () => {
    const response = await request(app)
      .get("/log-aktivitas")
      .set("authorization", "NO_TOKEN");

    expect(response.status).toBe(401);
  });
});

// =====================================================
// GET DETAIL LOG
// =====================================================

describe("GET /log-aktivitas/:id", () => {
  test("berhasil mengambil detail log berdasarkan ID", async () => {
    const log = sampleLogs[0];

    mockDbSuccess([log]);

    const response = await request(app)
      .get("/log-aktivitas/1")
      .set("x-test-role", "admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(log);
  });

  test("mengembalikan 404 jika log tidak ditemukan", async () => {
    mockDbSuccess([]);

    const response = await request(app)
      .get("/log-aktivitas/999")
      .set("x-test-role", "admin");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Log aktivitas tidak ditemukan",
    });
  });

  test("gagal mengambil detail karena database error", async () => {
    mockDbError("Database detail gagal");

    const response = await request(app)
      .get("/log-aktivitas/1")
      .set("x-test-role", "admin");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mengambil detail log aktivitas",
      error: "Database detail gagal",
    });
  });
});

// =====================================================
// GET LOG BERDASARKAN USER
// =====================================================

describe("GET /log-aktivitas/user/:userId", () => {
  test("berhasil mengambil log berdasarkan user", async () => {
    const userLogs = [sampleLogs[1]];

    mockDbSuccess(userLogs);

    const response = await request(app)
      .get("/log-aktivitas/user/2")
      .set("x-test-role", "admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(userLogs);
  });

  test("berhasil ketika user tidak memiliki log", async () => {
    mockDbSuccess([]);

    const response = await request(app)
      .get("/log-aktivitas/user/999")
      .set("x-test-role", "admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("gagal mengambil log user karena database error", async () => {
    mockDbError("Database user log gagal");

    const response = await request(app)
      .get("/log-aktivitas/user/2")
      .set("x-test-role", "admin");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mengambil log aktivitas user",
      error: "Database user log gagal",
    });
  });
});

// =====================================================
// DELETE LOG
// =====================================================

describe("DELETE /log-aktivitas/:id", () => {
  test("admin berhasil menghapus log aktivitas", async () => {
    mockDbSuccess({
      affectedRows: 1,
    });

    const response = await request(app)
      .delete("/log-aktivitas/1")
      .set("x-test-role", "admin");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Log aktivitas berhasil dihapus",
    });
  });

  test("bukan admin tidak dapat menghapus log", async () => {
    const response = await request(app)
      .delete("/log-aktivitas/1")
      .set("x-test-role", "tentor");

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      message: "Hanya admin yang dapat menghapus log aktivitas",
    });

    // Database tidak boleh dipanggil
    expect(db.query).not.toHaveBeenCalled();
  });

  test("gagal menghapus karena database error", async () => {
    mockDbError("Database delete gagal");

    const response = await request(app)
      .delete("/log-aktivitas/1")
      .set("x-test-role", "admin");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal menghapus log aktivitas",
      error: "Database delete gagal",
    });
  });

  test("mengembalikan 404 jika log yang dihapus tidak ditemukan", async () => {
    mockDbSuccess({
      affectedRows: 0,
    });

    const response = await request(app)
      .delete("/log-aktivitas/999")
      .set("x-test-role", "admin");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Log aktivitas tidak ditemukan",
    });
  });

  test("admin dapat menghapus log dengan ID berbeda", async () => {
    mockDbSuccess({
      affectedRows: 2,
    });

    const response = await request(app)
      .delete("/log-aktivitas/10")
      .set("x-test-role", "admin");

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Log aktivitas berhasil dihapus");
  });
});
