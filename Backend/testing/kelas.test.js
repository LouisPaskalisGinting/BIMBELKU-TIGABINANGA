process.env.NODE_ENV = "test";

const request = require("supertest");

// ======================================================
// MOCK DATABASE
// ======================================================
jest.mock("../db", () => ({
  query: jest.fn(),
}));

// ======================================================
// MOCK AUTH MIDDLEWARE
// ======================================================
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
// DATA TEST
// ======================================================

const kelas = {
  id: 1,
  nama_kelas: "Kelas A",
  program_id: 10,
  nama_program: "Program Reguler",
};

const kelasLama = {
  nama_kelas: "Kelas Lama",
  program_id: 10,
  nama_program: "Program Lama",
};

const program = {
  nama_program: "Program Reguler",
};

// ======================================================
// HELPER MOCK DATABASE
// ======================================================

/*
 * Helper ini dibuat agar dapat menangani dua bentuk
 * pemanggilan db.query:
 *
 * 1. db.query(sql, callback)
 * 2. db.query(sql, params, callback)
 *
 * Route GET /kelas menggunakan bentuk pertama,
 * sedangkan route lainnya banyak menggunakan bentuk kedua.
 */

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

function dbSequence(...responses) {
  responses.forEach((response) => {
    if (response instanceof Error) {
      dbError(response);
    } else {
      dbSuccess(response);
    }
  });
}

// ======================================================
// RESET MOCK
// ======================================================

beforeEach(() => {
  jest.clearAllMocks();

  logAktivitas.mockResolvedValue();
});

// ======================================================
// GET SEMUA KELAS
// ======================================================

describe("GET /kelas", () => {
  test("berhasil mengambil semua kelas", async () => {
    dbSuccess([kelas]);

    const res = await request(app).get("/kelas");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([kelas]);
  });

  test("gagal mengambil semua kelas ketika database error", async () => {
    dbError();

    const res = await request(app).get("/kelas");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Gagal mengambil data kelas");
  });
});

// ======================================================
// GET KELAS BERDASARKAN ID
// ======================================================

describe("GET /kelas/:id", () => {
  test("berhasil mengambil detail kelas", async () => {
    dbSuccess([kelas]);

    const res = await request(app).get("/kelas/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(kelas);
  });

  test("gagal jika kelas tidak ditemukan", async () => {
    dbSuccess([]);

    const res = await request(app).get("/kelas/1");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Kelas tidak ditemukan");
  });

  test("gagal mengambil detail kelas karena database error", async () => {
    dbError();

    const res = await request(app).get("/kelas/1");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Gagal mengambil detail kelas");
  });
});

// ======================================================
// POST /kelas - VALIDASI
// ======================================================

describe("POST /kelas - validasi", () => {
  test("gagal jika nama kelas tidak diisi", async () => {
    const res = await request(app).post("/kelas").send({
      program_id: 10,
    });

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Nama kelas dan program wajib diisi");
  });

  test("gagal jika program tidak diisi", async () => {
    const res = await request(app).post("/kelas").send({
      nama_kelas: "Kelas A",
    });

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Nama kelas dan program wajib diisi");
  });

  test("gagal jika nama kelas hanya berisi spasi", async () => {
    const res = await request(app).post("/kelas").send({
      nama_kelas: "   ",
      program_id: 10,
    });

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Nama kelas tidak boleh kosong");
  });
});

// ======================================================
// POST /kelas
// ======================================================

describe("POST /kelas", () => {
  test("gagal ketika pengecekan duplikat database error", async () => {
    dbError();

    const res = await request(app).post("/kelas").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal memeriksa nama kelas");
  });

  test("gagal jika nama kelas sudah digunakan", async () => {
    dbSuccess([{ id: 5 }]);

    const res = await request(app).post("/kelas").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toContain("Nama kelas sudah digunakan");
  });

  test("gagal ketika proses insert database error", async () => {
    dbSequence([], new Error("Insert Error"));

    const res = await request(app).post("/kelas").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal menambahkan kelas");
  });

  test("berhasil menambahkan kelas dan program ditemukan", async () => {
    dbSequence(
      [],
      {
        insertId: 20,
      },
      [program]
    );

    const res = await request(app).post("/kelas").send({
      nama_kelas: "  Kelas Baru  ",
      program_id: 10,
    });

    expect(res.statusCode).toBe(201);

    expect(res.body.message).toBe("Kelas berhasil ditambahkan");

    expect(res.body.id).toBe(20);

    expect(logAktivitas).toHaveBeenCalled();
  });

  test("berhasil menambahkan kelas ketika program tidak ditemukan", async () => {
    dbSequence(
      [],
      {
        insertId: 21,
      },
      []
    );

    const res = await request(app).post("/kelas").send({
      nama_kelas: "Kelas Tanpa Program",
      program_id: 99,
    });

    expect(res.statusCode).toBe(201);

    expect(res.body.id).toBe(21);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        keterangan: expect.stringContaining('program "-"'),
      })
    );
  });

  test("berhasil menambahkan kelas ketika query program error", async () => {
    dbSequence(
      [],
      {
        insertId: 22,
      },
      new Error("Program Error")
    );

    const res = await request(app).post("/kelas").send({
      nama_kelas: "Kelas Program Error",
      program_id: 10,
    });

    expect(res.statusCode).toBe(201);

    expect(res.body.id).toBe(22);
  });

  test("tetap berhasil jika log aktivitas gagal", async () => {
    logAktivitas.mockRejectedValue(new Error("Log Error"));

    dbSequence(
      [],
      {
        insertId: 23,
      },
      [program]
    );

    const res = await request(app).post("/kelas").send({
      nama_kelas: "Kelas Log Error",
      program_id: 10,
    });

    expect(res.statusCode).toBe(201);

    expect(res.body.id).toBe(23);
  });
});

