const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = require("../server");
const db = require("../db");

const BASE_URL = "/auth";

const JWT_SECRET = process.env.JWT_SECRET || "bimbelku_secret_key_2026";

// ======================================================
// HELPER MOCK DATABASE
// ======================================================

function mockDb(result = [], error = null) {
  return jest.spyOn(db, "query").mockImplementation((sql, params, callback) => {
    callback(error, result);
  });
}

// ======================================================
// TEST AUTH
// ======================================================

describe("Whitebox Testing - Auth", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ====================================================
  // LOGIN
  // ====================================================

  test("LOGIN - email dan password tidak diisi", async () => {
    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      message: "Email dan password wajib diisi",
    });
  });

  test("LOGIN - email tidak diisi", async () => {
    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        password: "password123",
      })
      .expect(400);

    expect(response.body).toEqual({
      message: "Email dan password wajib diisi",
    });
  });

  test("LOGIN - password tidak diisi", async () => {
    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "admin@gmail.com",
      })
      .expect(400);

    expect(response.body).toEqual({
      message: "Email dan password wajib diisi",
    });
  });

  // ====================================================
  // LOGIN - DATABASE ERROR
  // ====================================================

  test("LOGIN - database error", async () => {
    mockDb([], new Error("Database error"));

    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "admin@gmail.com",
        password: "password123",
      })
      .expect(500);

    expect(response.body).toEqual({
      message: "Terjadi kesalahan pada server",
    });
  });

  // ====================================================
  // LOGIN - USER TIDAK DITEMUKAN
  // ====================================================

  test("LOGIN - email tidak ditemukan", async () => {
    mockDb([]);

    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "tidakada@gmail.com",
        password: "password123",
      })
      .expect(401);

    expect(response.body).toEqual({
      message: "Email atau password salah",
    });
  });

  // ====================================================
  // LOGIN - PASSWORD SALAH
  // ====================================================

  test("LOGIN - password salah", async () => {
    mockDb([
      {
        id: 1,
        nama: "Admin Test",
        email: "admin@gmail.com",
        password: "hashed-password",
        role: "admin",
      },
    ]);

    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "admin@gmail.com",
        password: "password-salah",
      })
      .expect(401);

    expect(response.body).toEqual({
      message: "Email atau password salah",
    });
  });

  // ====================================================
  // LOGIN - BERHASIL
  // ====================================================

  test("LOGIN - berhasil", async () => {
    mockDb([
      {
        id: 1,
        nama: "Admin Test",
        email: "admin@gmail.com",
        password: "hashed-password",
        role: "admin",
      },
    ]);

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "ADMIN@GMAIL.COM",
        password: "password123",
      })
      .expect(200);

    expect(response.body.message).toBe("Login berhasil");

    expect(response.body.token).toBeDefined();

    expect(response.body.user).toEqual({
      id: 1,
      nama: "Admin Test",
      email: "admin@gmail.com",
      role: "admin",
    });

    const decoded = jwt.verify(response.body.token, JWT_SECRET);

    expect(decoded.id).toBe(1);
    expect(decoded.nama).toBe("Admin Test");
    expect(decoded.email).toBe("admin@gmail.com");
    expect(decoded.role).toBe("admin");
  });

  // ====================================================
  // LOGIN - EMAIL TRIM
  // ====================================================

  test("LOGIN - email menggunakan trim dan lowercase", async () => {
    const mockedQuery = mockDb([
      {
        id: 2,
        nama: "Admin Trim",
        email: "admin2@gmail.com",
        password: "hashed-password",
        role: "admin",
      },
    ]);

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "   ADMIN2@GMAIL.COM   ",
        password: "password123",
      })
      .expect(200);

    const params = mockedQuery.mock.calls[0][1];

    expect(params).toEqual(["admin2@gmail.com"]);
  });

  // ====================================================
  // LOGIN - ERROR BCRYPT
  // ====================================================

  test("LOGIN - bcrypt compare mengalami error", async () => {
    mockDb([
      {
        id: 3,
        nama: "Admin Bcrypt",
        email: "bcrypt@gmail.com",
        password: "hashed-password",
        role: "admin",
      },
    ]);

    jest.spyOn(bcrypt, "compare").mockRejectedValue(new Error("Bcrypt error"));

    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "bcrypt@gmail.com",
        password: "password123",
      })
      .expect(500);

    expect(response.body).toEqual({
      message: "Terjadi kesalahan saat login",
    });
  });

  // ====================================================
  // LOGIN - JWT ERROR
  // ====================================================

  test("LOGIN - jwt.sign mengalami error", async () => {
    mockDb([
      {
        id: 4,
        nama: "Admin JWT",
        email: "jwt@gmail.com",
        password: "hashed-password",
        role: "admin",
      },
    ]);

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    jest.spyOn(jwt, "sign").mockImplementation(() => {
      throw new Error("JWT sign error");
    });

    const response = await request(app)
      .post(`${BASE_URL}/login`)
      .send({
        email: "jwt@gmail.com",
        password: "password123",
      })
      .expect(500);

    expect(response.body).toEqual({
      message: "Terjadi kesalahan saat login",
    });
  });

  // ====================================================
  // /ME - TOKEN TIDAK ADA
  // ====================================================

  test("GET /auth/me - token tidak ditemukan", async () => {
    const response = await request(app).get(`${BASE_URL}/me`).expect(401);

    expect(response.body).toEqual({
      message: "Token tidak ditemukan",
    });
  });

  // ====================================================
  // /ME - FORMAT TOKEN
  // ====================================================

  test("GET /auth/me - authorization hanya Bearer", async () => {
    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", "Bearer")
      .expect(401);

    expect(response.body).toEqual({
      message: "Format token tidak valid",
    });
  });

  test("GET /auth/me - authorization bukan Bearer", async () => {
    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", "Token abc123")
      .expect(401);

    expect(response.body).toEqual({
      message: "Format token tidak valid",
    });
  });

  test("GET /auth/me - authorization memiliki tiga bagian", async () => {
    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", "Bearer abc tambahan")
      .expect(401);

    expect(response.body).toEqual({
      message: "Format token tidak valid",
    });
  });

  // ====================================================
  // /ME - TOKEN INVALID
  // ====================================================

  test("GET /auth/me - token tidak valid", async () => {
    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", "Bearer token-tidak-valid")
      .expect(401);

    expect(response.body).toEqual({
      message: "Token tidak valid atau sudah expired",
    });
  });

  // ====================================================
  // /ME - TOKEN VALID, USER DITEMUKAN
  // ====================================================

  test("GET /auth/me - user berhasil ditemukan", async () => {
    const token = jwt.sign(
      {
        id: 10,
        nama: "User Test",
        email: "user@gmail.com",
        role: "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    mockDb([
      {
        id: 10,
        nama: "User Test",
        email: "user@gmail.com",
        role: "admin",
      },
    ]);

    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      user: {
        id: 10,
        nama: "User Test",
        email: "user@gmail.com",
        role: "admin",
      },
    });
  });

  // ====================================================
  // /ME - DATABASE ERROR
  // ====================================================

  test("GET /auth/me - database error", async () => {
    const token = jwt.sign(
      {
        id: 11,
        nama: "User DB Error",
        email: "dberror@gmail.com",
        role: "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    mockDb([], new Error("Database user error"));

    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", `Bearer ${token}`)
      .expect(500);

    expect(response.body).toEqual({
      message: "Gagal mengambil data user",
    });
  });

  // ====================================================
  // /ME - USER TIDAK DITEMUKAN
  // ====================================================

  test("GET /auth/me - user tidak ditemukan", async () => {
    const token = jwt.sign(
      {
        id: 999999,
        nama: "Tidak Ada",
        email: "tidakada@gmail.com",
        role: "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    mockDb([]);

    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      message: "User tidak ditemukan",
    });
  });

  // ====================================================
  // /ME - TOKEN EXPIRED
  // ====================================================

  test("GET /auth/me - token sudah expired", async () => {
    const token = jwt.sign(
      {
        id: 12,
        nama: "Expired User",
        email: "expired@gmail.com",
        role: "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "-1s",
      }
    );

    const response = await request(app)
      .get(`${BASE_URL}/me`)
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    expect(response.body).toEqual({
      message: "Token tidak valid atau sudah expired",
    });
  });

  // ====================================================
  // LOGOUT
  // ====================================================

  test("POST /auth/logout - berhasil logout", async () => {
    const response = await request(app).post(`${BASE_URL}/logout`).expect(200);

    expect(response.body).toEqual({
      message: "Logout berhasil",
    });
  });
});
