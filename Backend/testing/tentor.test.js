const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ======================================================
// MOCK AUTH MIDDLEWARE
// ======================================================
// Hanya berlaku untuk file testing ini.
// authMiddleware.js asli TIDAK perlu diubah.
// ======================================================
jest.mock("../middleware/authMiddleware", () => {
  const jwt = require("jsonwebtoken");

  return (req, res, next) => {
    // Digunakan untuk menguji branch fallback req.user
    if (req.headers["x-test-user-empty"] === "true") {
      req.user = {};
      return next();
    }

    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          message: "Token tidak ditemukan",
        });
      }

      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          message: "Format token tidak valid",
        });
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          message: "Token tidak ditemukan",
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret_bimbelku"
      );

      req.user = decoded;

      next();
    } catch (error) {
      return res.status(401).json({
        message: "Token tidak valid atau sudah expired",
      });
    }
  };
});

// ======================================================
// MOCK LOG AKTIVITAS
// ======================================================
jest.mock("../utils/logAktivitas", () => jest.fn());

// ======================================================
// IMPORT
// ======================================================
const app = require("../server");
const db = require("../db");
const logAktivitas = require("../utils/logAktivitas");

// ======================================================
// KONFIGURASI
// ======================================================
const BASE_URL = "/tentor";

const JWT_SECRET = process.env.JWT_SECRET || "bimbelku_secret_key_2026";

// ======================================================
// HELPER TOKEN
// ======================================================
function createToken(user = {}) {
  return jwt.sign(
    {
      id: user.id ?? 1,
      nama: user.nama ?? "Admin Test",
      email: user.email ?? "admin@gmail.com",
      role: user.role ?? "admin",
    },
    JWT_SECRET
  );
}

// ======================================================
// HELPER AUTH REQUEST
// ======================================================
function authRequest(method, url) {
  return request(app)
    [method](url)
    .set("Authorization", `Bearer ${createToken()}`);
}

// ======================================================
// HELPER MOCK DATABASE
// ======================================================
function mockDbSequence(sequence) {
  let index = 0;

  jest.spyOn(db, "query").mockImplementation((...args) => {
    const callback = args[args.length - 1];

    if (typeof callback !== "function") {
      throw new Error("Callback database tidak ditemukan");
    }

    const current = sequence[index++];

    if (!current) {
      return callback(null, []);
    }

    if (current.throwError) {
      throw current.throwError;
    }

    callback(current.err || null, current.result);
  });
}

// ======================================================
// DATABASE SUCCESS
// ======================================================
function dbSuccess(result) {
  return {
    err: null,
    result,
  };
}

// ======================================================
// DATABASE ERROR
// ======================================================
function dbError(message = "Database error") {
  return {
    err: new Error(message),
    result: null,
  };
}

// ======================================================
// RESET MOCK
// ======================================================
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ======================================================
// GET SEMUA TENTOR
// ======================================================
describe("TENTOR - GET ALL", () => {
  test("GET /tentor berhasil mengambil semua data tentor", async () => {
    const data = [
      {
        id: 1,
        nama: "Tentor Test",
        mapel: "Matematika",
        status: "Aktif",
      },
    ];

    mockDbSequence([dbSuccess(data)]);

    const response = await request(app).get(BASE_URL);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(data);
  });

  test("GET /tentor gagal ketika database error", async () => {
    mockDbSequence([dbError()]);

    const response = await request(app).get(BASE_URL);

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mengambil data tentor",
    });
  });
});

// ======================================================
// GET DETAIL TENTOR
// ======================================================
describe("TENTOR - GET DETAIL", () => {
  test("GET /tentor/:id berhasil mengambil detail tentor", async () => {
    const data = [
      {
        id: 1,
        nama: "Tentor Test",
        mapel: "Matematika",
        status: "Aktif",
      },
    ];

    mockDbSequence([dbSuccess(data)]);

    const response = await request(app).get(`${BASE_URL}/1`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(data[0]);
  });

  test("GET /tentor/:id gagal ketika database error", async () => {
    mockDbSequence([dbError()]);

    const response = await request(app).get(`${BASE_URL}/1`);

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mengambil detail tentor",
    });
  });

  test("GET /tentor/:id mengembalikan 404 jika tentor tidak ditemukan", async () => {
    mockDbSequence([dbSuccess([])]);

    const response = await request(app).get(`${BASE_URL}/99999`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Tentor tidak ditemukan",
    });
  });
});

