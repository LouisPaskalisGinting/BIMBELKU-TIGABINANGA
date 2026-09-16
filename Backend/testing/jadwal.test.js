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
      id: 1,
      nama: "Admin Test",
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
// IMPORT
// =====================================================

const request = require("supertest");
const app = require("../server");
const db = require("../db");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// HELPER DATABASE
// =====================================================

function dbSuccess(result) {
  db.query.mockImplementationOnce((...args) => {
    const callback = args[args.length - 1];

    callback(null, result);
  });
}

function dbError(error = new Error("Database Error")) {
  db.query.mockImplementationOnce((...args) => {
    const callback = args[args.length - 1];

    callback(error);
  });
}

// =====================================================
// DATA TEST
// =====================================================

const validData = {
  kelas_id: 10,
  mata_pelajaran: "Matematika",
  tentor: "Tentor Test",
  hari: "Senin",
  jam: "10:00",
  tentor_id: 20,
};

// =====================================================
// RESET
// =====================================================

beforeEach(() => {
  jest.clearAllMocks();

  logAktivitas.mockResolvedValue(true);
});

// =====================================================
// GET /jadwal/hari-ini
// =====================================================

describe("GET /jadwal/hari-ini", () => {
  test("berhasil mengambil jadwal hari ini", async () => {
    dbSuccess([
      {
        id: 1,
        hari: "Senin",
        jam: "10:00",
        kelas: "Kelas A",
      },
    ]);

    const response = await request(app).get("/jadwal/hari-ini").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
  });

  test("gagal mengambil jadwal hari ini ketika database error", async () => {
    dbError(new Error("Database Hari Ini Error"));

    const response = await request(app).get("/jadwal/hari-ini").expect(500);

    expect(response.body.message).toBe("Gagal mengambil jadwal hari ini");
  });
});

// =====================================================
// GET /jadwal
// =====================================================

describe("GET /jadwal", () => {
  test("berhasil mengambil semua jadwal", async () => {
    dbSuccess([
      {
        id: 2,
        kelas: "Kelas A",
        mata_pelajaran: "Matematika",
      },
      {
        id: 1,
        kelas: "Kelas B",
        mata_pelajaran: "Fisika",
      },
    ]);

    const response = await request(app).get("/jadwal").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
  });

  test("gagal mengambil semua jadwal ketika database error", async () => {
    dbError(new Error("Database Jadwal Error"));

    const response = await request(app).get("/jadwal").expect(500);

    expect(response.body.message).toBe("Gagal mengambil data jadwal");
  });
});

// =====================================================
// GET /jadwal/siswa/:id
// =====================================================

describe("GET /jadwal/siswa/:id", () => {
  test("berhasil mengambil jadwal berdasarkan siswa", async () => {
    dbSuccess([
      {
        id: 1,
        kelas_id: 10,
        kelas: "Kelas A",
        mata_pelajaran: "Matematika",
      },
    ]);

    const response = await request(app).get("/jadwal/siswa/1").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
  });

  test("berhasil dengan hasil kosong jika siswa tidak memiliki jadwal", async () => {
    dbSuccess([]);

    const response = await request(app).get("/jadwal/siswa/999").expect(200);

    expect(response.body).toEqual([]);
  });

  test("gagal ketika database siswa error", async () => {
    dbError(new Error("Database Siswa Error"));

    const response = await request(app).get("/jadwal/siswa/1").expect(500);

    expect(response.body.message).toBe("Gagal mengambil jadwal siswa");
  });
});

// =====================================================
// GET /jadwal/tentor/:id
// =====================================================

describe("GET /jadwal/tentor/:id", () => {
  test("gagal ketika database user tentor error", async () => {
    dbError(new Error("Database User Tentor Error"));

    const response = await request(app).get("/jadwal/tentor/20").expect(500);

    expect(response.body.message).toBe("Gagal mengambil data tentor");
  });

  test("mengembalikan array kosong jika user tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/jadwal/tentor/999").expect(200);

    expect(response.body).toEqual([]);
  });

  test("berhasil mengambil jadwal berdasarkan tentor", async () => {
    dbSuccess([
      {
        nama: "Tentor Test",
      },
    ]);

    dbSuccess([
      {
        id: 1,
        kelas: "Kelas A",
        mata_pelajaran: "Matematika",
        tentor: "Tentor Test",
      },
    ]);

    const response = await request(app).get("/jadwal/tentor/20").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
  });

  test("gagal ketika database jadwal tentor error", async () => {
    dbSuccess([
      {
        nama: "Tentor Test",
      },
    ]);

    dbError(new Error("Database Jadwal Tentor Error"));

    const response = await request(app).get("/jadwal/tentor/20").expect(500);

    expect(response.body.message).toBe("Gagal mengambil jadwal tentor");
  });
});

