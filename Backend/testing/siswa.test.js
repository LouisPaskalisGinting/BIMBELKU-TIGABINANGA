const request = require("supertest");

// =====================================================
// ENVIRONMENT
// =====================================================

process.env.NODE_ENV = "test";

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
    req.user = {
      id: 999,
      nama: "Admin Test",
      email: "admin@test.com",
      role: "admin",
    };

    next();
  };
});

// =====================================================
// MOCK LOG AKTIVITAS
// =====================================================

jest.mock("../utils/logAktivitas", () => jest.fn());

// =====================================================
// MOCK BCRYPT
// =====================================================

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

// =====================================================
// IMPORT
// =====================================================

const app = require("../server");
const db = require("../db");
const siswaRouter = require("../routes/siswa");
const logAktivitas = require("../utils/logAktivitas");
const bcrypt = require("bcryptjs");

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
// DATA TEST
// =====================================================

const siswa = {
  id: 1,
  siswa_id: 1,
  user_id: 999,
  nama: "Siswa Test",
  email: "siswa@test.com",
  asal_sekolah: "SMA Test",
  no_hp: "081234567890",
  nama_orangtua: "Orangtua Test",
  no_hp_orangtua: "081234567891",
  program_id: 1,
  kelas_id: 1,
  status: "approved",
  nama_program: "Program Test",
  harga: 100000,
  nama_kelas: "Kelas Test",
};

const siswaPending = {
  id: 2,
  user_id: null,
  nama: "Siswa Pending",
  email: "pending@test.com",
  asal_sekolah: "SMA Pending",
  no_hp: "081234567892",
  nama_orangtua: "Orangtua Pending",
  no_hp_orangtua: "081234567893",
  program_id: 1,
  kelas_id: null,
  status: "pending",
  password: "password123",
};

const siswaTanpaUser = {
  id: 3,
  user_id: null,
  nama: "Siswa Tanpa User",
  email: "tanpauser@test.com",
  asal_sekolah: "SMA Test",
  no_hp: "081234567894",
  nama_orangtua: "Orangtua Test",
  no_hp_orangtua: "081234567895",
  program_id: 1,
  kelas_id: null,
  status: "approved",
};

const kelas = {
  nama_siswa: "Siswa Test",
  nama_kelas: "Kelas Test",
};

const kelasTanpaNama = {
  nama_siswa: "Siswa Test",
  nama_kelas: null,
};

// =====================================================
// BEFORE EACH
// =====================================================

beforeEach(() => {
  jest.clearAllMocks();

  db.query.mockReset();

  bcrypt.hash.mockReset();
  bcrypt.hash.mockResolvedValue("HASHED_PASSWORD");

  logAktivitas.mockReset();
  logAktivitas.mockResolvedValue();
});

// =====================================================
// GET /siswa/me
// =====================================================

