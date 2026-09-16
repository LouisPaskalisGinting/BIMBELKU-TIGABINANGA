// =====================================================
// WHITE-BOX TESTING EVENT
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
      id: 1,
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
// IMPORT
// =====================================================

const request = require("supertest");
const app = require("../server");
const db = require("../db");
const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// HELPER DATABASE
// =====================================================

function dbSuccess(data) {
  db.query.mockImplementationOnce((...args) => {
    const callback = args[args.length - 1];

    callback(null, data);
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
  judul: "Event Test",
  deskripsi: "Deskripsi event test",
  tanggal: "2030-12-20",
  waktu: "10:00:00",
  lokasi: "Gedung Bimbelku",
};

// =====================================================
// SETUP
// =====================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// =====================================================
// GET SEMUA EVENT
// =====================================================

describe("GET /event", () => {
  test("berhasil mengambil seluruh data event", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Test",
        deskripsi: "Deskripsi",
        tanggal: "2030-12-20",
        waktu: "10:00:00",
        lokasi: "Gedung Bimbelku",
      },
    ]);

    const response = await request(app).get("/event");

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(response.body).toHaveLength(1);
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/event");

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      success: false,
      message: "Gagal mengambil data event",
    });
  });
});

// =====================================================
// GET EVENT BERDASARKAN ID
// =====================================================

describe("GET /event/:id", () => {
  test("berhasil mengambil detail event", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Test",
        deskripsi: "Deskripsi",
        tanggal: "2030-12-20",
        waktu: "10:00:00",
        lokasi: "Gedung Bimbelku",
      },
    ]);

    const response = await request(app).get("/event/1");

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("id", 1);

    expect(response.body).toHaveProperty("judul", "Event Test");
  });

  test("mengembalikan 404 jika event tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/event/999");

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Event tidak ditemukan",
    });
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/event/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty("success", false);

    expect(response.body).toHaveProperty(
      "message",
      "Terjadi kesalahan pada server"
    );

    expect(response.body).toHaveProperty("error", "Database Error");
  });
});

// =====================================================
// POST EVENT - VALIDASI
// =====================================================

describe("POST /event - Validasi", () => {
  test("menolak jika seluruh data kosong", async () => {
    const response = await request(app).post("/event").send({});

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Judul, tanggal, waktu, dan lokasi wajib diisi",
    });
  });

  test.each([
    [
      "judul",
      {
        tanggal: validData.tanggal,
        waktu: validData.waktu,
        lokasi: validData.lokasi,
      },
    ],
    [
      "tanggal",
      {
        judul: validData.judul,
        waktu: validData.waktu,
        lokasi: validData.lokasi,
      },
    ],
    [
      "waktu",
      {
        judul: validData.judul,
        tanggal: validData.tanggal,
        lokasi: validData.lokasi,
      },
    ],
    [
      "lokasi",
      {
        judul: validData.judul,
        tanggal: validData.tanggal,
        waktu: validData.waktu,
      },
    ],
  ])("menolak jika %s tidak diisi", async (_, body) => {
    const response = await request(app).post("/event").send(body);

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty("success", false);

    expect(response.body).toHaveProperty(
      "message",
      "Judul, tanggal, waktu, dan lokasi wajib diisi"
    );
  });
});

// =====================================================
// POST EVENT
// =====================================================

describe("POST /event", () => {
  test("mengembalikan 500 jika database error saat insert", async () => {
    dbError();

    const response = await request(app).post("/event").send(validData);

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      success: false,
      message: "Gagal menambahkan event",
    });
  });

  test("berhasil menambahkan event dengan deskripsi", async () => {
    dbSuccess({
      insertId: 100,
      affectedRows: 1,
    });

    const response = await request(app).post("/event").send(validData);

    expect(response.statusCode).toBe(201);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil ditambahkan",
      id: 100,
    });

    expect(logAktivitas).toHaveBeenCalledTimes(1);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        aktivitas: "Menambahkan event",
        keterangan: `Menambahkan event "${validData.judul}"`,
      })
    );
  });

  test("berhasil menambahkan event tanpa deskripsi", async () => {
    dbSuccess({
      insertId: 101,
      affectedRows: 1,
    });

    const body = {
      judul: "Event Tanpa Deskripsi",
      tanggal: validData.tanggal,
      waktu: validData.waktu,
      lokasi: validData.lokasi,
    };

    const response = await request(app).post("/event").send(body);

    expect(response.statusCode).toBe(201);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil ditambahkan",
      id: 101,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.any(String),
      [body.judul, null, body.tanggal, body.waktu, body.lokasi],
      expect.any(Function)
    );
  });

  test("tetap berhasil jika log aktivitas gagal", async () => {
    logAktivitas.mockRejectedValueOnce(new Error("Log Error"));

    dbSuccess({
      insertId: 102,
      affectedRows: 1,
    });

    const response = await request(app).post("/event").send(validData);

    expect(response.statusCode).toBe(201);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil ditambahkan",
      id: 102,
    });
  });
});

