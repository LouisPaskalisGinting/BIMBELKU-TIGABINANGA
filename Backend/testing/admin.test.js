const request = require("supertest");

// =====================================================
// MOCK DATABASE
// =====================================================
jest.mock("../db", () => ({
  query: jest.fn(),
}));

// =====================================================
// MOCK BCRYPT
// =====================================================
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

// =====================================================
// IMPORT
// =====================================================
const db = require("../db");
const bcrypt = require("bcryptjs");
const app = require("../server");

// =====================================================
// HELPER DATABASE
// =====================================================

function dbSuccess(result) {
  db.query.mockImplementationOnce((sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
    }

    callback(null, result);
  });
}

function dbError(message = "Database error") {
  db.query.mockImplementationOnce((sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
    }

    callback(new Error(message));
  });
}

function dbSequence(...responses) {
  responses.forEach((response) => {
    if (response instanceof Error) {
      dbError(response.message);
    } else {
      dbSuccess(response);
    }
  });
}

// =====================================================
// RESET MOCK SEBELUM SETIAP TEST
// =====================================================
beforeEach(() => {
  jest.clearAllMocks();

  db.query.mockReset();

  bcrypt.hash.mockReset();
  bcrypt.hash.mockResolvedValue("HASHED_PASSWORD");
});

// =====================================================
// GET /admin
// =====================================================
describe("GET /admin", () => {
  test("berhasil mengambil semua data admin", async () => {
    const admins = [
      {
        id: 3,
        nama: "Admin Tiga",
        email: "admin3@test.com",
        role: "admin",
      },
      {
        id: 2,
        nama: "Admin Dua",
        email: "admin2@test.com",
        role: "admin",
      },
    ];

    dbSuccess(admins);

    const response = await request(app).get("/admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(admins);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("berhasil jika data admin kosong", async () => {
    dbSuccess([]);

    const response = await request(app).get("/admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("500 jika database error", async () => {
    dbError("Database gagal mengambil admin");

    const response = await request(app).get("/admin");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });
});

// =====================================================
// GET /admin/:id
// =====================================================
describe("GET /admin/:id", () => {
  test("berhasil mengambil detail admin", async () => {
    const admin = {
      id: 1,
      nama: "Admin Utama",
      email: "admin@test.com",
      role: "admin",
    };

    dbSuccess([admin]);

    const response = await request(app).get("/admin/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(admin);
  });

  test("404 jika admin tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/admin/999");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Admin tidak ditemukan",
    });
  });

  test("500 jika database error", async () => {
    dbError("Database detail error");

    const response = await request(app).get("/admin/1");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });
});