describe("GET /siswa/me", () => {
  test("berhasil mengambil data siswa", async () => {
    dbSuccess([siswa]);

    const response = await request(app)
      .get("/siswa/me")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(siswa);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .get("/siswa/me")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app)
      .get("/siswa/me")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("melakukan auto fix user_id", async () => {
    const data = {
      ...siswa,
      user_id: 100,
    };

    dbSequence([data], { affectedRows: 1 });

    const response = await request(app)
      .get("/siswa/me")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test("tetap berhasil jika auto fix gagal", async () => {
    const data = {
      ...siswa,
      user_id: 100,
    };

    dbSequence([data], new Error("Auto fix gagal"));

    const response = await request(app)
      .get("/siswa/me")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });

  test("tidak melakukan auto fix jika user_id sesuai", async () => {
    dbSuccess([siswa]);

    const response = await request(app)
      .get("/siswa/me")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});

// =====================================================
// GET /siswa/user/:user_id
// =====================================================

describe("GET /siswa/user/:user_id", () => {
  test.each(["abc", "0", "-1", "1.5"])(
    "400 jika user_id tidak valid: %s",
    async (id) => {
      const response = await request(app).get(`/siswa/user/${id}`);

      expect(response.status).toBe(400);
    }
  );

  test("berhasil", async () => {
    dbSuccess([siswa]);

    const response = await request(app).get("/siswa/user/999");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(siswa);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/siswa/user/999");

    expect(response.status).toBe(404);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/siswa/user/999");

    expect(response.status).toBe(500);
  });
});

// =====================================================
// GET /siswa/dashboard/:user_id
// =====================================================

describe("GET /siswa/dashboard/:user_id", () => {
  test.each(["abc", "0", "-1", "1.5"])(
    "400 jika user_id tidak valid: %s",
    async (id) => {
      const response = await request(app).get(`/siswa/dashboard/${id}`);

      expect(response.status).toBe(400);
    }
  );

  test("berhasil", async () => {
    dbSuccess([siswa]);

    const response = await request(app).get("/siswa/dashboard/999");

    expect(response.status).toBe(200);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/siswa/dashboard/999");

    expect(response.status).toBe(404);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/siswa/dashboard/999");

    expect(response.status).toBe(500);
  });
});

// =====================================================
// GET /siswa
// =====================================================

describe("GET /siswa", () => {
  test("berhasil mengambil semua siswa", async () => {
    dbSuccess([siswa]);

    const response = await request(app).get("/siswa");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([siswa]);
  });

  test("berhasil jika data kosong", async () => {
    dbSuccess([]);

    const response = await request(app).get("/siswa");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/siswa");

    expect(response.status).toBe(500);
  });
});

// =====================================================
// GET /siswa/pending
// =====================================================

describe("GET /siswa/pending", () => {
  test("berhasil", async () => {
    dbSuccess([siswaPending]);

    const response = await request(app).get("/siswa/pending");

    expect(response.status).toBe(200);
  });

  test("berhasil jika kosong", async () => {
    dbSuccess([]);

    const response = await request(app).get("/siswa/pending");

    expect(response.status).toBe(200);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/siswa/pending");

    expect(response.status).toBe(500);
  });
});

// =====================================================
// GET /siswa/search/:nama
// =====================================================

describe("GET /siswa/search/:nama", () => {
  test("berhasil mencari siswa", async () => {
    dbSuccess([siswa]);

    const response = await request(app).get("/siswa/search/Siswa");

    expect(response.status).toBe(200);
  });

  test("berhasil jika kosong", async () => {
    dbSuccess([]);

    const response = await request(app).get("/siswa/search/TidakAda");

    expect(response.status).toBe(200);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/siswa/search/Siswa");

    expect(response.status).toBe(500);
  });
});

// =====================================================
// GET /siswa/kelas/:kelas_id
// =====================================================

describe("GET /siswa/kelas/:kelas_id", () => {
  test.each(["abc", "0", "-1", "1.5"])(
    "400 jika kelas_id tidak valid: %s",
    async (id) => {
      const response = await request(app).get(`/siswa/kelas/${id}`);

      expect(response.status).toBe(400);
    }
  );

  test("berhasil", async () => {
    dbSuccess([siswa]);

    const response = await request(app).get("/siswa/kelas/1");

    expect(response.status).toBe(200);
  });

  test("berhasil jika kosong", async () => {
    dbSuccess([]);

    const response = await request(app).get("/siswa/kelas/1");

    expect(response.status).toBe(200);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/siswa/kelas/1");

    expect(response.status).toBe(500);
  });
});

// =====================================================
// GET /siswa/:id
// =====================================================

describe("GET /siswa/:id", () => {
  test.each(["abc", "0", "-1", "1.5"])(
    "400 jika id tidak valid: %s",
    async (id) => {
      const response = await request(app).get(`/siswa/${id}`);

      expect(response.status).toBe(400);
    }
  );

  test("berhasil", async () => {
    dbSuccess([siswa]);

    const response = await request(app).get("/siswa/1");

    expect(response.status).toBe(200);
  });

  test("404 jika tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/siswa/999");

    expect(response.status).toBe(404);
  });

  test("500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/siswa/1");

    expect(response.status).toBe(500);
  });
});

// =====================================================
// PUT /siswa/approve/:id
// =====================================================

describe("PUT /siswa/approve/:id", () => {
  test.each(["abc", "0"])("400 jika id tidak valid: %s", async (id) => {
    const response = await request(app)
      .put(`/siswa/approve/${id}`)
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(400);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .put("/siswa/approve/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
  });

  test("500 jika query siswa gagal", async () => {
    dbError();

    const response = await request(app)
      .put("/siswa/approve/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("500 jika query user gagal", async () => {
    dbSequence([siswaPending], new Error("User gagal"));

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("berhasil jika user sudah ada", async () => {
    dbSequence([siswaPending], [{ id: 999 }], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.user_id).toBe(999);
  });

  test("500 jika update siswa gagal", async () => {
    dbSequence([siswaPending], [{ id: 999 }], new Error("Update gagal"));

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("400 jika password tidak tersedia", async () => {
    dbSequence([{ ...siswaPending, password: null }], []);

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(400);
  });

  test("berhasil membuat user baru", async () => {
    dbSequence([siswaPending], [], { insertId: 1000 }, { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.user_id).toBe(1000);
    expect(bcrypt.hash).toHaveBeenCalled();
  });

  test("500 jika insert user gagal", async () => {
    dbSequence([siswaPending], [], new Error("Insert user gagal"));

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("500 jika update siswa setelah insert user gagal", async () => {
    dbSequence(
      [siswaPending],
      [],
      { insertId: 1000 },
      new Error("Update siswa gagal")
    );

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("500 jika bcrypt gagal", async () => {
    bcrypt.hash.mockRejectedValue(new Error("Bcrypt gagal"));

    dbSequence([siswaPending], []);

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("tetap berhasil jika log gagal", async () => {
    dbSequence([siswaPending], [{ id: 999 }], { affectedRows: 1 });

    logAktivitas.mockRejectedValue(new Error("Log gagal"));

    const response = await request(app)
      .put("/siswa/approve/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });
});

// =====================================================
// PUT /siswa/masuk-kelas/:siswa_id/:kelas_id
// =====================================================

describe("PUT /siswa/masuk-kelas/:siswa_id/:kelas_id", () => {
  test("400 jika siswa_id tidak valid", async () => {
    const response = await request(app)
      .put("/siswa/masuk-kelas/abc/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(400);
  });

  test("400 jika kelas_id tidak valid", async () => {
    const response = await request(app)
      .put("/siswa/masuk-kelas/1/abc")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(400);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .put("/siswa/masuk-kelas/999/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
  });

  test("berhasil memasukkan siswa", async () => {
    dbSequence([kelas], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/masuk-kelas/1/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });

  test("berhasil jika nama kelas null", async () => {
    dbSequence([kelasTanpaNama], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/masuk-kelas/1/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });

  test("404 jika update tidak mengubah baris", async () => {
    dbSequence([kelas], { affectedRows: 0 });

    const response = await request(app)
      .put("/siswa/masuk-kelas/1/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
  });

  test("500 jika query awal gagal", async () => {
    dbError();

    const response = await request(app)
      .put("/siswa/masuk-kelas/1/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("500 jika update gagal", async () => {
    dbSequence([kelas], new Error("Update gagal"));

    const response = await request(app)
      .put("/siswa/masuk-kelas/1/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("tetap berhasil jika log gagal", async () => {
    dbSequence([kelas], { affectedRows: 1 });

    logAktivitas.mockRejectedValue(new Error("Log gagal"));

    const response = await request(app)
      .put("/siswa/masuk-kelas/1/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });
});

// =====================================================
// PUT /siswa/keluar-kelas/:siswa_id
// =====================================================

describe("PUT /siswa/keluar-kelas/:siswa_id", () => {
  test.each(["abc", "0"])("400 jika siswa_id tidak valid: %s", async (id) => {
    const response = await request(app)
      .put(`/siswa/keluar-kelas/${id}`)
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(400);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .put("/siswa/keluar-kelas/999")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
  });

  test("berhasil", async () => {
    dbSequence([kelas], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/keluar-kelas/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });

  test("berhasil jika nama kelas null", async () => {
    dbSequence([kelasTanpaNama], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/keluar-kelas/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });

  test("404 jika update tidak mengubah baris", async () => {
    dbSequence([kelas], { affectedRows: 0 });

    const response = await request(app)
      .put("/siswa/keluar-kelas/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
  });

  test("500 jika query gagal", async () => {
    dbError();

    const response = await request(app)
      .put("/siswa/keluar-kelas/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("500 jika update gagal", async () => {
    dbSequence([kelas], new Error("Update gagal"));

    const response = await request(app)
      .put("/siswa/keluar-kelas/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("tetap berhasil jika log gagal", async () => {
    dbSequence([kelas], { affectedRows: 1 });

    logAktivitas.mockRejectedValue(new Error("Log gagal"));

    const response = await request(app)
      .put("/siswa/keluar-kelas/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });
});

// =====================================================
// POST /siswa
// =====================================================

describe("POST /siswa", () => {
  const data = {
    nama: "Siswa Baru",
    email: "baru@test.com",
    password: "password123",
    asal_sekolah: "SMA Test",
    no_hp: "081234567890",
    nama_orangtua: "Orangtua",
    no_hp_orangtua: "081234567891",
    program_id: 1,
  };

  test("berhasil menambahkan siswa", async () => {
    dbSuccess({ insertId: 10 });

    const response = await request(app)
      .post("/siswa")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(10);
  });

  test("berhasil jika nama kosong", async () => {
    dbSuccess({ insertId: 11 });

    const response = await request(app)
      .post("/siswa")
      .set("Authorization", "Bearer token")
      .send({
        ...data,
        nama: undefined,
      });

    expect(response.status).toBe(201);
  });

  test("500 jika insert gagal", async () => {
    dbError();

    const response = await request(app)
      .post("/siswa")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(500);
  });

  test("tetap berhasil jika log gagal", async () => {
    dbSuccess({ insertId: 12 });

    logAktivitas.mockRejectedValue(new Error("Log gagal"));

    const response = await request(app)
      .post("/siswa")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(201);
  });
});

// =====================================================
// PUT /siswa/:id
// =====================================================

describe("PUT /siswa/:id", () => {
  const data = {
    nama: "Siswa Update",
    email: "update@test.com",
    asal_sekolah: "SMA Update",
    no_hp: "081234567899",
    nama_orangtua: "Orangtua Update",
    no_hp_orangtua: "081234567898",
    program_id: 2,
    kelas_id: 2,
  };

  test.each(["abc", "0"])("400 jika id tidak valid: %s", async (id) => {
    const response = await request(app)
      .put(`/siswa/${id}`)
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(400);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .put("/siswa/999")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(404);
  });

  test("500 jika query lama gagal", async () => {
    dbError();

    const response = await request(app)
      .put("/siswa/1")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(500);
  });

  test("berhasil tanpa user", async () => {
    dbSequence([siswaTanpaUser], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/3")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(200);
  });

  test("berhasil dengan sinkronisasi user", async () => {
    dbSequence([siswa], { affectedRows: 1 }, { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/1")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(200);
    expect(db.query).toHaveBeenCalledTimes(3);
  });

  test("tetap berhasil jika sinkronisasi user gagal", async () => {
    dbSequence([siswa], { affectedRows: 1 }, new Error("User gagal"));

    const response = await request(app)
      .put("/siswa/1")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(200);
  });

  test("500 jika update siswa gagal", async () => {
    dbSequence([siswaTanpaUser], new Error("Update gagal"));

    const response = await request(app)
      .put("/siswa/3")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(500);
  });

  test("tetap berhasil jika log gagal", async () => {
    dbSequence([siswaTanpaUser], { affectedRows: 1 });

    logAktivitas.mockRejectedValue(new Error("Log gagal"));

    const response = await request(app)
      .put("/siswa/3")
      .set("Authorization", "Bearer token")
      .send(data);

    expect(response.status).toBe(200);
  });

  test("menggunakan nama lama jika nama kosong", async () => {
    dbSequence([siswaTanpaUser], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/3")
      .set("Authorization", "Bearer token")
      .send({
        ...data,
        nama: undefined,
      });

    expect(response.status).toBe(200);
  });

  test("menggunakan null untuk program dan kelas", async () => {
    dbSequence([siswaTanpaUser], { affectedRows: 1 });

    const response = await request(app)
      .put("/siswa/3")
      .set("Authorization", "Bearer token")
      .send({
        ...data,
        program_id: null,
        kelas_id: null,
      });

    expect(response.status).toBe(200);

    const updateCall = db.query.mock.calls[1];

    expect(updateCall[1]).toContain(null);
  });
});

// =====================================================
// DELETE /siswa/:id
// =====================================================

describe("DELETE /siswa/:id", () => {
  test.each(["abc", "0"])("400 jika id tidak valid: %s", async (id) => {
    const response = await request(app)
      .delete(`/siswa/${id}`)
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(400);
  });

  test("404 jika siswa tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .delete("/siswa/999")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
  });

  test("500 jika query gagal", async () => {
    dbError();

    const response = await request(app)
      .delete("/siswa/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("berhasil menolak siswa pending", async () => {
    dbSequence([{ ...siswaPending, user_id: null }], { affectedRows: 1 });

    const response = await request(app)
      .delete("/siswa/2")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Pendaftaran siswa berhasil ditolak");
  });

  test("berhasil menghapus siswa tanpa user", async () => {
    dbSequence([{ ...siswaTanpaUser, user_id: null }], { affectedRows: 1 });

    const response = await request(app)
      .delete("/siswa/3")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Siswa berhasil dihapus");
  });

  test("berhasil menghapus siswa dan user", async () => {
    dbSequence([siswa], { affectedRows: 1 }, { affectedRows: 1 });

    const response = await request(app)
      .delete("/siswa/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Siswa dan akun user berhasil dihapus");
  });

  test("500 jika delete siswa gagal", async () => {
    dbSequence([siswa], new Error("Delete gagal"));

    const response = await request(app)
      .delete("/siswa/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("500 jika delete user gagal", async () => {
    dbSequence([siswa], { affectedRows: 1 }, new Error("Delete user gagal"));

    const response = await request(app)
      .delete("/siswa/1")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
  });

  test("tetap berhasil jika log gagal", async () => {
    dbSequence([{ ...siswaTanpaUser, user_id: null }], { affectedRows: 1 });

    logAktivitas.mockRejectedValue(new Error("Log gagal"));

    const response = await request(app)
      .delete("/siswa/3")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
  });
});

// =====================================================
// HELPER simpanLog
// =====================================================

describe("simpanLog", () => {
  test("berhasil menyimpan log", async () => {
    await siswaRouter.simpanLog({
      req: {
        user: {
          id: 999,
          nama: "Admin Test",
          role: "admin",
        },
      },
      aktivitas: "Test Aktivitas",
      keterangan: "Test Keterangan",
    });

    expect(logAktivitas).toHaveBeenCalled();
  });

  test("tidak menyimpan log jika req tidak ada", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await siswaRouter.simpanLog({
      req: null,
      aktivitas: "Test",
      keterangan: "Test",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "USER TIDAK DITEMUKAN UNTUK LOG AKTIVITAS"
    );

    expect(logAktivitas).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("tidak menyimpan log jika req.user tidak ada", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await siswaRouter.simpanLog({
      req: {},
      aktivitas: "Test",
      keterangan: "Test",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "USER TIDAK DITEMUKAN UNTUK LOG AKTIVITAS"
    );

    expect(logAktivitas).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("tetap berjalan jika logAktivitas error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    logAktivitas.mockRejectedValue(new Error("Log error"));

    await siswaRouter.simpanLog({
      req: {
        user: {
          id: 999,
          nama: "Admin Test",
          role: "admin",
        },
      },
      aktivitas: "Test",
      keterangan: "Test",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "GAGAL MENYIMPAN LOG SISWA:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