// ======================================================
// POST TENTOR - VALIDATION
// ======================================================
describe("TENTOR - POST VALIDATION", () => {
  test("POST gagal jika nama kosong", async () => {
    const response = await authRequest("post", BASE_URL).send({
      mapel: "Matematika",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Nama, mata pelajaran, email, dan password wajib diisi",
    });
  });

  test("POST gagal jika mapel kosong", async () => {
    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Nama, mata pelajaran, email, dan password wajib diisi",
    });
  });

  test("POST gagal jika email kosong", async () => {
    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      password: "123456",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Nama, mata pelajaran, email, dan password wajib diisi",
    });
  });

  test("POST gagal jika password kosong", async () => {
    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      email: "tentor@test.com",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Nama, mata pelajaran, email, dan password wajib diisi",
    });
  });
});

// ======================================================
// POST TENTOR - EMAIL
// ======================================================
describe("TENTOR - POST EMAIL", () => {
  test("POST gagal ketika pengecekan email database error", async () => {
    mockDbSequence([dbError()]);

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal memeriksa email",
    });
  });

  test("POST gagal jika email sudah digunakan", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 1,
          email: "tentor@test.com",
        },
      ]),
    ]);

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Email sudah digunakan!",
    });
  });
});

// ======================================================
// POST TENTOR - PASSWORD
// ======================================================
describe("TENTOR - POST PASSWORD", () => {
  test("POST gagal ketika bcrypt hash error", async () => {
    mockDbSequence([dbSuccess([])]);

    jest.spyOn(bcrypt, "hash").mockRejectedValueOnce(new Error("Hash error"));

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal memproses password",
    });
  });
});

// ======================================================
// POST TENTOR - INSERT USER
// ======================================================
describe("TENTOR - POST INSERT USER", () => {
  test("POST gagal ketika insert user error", async () => {
    mockDbSequence([dbSuccess([]), dbError()]);

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal membuat akun tentor",
    });
  });
});

// ======================================================
// POST TENTOR - INSERT DATA
// ======================================================
describe("TENTOR - POST INSERT DATA", () => {
  test("POST gagal ketika insert data tentor error", async () => {
    mockDbSequence([
      dbSuccess([]),
      dbSuccess({
        insertId: 1000,
      }),
      dbError(),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal menambahkan data tentor",
    });
  });
});

// ======================================================
// POST TENTOR - SUCCESS
// ======================================================
describe("TENTOR - POST SUCCESS", () => {
  test("POST berhasil menambahkan tentor", async () => {
    mockDbSequence([
      dbSuccess([]),
      dbSuccess({
        insertId: 1000,
      }),
      dbSuccess({
        insertId: 2000,
      }),
    ]);

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Test",
      mapel: "Matematika",
      status: "Aktif",
      no_hp: "08123456789",
      email: "tentor@test.com",
      password: "123456",
    });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      message: "Tentor berhasil ditambahkan dan dapat login",
      id: 2000,
    });

    expect(logAktivitas).toHaveBeenCalled();
  });

  test("POST menggunakan default status dan no_hp null", async () => {
    mockDbSequence([
      dbSuccess([]),
      dbSuccess({
        insertId: 1001,
      }),
      dbSuccess({
        insertId: 2001,
      }),
    ]);

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Default",
      mapel: "Bahasa Indonesia",
      email: "default@test.com",
      password: "123456",
    });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      message: "Tentor berhasil ditambahkan dan dapat login",
      id: 2001,
    });
  });

  test("POST tetap berhasil walaupun log aktivitas error", async () => {
    mockDbSequence([
      dbSuccess([]),
      dbSuccess({
        insertId: 1002,
      }),
      dbSuccess({
        insertId: 2002,
      }),
    ]);

    logAktivitas.mockRejectedValueOnce(new Error("Log error"));

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Log Error",
      mapel: "Fisika",
      email: "logerror@test.com",
      password: "123456",
    });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      message: "Tentor berhasil ditambahkan dan dapat login",
      id: 2002,
    });
  });

  test("POST menjalankan outer catch ketika terjadi error tak terduga", async () => {
    mockDbSequence([dbSuccess([])]);

    jest.spyOn(bcrypt, "hash").mockImplementationOnce(() => {
      throw new Error("Unexpected bcrypt error");
    });

    const response = await authRequest("post", BASE_URL).send({
      nama: "Tentor Outer Catch",
      mapel: "Kimia",
      email: "outercatch@test.com",
      password: "123456",
    });

    expect(response.status).toBe(500);
  });
});