// =====================================================
// POST /jadwal
// =====================================================

describe("POST /jadwal", () => {
  test("gagal jika kelas_id kosong", async () => {
    const response = await request(app)
      .post("/jadwal")
      .send({
        mata_pelajaran: "Matematika",
        tentor: "Tentor Test",
        hari: "Senin",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika mata_pelajaran kosong", async () => {
    const response = await request(app)
      .post("/jadwal")
      .send({
        kelas_id: 10,
        tentor: "Tentor Test",
        hari: "Senin",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika tentor kosong", async () => {
    const response = await request(app)
      .post("/jadwal")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Matematika",
        hari: "Senin",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika hari kosong", async () => {
    const response = await request(app)
      .post("/jadwal")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Matematika",
        tentor: "Tentor Test",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika jam kosong", async () => {
    const response = await request(app)
      .post("/jadwal")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Matematika",
        tentor: "Tentor Test",
        hari: "Senin",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal ketika database cek kelas error", async () => {
    dbError(new Error("Database Cek Kelas Error"));

    const response = await request(app)
      .post("/jadwal")
      .send(validData)
      .expect(500);

    expect(response.body.message).toBe("Gagal memeriksa kelas");
  });

  test("gagal jika kelas tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .post("/jadwal")
      .send(validData)
      .expect(404);

    expect(response.body.message).toBe("Kelas tidak ditemukan");
  });

  test("gagal ketika insert jadwal error", async () => {
    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbError(new Error("Insert Jadwal Error"));

    const response = await request(app)
      .post("/jadwal")
      .send(validData)
      .expect(500);

    expect(response.body.message).toBe("Gagal menambahkan jadwal");
  });

  test("berhasil menambahkan jadwal dengan tentor_id", async () => {
    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbSuccess({
      insertId: 100,
    });

    const response = await request(app)
      .post("/jadwal")
      .send(validData)
      .expect(201);

    expect(response.body.message).toBe("Jadwal berhasil ditambah");

    expect(response.body.id).toBe(100);

    expect(logAktivitas).toHaveBeenCalledTimes(1);
  });

  test("berhasil menambahkan jadwal tanpa tentor_id", async () => {
    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbSuccess({
      insertId: 101,
    });

    const response = await request(app)
      .post("/jadwal")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Fisika",
        tentor: "Tentor Test",
        hari: "Selasa",
        jam: "11:00",
      })
      .expect(201);

    expect(response.body.message).toBe("Jadwal berhasil ditambah");

    expect(response.body.id).toBe(101);
  });

  test("tetap berhasil jika log aktivitas tambah gagal", async () => {
    logAktivitas.mockRejectedValueOnce(new Error("Log Tambah Error"));

    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbSuccess({
      insertId: 102,
    });

    const response = await request(app)
      .post("/jadwal")
      .send(validData)
      .expect(201);

    expect(response.body.message).toBe("Jadwal berhasil ditambah");
  });
});

// =====================================================
// PUT /jadwal/:id
// =====================================================

describe("PUT /jadwal/:id", () => {
  test("gagal jika kelas_id kosong", async () => {
    const response = await request(app)
      .put("/jadwal/1")
      .send({
        mata_pelajaran: "Matematika",
        tentor: "Tentor Test",
        hari: "Senin",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika mata_pelajaran kosong", async () => {
    const response = await request(app)
      .put("/jadwal/1")
      .send({
        kelas_id: 10,
        tentor: "Tentor Test",
        hari: "Senin",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika tentor kosong", async () => {
    const response = await request(app)
      .put("/jadwal/1")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Matematika",
        hari: "Senin",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika hari kosong", async () => {
    const response = await request(app)
      .put("/jadwal/1")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Matematika",
        tentor: "Tentor Test",
        jam: "10:00",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal jika jam kosong", async () => {
    const response = await request(app)
      .put("/jadwal/1")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Matematika",
        tentor: "Tentor Test",
        hari: "Senin",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Kelas, mata pelajaran, tentor, hari, dan jam wajib diisi"
    );
  });

  test("gagal ketika database cek kelas error", async () => {
    dbError(new Error("Database Cek Kelas Error"));

    const response = await request(app)
      .put("/jadwal/1")
      .send(validData)
      .expect(500);

    expect(response.body.message).toBe("Gagal memeriksa kelas");
  });

  test("gagal jika kelas tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app)
      .put("/jadwal/1")
      .send(validData)
      .expect(404);

    expect(response.body.message).toBe("Kelas tidak ditemukan");
  });

  test("gagal ketika update jadwal error", async () => {
    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbError(new Error("Update Jadwal Error"));

    const response = await request(app)
      .put("/jadwal/1")
      .send(validData)
      .expect(500);

    expect(response.body.message).toBe("Gagal mengupdate jadwal");
  });

  test("gagal jika jadwal tidak ditemukan saat update", async () => {
    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbSuccess({
      affectedRows: 0,
    });

    const response = await request(app)
      .put("/jadwal/999")
      .send(validData)
      .expect(404);

    expect(response.body.message).toBe("Jadwal tidak ditemukan");
  });

  test("berhasil mengupdate jadwal dengan tentor_id", async () => {
    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app)
      .put("/jadwal/1")
      .send(validData)
      .expect(200);

    expect(response.body.message).toBe("Jadwal berhasil diupdate");

    expect(logAktivitas).toHaveBeenCalledTimes(1);
  });

  test("berhasil mengupdate jadwal tanpa tentor_id", async () => {
    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app)
      .put("/jadwal/2")
      .send({
        kelas_id: 10,
        mata_pelajaran: "Fisika",
        tentor: "Tentor Test",
        hari: "Selasa",
        jam: "11:00",
      })
      .expect(200);

    expect(response.body.message).toBe("Jadwal berhasil diupdate");
  });

  test("tetap berhasil jika log aktivitas update gagal", async () => {
    logAktivitas.mockRejectedValueOnce(new Error("Log Update Error"));

    dbSuccess([
      {
        nama_kelas: "Kelas A",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app)
      .put("/jadwal/3")
      .send(validData)
      .expect(200);

    expect(response.body.message).toBe("Jadwal berhasil diupdate");
  });
});

// =====================================================
// DELETE /jadwal/:id
// =====================================================

describe("DELETE /jadwal/:id", () => {
  test("gagal ketika database pencarian jadwal error", async () => {
    dbError(new Error("Delete Search Error"));

    const response = await request(app).delete("/jadwal/1").expect(500);

    expect(response.body.message).toBe("Gagal mencari jadwal");
  });

  test("gagal jika jadwal tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).delete("/jadwal/999").expect(404);

    expect(response.body.message).toBe("Jadwal tidak ditemukan");
  });

  test("gagal ketika proses delete database error", async () => {
    dbSuccess([
      {
        id: 1,
        mata_pelajaran: "Matematika",
        nama_kelas: "Kelas A",
        kelas: "Kelas A",
        tentor: "Tentor Test",
        hari: "Senin",
        jam: "10:00",
      },
    ]);

    dbError(new Error("Delete Jadwal Error"));

    const response = await request(app).delete("/jadwal/1").expect(500);

    expect(response.body.message).toBe("Gagal menghapus jadwal");
  });

  test("gagal jika affectedRows adalah 0", async () => {
    dbSuccess([
      {
        id: 1,
        mata_pelajaran: "Matematika",
        nama_kelas: "Kelas A",
        kelas: "Kelas A",
        tentor: "Tentor Test",
        hari: "Senin",
        jam: "10:00",
      },
    ]);

    dbSuccess({
      affectedRows: 0,
    });

    const response = await request(app).delete("/jadwal/1").expect(404);

    expect(response.body.message).toBe("Jadwal tidak ditemukan");
  });

  test("berhasil menghapus jadwal dengan nama_kelas", async () => {
    dbSuccess([
      {
        id: 1,
        mata_pelajaran: "Matematika",
        nama_kelas: "Kelas A",
        kelas: "Kelas Lama",
        tentor: "Tentor Test",
        hari: "Senin",
        jam: "10:00",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).delete("/jadwal/1").expect(200);

    expect(response.body.message).toBe("Jadwal dihapus");

    expect(logAktivitas).toHaveBeenCalledTimes(1);
  });

  test("berhasil menghapus jadwal menggunakan fallback kelas", async () => {
    dbSuccess([
      {
        id: 2,
        mata_pelajaran: "Fisika",
        nama_kelas: null,
        kelas: "Kelas B",
        tentor: "Tentor Test",
        hari: "Selasa",
        jam: "11:00",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).delete("/jadwal/2").expect(200);

    expect(response.body.message).toBe("Jadwal dihapus");
  });

  test("tetap berhasil jika log aktivitas delete gagal", async () => {
    logAktivitas.mockRejectedValueOnce(new Error("Log Delete Error"));

    dbSuccess([
      {
        id: 3,
        mata_pelajaran: "Kimia",
        nama_kelas: "Kelas C",
        kelas: "Kelas C",
        tentor: "Tentor Test",
        hari: "Rabu",
        jam: "12:00",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).delete("/jadwal/3").expect(200);

    expect(response.body.message).toBe("Jadwal dihapus");
  });
});