// ======================================================
// PUT /kelas/:id - VALIDASI
// ======================================================

describe("PUT /kelas/:id - validasi", () => {
  test("gagal jika data wajib tidak lengkap", async () => {
    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
    });

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Nama kelas dan program wajib diisi");
  });

  test("gagal jika nama kelas hanya berisi spasi", async () => {
    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "   ",
      program_id: 10,
    });

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Nama kelas tidak boleh kosong");
  });
});

// ======================================================
// PUT /kelas/:id
// ======================================================

describe("PUT /kelas/:id", () => {
  test("gagal mengambil data kelas lama karena database error", async () => {
    dbError();

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal mengambil data kelas");
  });

  test("gagal jika kelas lama tidak ditemukan", async () => {
    dbSuccess([]);

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(404);

    expect(res.body.message).toBe("Kelas tidak ditemukan");
  });

  test("gagal ketika pengecekan duplikat database error", async () => {
    dbSequence([kelasLama], new Error("Duplicate Check Error"));

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal memeriksa nama kelas");
  });

  test("gagal jika nama kelas sudah digunakan kelas lain", async () => {
    dbSequence(
      [kelasLama],
      [
        {
          id: 2,
        },
      ]
    );

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe(
      "Nama kelas sudah digunakan oleh kelas lain."
    );
  });

  test("gagal ketika update database error", async () => {
    dbSequence([kelasLama], [], new Error("Update Error"));

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal mengupdate kelas");
  });

  test("gagal jika affectedRows bernilai 0", async () => {
    dbSequence([kelasLama], [], {
      affectedRows: 0,
    });

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(404);

    expect(res.body.message).toBe("Kelas tidak ditemukan");
  });

  test("berhasil update dan program ditemukan", async () => {
    dbSequence(
      [kelasLama],
      [],
      {
        affectedRows: 1,
      },
      [program]
    );

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "  Kelas Baru  ",
      program_id: 10,
    });

    expect(res.statusCode).toBe(200);

    expect(res.body.message).toBe("Kelas berhasil diupdate");

    expect(logAktivitas).toHaveBeenCalled();
  });

  test("berhasil update ketika program tidak ditemukan", async () => {
    dbSequence(
      [kelasLama],
      [],
      {
        affectedRows: 1,
      },
      []
    );

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 99,
    });

    expect(res.statusCode).toBe(200);

    expect(res.body.message).toBe("Kelas berhasil diupdate");
  });

  test("berhasil update ketika query program error", async () => {
    dbSequence(
      [kelasLama],
      [],
      {
        affectedRows: 1,
      },
      new Error("Program Error")
    );

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 99,
    });

    expect(res.statusCode).toBe(200);

    expect(res.body.message).toBe("Kelas berhasil diupdate");
  });

  test("tetap berhasil update jika log aktivitas gagal", async () => {
    logAktivitas.mockRejectedValue(new Error("Log Error"));

    dbSequence(
      [kelasLama],
      [],
      {
        affectedRows: 1,
      },
      [program]
    );

    const res = await request(app).put("/kelas/1").send({
      nama_kelas: "Kelas Baru",
      program_id: 10,
    });

    expect(res.statusCode).toBe(200);

    expect(res.body.message).toBe("Kelas berhasil diupdate");
  });
});

// ======================================================
// DELETE /kelas/:id
// ======================================================

describe("DELETE /kelas/:id", () => {
  test("gagal ketika pencarian kelas database error", async () => {
    dbError();

    const res = await request(app).delete("/kelas/1");

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal mencari data kelas");
  });

  test("gagal jika kelas tidak ditemukan", async () => {
    dbSuccess([]);

    const res = await request(app).delete("/kelas/1");

    expect(res.statusCode).toBe(404);

    expect(res.body.message).toBe("Kelas tidak ditemukan");
  });

  test("gagal ketika proses delete database error", async () => {
    dbSequence([kelas], new Error("Delete Error"));

    const res = await request(app).delete("/kelas/1");

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal menghapus kelas");
  });

  test("gagal jika affectedRows bernilai 0", async () => {
    dbSequence([kelas], {
      affectedRows: 0,
    });

    const res = await request(app).delete("/kelas/1");

    expect(res.statusCode).toBe(404);

    expect(res.body.message).toBe("Kelas tidak ditemukan");
  });

  test("berhasil menghapus kelas dan program tersedia", async () => {
    dbSequence([kelas], {
      affectedRows: 1,
    });

    const res = await request(app).delete("/kelas/1");

    expect(res.statusCode).toBe(200);

    expect(res.body.message).toBe("Kelas berhasil dihapus");

    expect(logAktivitas).toHaveBeenCalled();
  });

  test("berhasil menghapus kelas tanpa nama program", async () => {
    dbSequence(
      [
        {
          nama_kelas: "Kelas Tanpa Program",
          nama_program: null,
        },
      ],
      {
        affectedRows: 1,
      }
    );

    const res = await request(app).delete("/kelas/1");

    expect(res.statusCode).toBe(200);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        keterangan: expect.stringContaining('program "-"'),
      })
    );
  });

  test("tetap berhasil jika log aktivitas delete gagal", async () => {
    logAktivitas.mockRejectedValue(new Error("Log Error"));

    dbSequence([kelas], {
      affectedRows: 1,
    });

    const res = await request(app).delete("/kelas/1");

    expect(res.statusCode).toBe(200);

    expect(res.body.message).toBe("Kelas berhasil dihapus");
  });
});