// ======================================================
// PUT TENTOR - VALIDATION
// ======================================================
describe("TENTOR - PUT VALIDATION", () => {
  test("PUT gagal jika nama kosong", async () => {
    const response = await authRequest("put", `${BASE_URL}/1`).send({
      mapel: "Matematika",
      email: "update@test.com",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Nama, mata pelajaran, dan email wajib diisi",
    });
  });

  test("PUT gagal jika mapel kosong", async () => {
    const response = await authRequest("put", `${BASE_URL}/1`).send({
      nama: "Tentor Update",
      email: "update@test.com",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Nama, mata pelajaran, dan email wajib diisi",
    });
  });

  test("PUT gagal jika email kosong", async () => {
    const response = await authRequest("put", `${BASE_URL}/1`).send({
      nama: "Tentor Update",
      mapel: "Matematika",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Nama, mata pelajaran, dan email wajib diisi",
    });
  });
});

// ======================================================
// PUT TENTOR - SELECT
// ======================================================
describe("TENTOR - PUT SELECT", () => {
  test("PUT gagal ketika select tentor error", async () => {
    mockDbSequence([dbError()]);

    const response = await authRequest("put", `${BASE_URL}/1`).send({
      nama: "Tentor Update",
      mapel: "Matematika",
      email: "update@test.com",
    });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mengambil data tentor",
    });
  });

  test("PUT mengembalikan 404 jika tentor tidak ditemukan", async () => {
    mockDbSequence([dbSuccess([])]);

    const response = await authRequest("put", `${BASE_URL}/99999`).send({
      nama: "Tentor Update",
      mapel: "Matematika",
      email: "update@test.com",
    });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Tentor tidak ditemukan",
    });
  });
});

// ======================================================
// PUT TENTOR - UPDATE
// ======================================================
describe("TENTOR - PUT UPDATE", () => {
  test("PUT gagal ketika update database error", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 1,
          nama: "Tentor Lama",
          mapel: "Matematika",
          email: "lama@test.com",
        },
      ]),
      dbError(),
    ]);

    const response = await authRequest("put", `${BASE_URL}/1`).send({
      nama: "Tentor Baru",
      mapel: "Fisika",
      email: "baru@test.com",
    });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mengupdate tentor",
    });
  });

  test("PUT gagal jika affectedRows bernilai 0", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 1,
          nama: "Tentor Lama",
          mapel: "Matematika",
          email: "lama@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 0,
      }),
    ]);

    const response = await authRequest("put", `${BASE_URL}/1`).send({
      nama: "Tentor Baru",
      mapel: "Fisika",
      email: "baru@test.com",
    });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Tentor tidak ditemukan",
    });
  });

  test("PUT berhasil mengupdate tentor", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 1,
          nama: "Tentor Lama",
          mapel: "Matematika",
          email: "lama@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    const response = await authRequest("put", `${BASE_URL}/1`).send({
      nama: "Tentor Baru",
      mapel: "Fisika",
      email: "baru@test.com",
      status: "Aktif",
      no_hp: "08123456789",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor berhasil diupdate",
    });

    expect(logAktivitas).toHaveBeenCalled();
  });

  test("PUT menggunakan default status dan no_hp null", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 2,
          nama: "Tentor Lama",
          mapel: "Matematika",
          email: "lama2@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    const response = await authRequest("put", `${BASE_URL}/2`).send({
      nama: "Tentor Default Update",
      mapel: "Kimia",
      email: "defaultupdate@test.com",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor berhasil diupdate",
    });
  });

  test("PUT tetap berhasil walaupun log aktivitas error", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 3,
          nama: "Tentor Lama",
          mapel: "Matematika",
          email: "lama3@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    logAktivitas.mockRejectedValueOnce(new Error("Log update error"));

    const response = await authRequest("put", `${BASE_URL}/3`).send({
      nama: "Tentor Log Error",
      mapel: "Biologi",
      email: "logupdate@test.com",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor berhasil diupdate",
    });
  });
});

// ======================================================
// DELETE TENTOR - SELECT
// ======================================================
describe("TENTOR - DELETE SELECT", () => {
  test("DELETE gagal ketika select tentor error", async () => {
    mockDbSequence([dbError()]);

    const response = await authRequest("delete", `${BASE_URL}/1`);

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal mencari tentor",
    });
  });

  test("DELETE mengembalikan 404 jika tentor tidak ditemukan", async () => {
    mockDbSequence([dbSuccess([])]);

    const response = await authRequest("delete", `${BASE_URL}/99999`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Tentor tidak ditemukan",
    });
  });
});