// =====================================================
// POST /admin
// =====================================================
describe("POST /admin", () => {
  test("400 jika nama tidak diisi", async () => {
    const response = await request(app).post("/admin").send({
      email: "admin@test.com",
      password: "password123",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Semua field wajib diisi",
    });
  });

  test("400 jika email tidak diisi", async () => {
    const response = await request(app).post("/admin").send({
      nama: "Admin Test",
      password: "password123",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Semua field wajib diisi",
    });
  });

  test("400 jika password tidak diisi", async () => {
    const response = await request(app).post("/admin").send({
      nama: "Admin Test",
      email: "admin@test.com",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Semua field wajib diisi",
    });
  });

  test("400 jika semua field tidak diisi", async () => {
    const response = await request(app).post("/admin").send({});

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Semua field wajib diisi",
    });
  });

  test("400 jika password kurang dari 6 karakter", async () => {
    const response = await request(app).post("/admin").send({
      nama: "Admin Test",
      email: "admin@test.com",
      password: "12345",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Password minimal 6 karakter",
    });
  });

  test("500 jika pengecekan email mengalami database error", async () => {
    dbError("Database check email error");

    const response = await request(app).post("/admin").send({
      nama: "Admin Test",
      email: "admin@test.com",
      password: "password123",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });

  test("400 jika email sudah digunakan", async () => {
    dbSuccess([
      {
        id: 10,
      },
    ]);

    const response = await request(app).post("/admin").send({
      nama: "Admin Baru",
      email: "admin@test.com",
      password: "password123",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Email sudah digunakan",
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test("berhasil menambahkan admin baru", async () => {
    dbSequence([], {
      insertId: 10,
      affectedRows: 1,
    });

    bcrypt.hash.mockResolvedValue("HASH_ADMIN");

    const response = await request(app).post("/admin").send({
      nama: "Admin Baru",
      email: "adminbaru@test.com",
      password: "password123",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Admin berhasil ditambahkan",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test("500 jika INSERT admin mengalami database error", async () => {
    dbSequence([], new Error("Database insert admin error"));

    const response = await request(app).post("/admin").send({
      nama: "Admin Baru",
      email: "insert@test.com",
      password: "password123",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });

  // ===================================================
  // MENUTUP LINE 130
  // ===================================================
  test("500 jika terjadi error synchronous pada db.query", async () => {
    db.query.mockImplementationOnce(() => {
      throw new Error("Synchronous database error");
    });

    const response = await request(app).post("/admin").send({
      nama: "Admin Test",
      email: "sync@test.com",
      password: "password123",
    });

    expect(response.status).toBe(500);

    // Error object jika dikirim dengan res.json(error)
    // akan menjadi object kosong saat diserialisasi JSON.
    expect(response.body).toEqual({});
  });
});

// =====================================================
// PUT /admin/:id
// =====================================================
describe("PUT /admin/:id", () => {
  test("500 jika query admin awal mengalami database error", async () => {
    dbError("Database admin awal error");

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Update",
      email: "update@test.com",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });

  test("404 jika admin tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).put("/admin/999").send({
      nama: "Admin Update",
      email: "update@test.com",
    });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Admin tidak ditemukan",
    });
  });

  test("500 jika pengecekan email mengalami database error", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      new Error("Database check email error")
    );

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Update",
      email: "update@test.com",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });

  test("400 jika email sudah digunakan admin lain", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      [
        {
          id: 2,
        },
      ]
    );

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Update",
      email: "admin2@test.com",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Email sudah digunakan",
    });
  });

  test("berhasil update admin tanpa mengganti password", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      [],
      {
        affectedRows: 1,
      }
    );

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Baru",
      email: "baru@test.com",
      password: "",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Admin berhasil diperbarui",
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();

    expect(db.query).toHaveBeenCalledTimes(3);
  });

  test("berhasil update admin dengan password baru", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      [],
      {
        affectedRows: 1,
      }
    );

    bcrypt.hash.mockResolvedValue("PASSWORD_BARU");

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Baru",
      email: "baru@test.com",
      password: "password123",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Admin berhasil diperbarui",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    expect(db.query).toHaveBeenCalledTimes(3);
  });

  test("berhasil update jika password hanya berisi spasi", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      [],
      {
        affectedRows: 1,
      }
    );

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Baru",
      email: "baru@test.com",
      password: "   ",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Admin berhasil diperbarui",
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test("berhasil update jika password tidak dikirim", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      [],
      {
        affectedRows: 1,
      }
    );

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Baru",
      email: "baru@test.com",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Admin berhasil diperbarui",
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test("500 jika UPDATE admin tanpa password mengalami database error", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      [],
      new Error("Database update error")
    );

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Baru",
      email: "baru@test.com",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });

  test("500 jika UPDATE admin dengan password mengalami database error", async () => {
    dbSequence(
      [
        {
          id: 1,
          nama: "Admin Lama",
          email: "lama@test.com",
          role: "admin",
        },
      ],
      [],
      new Error("Database update password error")
    );

    bcrypt.hash.mockResolvedValue("HASH_BARU");

    const response = await request(app).put("/admin/1").send({
      nama: "Admin Baru",
      email: "baru@test.com",
      password: "password123",
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });
});

// =====================================================
// DELETE /admin/:id
// =====================================================
describe("DELETE /admin/:id", () => {
  test("berhasil menghapus admin", async () => {
    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).delete("/admin/1");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Admin berhasil dihapus",
    });
  });

  test("tetap berhasil jika admin tidak ditemukan", async () => {
    dbSuccess({
      affectedRows: 0,
    });

    const response = await request(app).delete("/admin/999");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Admin berhasil dihapus",
    });
  });

  test("500 jika database error", async () => {
    dbError("Database delete admin error");

    const response = await request(app).delete("/admin/1");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({});
  });
});