// =====================================================
// PUT EVENT - VALIDASI
// =====================================================

describe("PUT /event/:id - Validasi", () => {
  test("menolak jika seluruh data kosong", async () => {
    const response = await request(app).put("/event/1").send({});

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Judul, tanggal, waktu, dan lokasi wajib diisi",
    });
  });

  test.each([
    [
      "judul",
      {
        tanggal: validData.tanggal,
        waktu: validData.waktu,
        lokasi: validData.lokasi,
      },
    ],
    [
      "tanggal",
      {
        judul: validData.judul,
        waktu: validData.waktu,
        lokasi: validData.lokasi,
      },
    ],
    [
      "waktu",
      {
        judul: validData.judul,
        tanggal: validData.tanggal,
        lokasi: validData.lokasi,
      },
    ],
    [
      "lokasi",
      {
        judul: validData.judul,
        tanggal: validData.tanggal,
        waktu: validData.waktu,
      },
    ],
  ])("menolak jika %s tidak diisi", async (_, body) => {
    const response = await request(app).put("/event/1").send(body);

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty("success", false);

    expect(response.body).toHaveProperty(
      "message",
      "Judul, tanggal, waktu, dan lokasi wajib diisi"
    );
  });
});

// =====================================================
// PUT EVENT
// =====================================================

describe("PUT /event/:id", () => {
  test("mengembalikan 500 jika gagal memeriksa event", async () => {
    dbError();

    const response = await request(app).put("/event/1").send(validData);

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      success: false,
      message: "Gagal memeriksa event",
    });
  });

  test("mengembalikan 404 jika event tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).put("/event/999").send(validData);

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Event tidak ditemukan",
    });
  });

  test("mengembalikan 500 jika update event gagal", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Lama",
        deskripsi: "Deskripsi lama",
      },
    ]);

    dbError();

    const response = await request(app).put("/event/1").send(validData);

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      success: false,
      message: "Gagal memperbarui event",
    });
  });

  test("mengembalikan 404 jika affectedRows bernilai 0", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Lama",
      },
    ]);

    dbSuccess({
      affectedRows: 0,
    });

    const response = await request(app).put("/event/1").send(validData);

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Event tidak ditemukan",
    });
  });

  test("berhasil memperbarui event dengan deskripsi", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Lama",
        deskripsi: "Deskripsi lama",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).put("/event/1").send(validData);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil diperbarui",
    });

    expect(logAktivitas).toHaveBeenCalledTimes(1);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        aktivitas: "Mengubah event",
        keterangan: `Mengubah event "Event Lama" menjadi "${validData.judul}"`,
      })
    );
  });

  test("berhasil memperbarui event tanpa deskripsi", async () => {
    dbSuccess([
      {
        id: 2,
        judul: "Event Lama",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const body = {
      judul: "Event Update Tanpa Deskripsi",
      tanggal: validData.tanggal,
      waktu: validData.waktu,
      lokasi: validData.lokasi,
    };

    const response = await request(app).put("/event/2").send(body);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil diperbarui",
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.any(String),
      [body.judul, null, body.tanggal, body.waktu, body.lokasi, "2"],
      expect.any(Function)
    );
  });

  test("tetap berhasil jika log update gagal", async () => {
    logAktivitas.mockRejectedValueOnce(new Error("Log Update Error"));

    dbSuccess([
      {
        id: 3,
        judul: "Event Sebelumnya",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).put("/event/3").send(validData);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil diperbarui",
    });
  });
});

describe("DELETE /event/:id", () => {
  test("mengembalikan 500 jika gagal memeriksa event", async () => {
    dbError();

    const response = await request(app).delete("/event/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      success: false,
      message: "Gagal memeriksa event",
    });
  });

  test("mengembalikan 404 jika event tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).delete("/event/999");

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Event tidak ditemukan",
    });
  });

  test("mengembalikan 500 jika proses delete gagal", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Test",
      },
    ]);

    dbError();

    const response = await request(app).delete("/event/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      success: false,
      message: "Gagal menghapus event",
    });
  });

  test("mengembalikan 404 jika affectedRows bernilai 0", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Test",
      },
    ]);

    dbSuccess({
      affectedRows: 0,
    });

    const response = await request(app).delete("/event/1");

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Event tidak ditemukan",
    });
  });

  test("berhasil menghapus event", async () => {
    dbSuccess([
      {
        id: 1,
        judul: "Event Test",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).delete("/event/1");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil dihapus",
    });

    expect(logAktivitas).toHaveBeenCalledTimes(1);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        aktivitas: "Menghapus event",
        keterangan: 'Menghapus event "Event Test"',
      })
    );
  });

  test("tetap berhasil jika log delete gagal", async () => {
    logAktivitas.mockRejectedValueOnce(new Error("Log Delete Error"));

    dbSuccess([
      {
        id: 2,
        judul: "Event Untuk Dihapus",
      },
    ]);

    dbSuccess({
      affectedRows: 1,
    });

    const response = await request(app).delete("/event/2");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Event berhasil dihapus",
    });
  });
});