// ======================================================
// DELETE TENTOR - DATA
// ======================================================
describe("TENTOR - DELETE DATA", () => {
  test("DELETE gagal ketika delete tentor error", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 1,
          user_id: 10,
          nama: "Tentor Test",
          email: "tentor@test.com",
        },
      ]),
      dbError(),
    ]);

    const response = await authRequest("delete", `${BASE_URL}/1`);

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal menghapus tentor",
    });
  });

  test("DELETE berhasil menghapus tentor dan akun user", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 1,
          user_id: 10,
          nama: "Tentor Test",
          email: "tentor@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    const response = await authRequest("delete", `${BASE_URL}/1`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor dan akun user berhasil dihapus",
    });

    expect(logAktivitas).toHaveBeenCalled();
  });

  test("DELETE gagal menghapus akun user setelah data tentor terhapus", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 2,
          user_id: 20,
          nama: "Tentor User Error",
          email: "usererror@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
      dbError(),
    ]);

    const response = await authRequest("delete", `${BASE_URL}/2`);

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Data tentor terhapus tetapi akun user gagal dihapus",
    });
  });

  test("DELETE berhasil jika tentor tidak memiliki user_id", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 3,
          user_id: null,
          nama: "Tentor Tanpa User",
          email: "tanpauser@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    const response = await authRequest("delete", `${BASE_URL}/3`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor berhasil dihapus",
    });
  });

  test("DELETE tetap berhasil jika log aktivitas error dan memiliki user_id", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 4,
          user_id: 40,
          nama: "Tentor Log Error",
          email: "deletelog@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    logAktivitas.mockRejectedValueOnce(new Error("Delete log error"));

    const response = await authRequest("delete", `${BASE_URL}/4`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor dan akun user berhasil dihapus",
    });
  });

  test("DELETE tetap berhasil jika log aktivitas error tanpa user_id", async () => {
    mockDbSequence([
      dbSuccess([
        {
          id: 5,
          user_id: null,
          nama: "Tentor Tanpa User Log Error",
          email: "deletewithoutuser@test.com",
        },
      ]),
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    logAktivitas.mockRejectedValueOnce(new Error("Delete log error"));

    const response = await authRequest("delete", `${BASE_URL}/5`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor berhasil dihapus",
    });
  });
});

// ======================================================
// BRANCH COVERAGE FALLBACK REQ.USER
// ======================================================
// Menguji:
//
// req.user?.id || null
// req.user?.nama || "Admin"
// req.user?.role || "admin"
//
// Tidak mengubah authMiddleware.js asli.
// ======================================================
describe("TENTOR - BRANCH FALLBACK DATA ADMIN", () => {
  test("POST menggunakan fallback admin ketika req.user kosong", async () => {
    mockDbSequence([
      // SELECT email
      dbSuccess([]),

      // INSERT user
      dbSuccess({
        insertId: 8000,
      }),

      // INSERT tentor
      dbSuccess({
        insertId: 9000,
      }),
    ]);

    const response = await request(app)
      .post(BASE_URL)
      .set("x-test-user-empty", "true")
      .send({
        nama: "Tentor Branch POST",
        mapel: "Matematika",
        status: "Aktif",
        no_hp: "081234567890",
        email: "branchpost@test.com",
        password: "123456",
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      message: "Tentor berhasil ditambahkan dan dapat login",
      id: 9000,
    });

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        nama_user: "Admin",
        role: "admin",
      })
    );
  });

  test("PUT menggunakan fallback admin ketika req.user kosong", async () => {
    mockDbSequence([
      // SELECT tentor
      dbSuccess([
        {
          id: 9100,
          nama: "Tentor Lama",
          mapel: "Matematika",
          status: "Aktif",
          no_hp: "081111111111",
          email: "lama-put@test.com",
        },
      ]),

      // UPDATE tentor
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    const response = await request(app)
      .put(`${BASE_URL}/9100`)
      .set("x-test-user-empty", "true")
      .send({
        nama: "Tentor Branch PUT",
        mapel: "Fisika",
        email: "branchput@test.com",
        status: "Aktif",
        no_hp: "082222222222",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor berhasil diupdate",
    });

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        nama_user: "Admin",
        role: "admin",
      })
    );
  });

  test("DELETE menggunakan fallback admin ketika req.user kosong", async () => {
    mockDbSequence([
      // SELECT tentor
      dbSuccess([
        {
          id: 9200,
          user_id: 9300,
          nama: "Tentor Branch DELETE",
          mapel: "Kimia",
          status: "Aktif",
          no_hp: "083333333333",
          email: "branchdelete@test.com",
        },
      ]),

      // DELETE tentor
      dbSuccess({
        affectedRows: 1,
      }),

      // DELETE user
      dbSuccess({
        affectedRows: 1,
      }),
    ]);

    const response = await request(app)
      .delete(`${BASE_URL}/9200`)
      .set("x-test-user-empty", "true");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Tentor dan akun user berhasil dihapus",
    });

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        nama_user: "Admin",
        role: "admin",
      })
    );
  });
});
