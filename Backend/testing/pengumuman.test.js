// =====================================================
// WHITE-BOX TESTING - PENGUMUMAN
// =====================================================

process.env.NODE_ENV = "test";

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
    // Digunakan untuk menguji kondisi req.user tidak tersedia
    if (req.headers["x-test-no-user"] === "true") {
      return next();
    }

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
// IMPORT SETELAH MOCK
// =====================================================

const db = require("../db");
const logAktivitas = require("../utils/logAktivitas");
const app = require("../server");

// =====================================================
// HELPER DATABASE
// =====================================================

function dbSuccess(data) {
  db.query.mockImplementationOnce((...args) => {
    const callback = args[args.length - 1];
    callback(null, data);
  });
}

function dbError(message = "Database Error") {
  db.query.mockImplementationOnce((...args) => {
    const callback = args[args.length - 1];
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

const pengumumanData = {
  id: 1,
  judul: "Pengumuman Test",
  isi: "Isi pengumuman untuk pengujian.",
};

const pengumumanLama = {
  id: 1,
  judul: "Pengumuman Lama",
  isi: "Isi lama",
};

const pengumumanBaru = {
  id: 1,
  judul: "Pengumuman Baru",
  isi: "Isi baru",
};

// =====================================================
// SETUP
// =====================================================

beforeEach(() => {
  db.query.mockReset();
  logAktivitas.mockReset();

  logAktivitas.mockResolvedValue(true);
});

// =====================================================
// GET SEMUA PENGUMUMAN
// =====================================================

describe("GET /pengumuman", () => {
  test("berhasil mengambil seluruh data pengumuman", async () => {
    dbSuccess([
      pengumumanData,
      {
        id: 2,
        judul: "Pengumuman Kedua",
        isi: "Isi kedua",
      },
    ]);

    const response = await request(app).get("/pengumuman");

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(response.body).toHaveLength(2);

    expect(response.body[0]).toHaveProperty("id", 1);

    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError("Gagal mengambil pengumuman");

    const response = await request(app).get("/pengumuman");

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty(
      "message",
      "Gagal mengambil data pengumuman"
    );

    expect(db.query).toHaveBeenCalledTimes(1);
  });
});

// =====================================================
// GET PENGUMUMAN BERDASARKAN ID
// =====================================================

describe("GET /pengumuman/:id", () => {
  test("berhasil mengambil detail pengumuman", async () => {
    dbSuccess([pengumumanData]);

    const response = await request(app).get("/pengumuman/1");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual(pengumumanData);

    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("mengembalikan 404 jika pengumuman tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/pengumuman/999");

    expect(response.statusCode).toBe(404);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman tidak ditemukan"
    );
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError("Database gagal");

    const response = await request(app).get("/pengumuman/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty(
      "message",
      "Gagal mengambil detail pengumuman"
    );
  });
});

// =====================================================
// POST TAMBAH PENGUMUMAN
// =====================================================

describe("POST /pengumuman", () => {
  test("berhasil menambahkan pengumuman", async () => {
    dbSuccess({
      insertId: 10,
      affectedRows: 1,
    });

    const response = await request(app).post("/pengumuman").send({
      judul: "Pengumuman Baru",
      isi: "Isi pengumuman baru.",
    });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil ditambahkan"
    );

    expect(response.body).toHaveProperty("id", 10);

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(logAktivitas).toHaveBeenCalledTimes(1);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        aktivitas: "Menambahkan pengumuman",
        keterangan: 'Menambahkan pengumuman "Pengumuman Baru"',
      })
    );
  });

  test("berhasil menambahkan pengumuman dengan spasi di awal dan akhir", async () => {
    dbSuccess({
      insertId: 11,
      affectedRows: 1,
    });

    const response = await request(app).post("/pengumuman").send({
      judul: "   Judul Bersih   ",
      isi: "   Isi pengumuman bersih   ",
    });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil ditambahkan"
    );

    const call = db.query.mock.calls[0];

    expect(call[1]).toEqual(["Judul Bersih", "Isi pengumuman bersih"]);
  });

  test("menolak jika judul dan isi tidak diisi", async () => {
    const response = await request(app).post("/pengumuman").send({});

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );

    expect(db.query).not.toHaveBeenCalled();
  });

  test("menolak jika judul tidak diisi", async () => {
    const response = await request(app).post("/pengumuman").send({
      isi: "Isi pengumuman",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );

    expect(db.query).not.toHaveBeenCalled();
  });

  test("menolak jika isi tidak diisi", async () => {
    const response = await request(app).post("/pengumuman").send({
      judul: "Judul pengumuman",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );

    expect(db.query).not.toHaveBeenCalled();
  });

  test("menolak jika judul bernilai null", async () => {
    const response = await request(app).post("/pengumuman").send({
      judul: null,
      isi: "Isi pengumuman",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );
  });

  test("menolak jika isi bernilai null", async () => {
    const response = await request(app).post("/pengumuman").send({
      judul: "Judul pengumuman",
      isi: null,
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );
  });

  test("menolak jika judul hanya berisi spasi", async () => {
    const response = await request(app).post("/pengumuman").send({
      judul: "     ",
      isi: "Isi pengumuman",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman tidak boleh kosong"
    );

    expect(db.query).not.toHaveBeenCalled();
  });

  test("menolak jika isi hanya berisi spasi", async () => {
    const response = await request(app).post("/pengumuman").send({
      judul: "Judul pengumuman",
      isi: "     ",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman tidak boleh kosong"
    );

    expect(db.query).not.toHaveBeenCalled();
  });

  test("mengembalikan 500 jika insert database gagal", async () => {
    dbError("Insert gagal");

    const response = await request(app).post("/pengumuman").send({
      judul: "Judul Error",
      isi: "Isi Error",
    });

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty(
      "message",
      "Gagal menambahkan pengumuman"
    );

    expect(logAktivitas).not.toHaveBeenCalled();
  });

  test("tetap berhasil jika log aktivitas gagal", async () => {
    dbSuccess({
      insertId: 12,
      affectedRows: 1,
    });

    logAktivitas.mockRejectedValueOnce(new Error("Log aktivitas gagal"));

    const response = await request(app).post("/pengumuman").send({
      judul: "Pengumuman Log Error",
      isi: "Isi pengumuman",
    });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil ditambahkan"
    );

    expect(response.body.id).toBe(12);
  });

  test("tetap berhasil ketika data user tidak tersedia", async () => {
    dbSuccess({
      insertId: 13,
      affectedRows: 1,
    });

    const response = await request(app)
      .post("/pengumuman")
      .set("x-test-no-user", "true")
      .send({
        judul: "Pengumuman Tanpa User",
        isi: "Isi pengumuman",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil ditambahkan"
    );

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: undefined,
        nama_user: "-",
        role: "-",
      })
    );
  });
});

// =====================================================
// PUT EDIT PENGUMUMAN
// =====================================================

describe("PUT /pengumuman/:id", () => {
  test("berhasil mengupdate pengumuman", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 1,
    });

    const response = await request(app).put("/pengumuman/1").send({
      judul: "Pengumuman Baru",
      isi: "Isi baru",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil diupdate"
    );

    expect(db.query).toHaveBeenCalledTimes(2);

    expect(logAktivitas).toHaveBeenCalledTimes(1);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        aktivitas: "Mengedit pengumuman",
        keterangan:
          'Mengedit pengumuman "Pengumuman Lama" menjadi "Pengumuman Baru"',
      })
    );
  });

  test("berhasil mengupdate dengan data yang memiliki spasi", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 1,
    });

    const response = await request(app).put("/pengumuman/1").send({
      judul: "   Judul Baru   ",
      isi: "   Isi Baru   ",
    });

    expect(response.statusCode).toBe(200);

    const updateCall = db.query.mock.calls[1];

    expect(updateCall[1]).toEqual(["Judul Baru", "Isi Baru", "1"]);
  });

  test("menolak jika judul dan isi tidak diisi", async () => {
    const response = await request(app).put("/pengumuman/1").send({});

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );

    expect(db.query).not.toHaveBeenCalled();
  });

  test("menolak jika judul tidak diisi", async () => {
    const response = await request(app).put("/pengumuman/1").send({
      isi: "Isi baru",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );
  });

  test("menolak jika isi tidak diisi", async () => {
    const response = await request(app).put("/pengumuman/1").send({
      judul: "Judul baru",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman wajib diisi"
    );
  });

  test("menolak jika judul hanya berisi spasi", async () => {
    const response = await request(app).put("/pengumuman/1").send({
      judul: "     ",
      isi: "Isi baru",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman tidak boleh kosong"
    );
  });

  test("menolak jika isi hanya berisi spasi", async () => {
    const response = await request(app).put("/pengumuman/1").send({
      judul: "Judul baru",
      isi: "     ",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
      "message",
      "Judul dan isi pengumuman tidak boleh kosong"
    );
  });

  test("mengembalikan 500 jika gagal mencari pengumuman", async () => {
    dbError("Select gagal");

    const response = await request(app).put("/pengumuman/1").send({
      judul: "Judul baru",
      isi: "Isi baru",
    });

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty("message", "Gagal mencari pengumuman");
  });

  test("mengembalikan 404 jika pengumuman tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).put("/pengumuman/999").send({
      judul: "Judul baru",
      isi: "Isi baru",
    });

    expect(response.statusCode).toBe(404);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman tidak ditemukan"
    );

    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("mengembalikan 500 jika update database gagal", async () => {
    dbSequence([pengumumanLama], new Error("Update gagal"));

    const response = await request(app).put("/pengumuman/1").send({
      judul: "Judul baru",
      isi: "Isi baru",
    });

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty(
      "message",
      "Gagal mengupdate pengumuman"
    );
  });

  test("mengembalikan 404 jika update tidak memengaruhi data", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 0,
    });

    const response = await request(app).put("/pengumuman/1").send({
      judul: "Judul baru",
      isi: "Isi baru",
    });

    expect(response.statusCode).toBe(404);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman tidak ditemukan"
    );

    expect(logAktivitas).not.toHaveBeenCalled();
  });

  test("tetap berhasil jika log aktivitas update gagal", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 1,
    });

    logAktivitas.mockRejectedValueOnce(new Error("Log update gagal"));

    const response = await request(app).put("/pengumuman/1").send({
      judul: "Judul Baru",
      isi: "Isi Baru",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil diupdate"
    );
  });

  test("tetap berhasil ketika data user tidak tersedia", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 1,
    });

    const response = await request(app)
      .put("/pengumuman/1")
      .set("x-test-no-user", "true")
      .send({
        judul: "Judul Baru",
        isi: "Isi Baru",
      });

    expect(response.statusCode).toBe(200);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: undefined,
        nama_user: "-",
        role: "-",
      })
    );
  });
});

// =====================================================
// DELETE PENGUMUMAN
// =====================================================

describe("DELETE /pengumuman/:id", () => {
  test("berhasil menghapus pengumuman", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 1,
    });

    const response = await request(app).delete("/pengumuman/1");

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil dihapus"
    );

    expect(db.query).toHaveBeenCalledTimes(2);

    expect(logAktivitas).toHaveBeenCalledTimes(1);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        aktivitas: "Menghapus pengumuman",
        keterangan: 'Menghapus pengumuman "Pengumuman Lama"',
      })
    );
  });

  test("mengembalikan 500 jika gagal mencari pengumuman", async () => {
    dbError("Select delete gagal");

    const response = await request(app).delete("/pengumuman/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty("message", "Gagal mencari pengumuman");
  });

  test("mengembalikan 404 jika pengumuman tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).delete("/pengumuman/999");

    expect(response.statusCode).toBe(404);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman tidak ditemukan"
    );

    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("mengembalikan 500 jika proses delete database gagal", async () => {
    dbSequence([pengumumanLama], new Error("Delete gagal"));

    const response = await request(app).delete("/pengumuman/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toHaveProperty(
      "message",
      "Gagal menghapus pengumuman"
    );

    expect(logAktivitas).not.toHaveBeenCalled();
  });

  test("mengembalikan 404 jika delete tidak memengaruhi data", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 0,
    });

    const response = await request(app).delete("/pengumuman/1");

    expect(response.statusCode).toBe(404);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman tidak ditemukan"
    );

    expect(logAktivitas).not.toHaveBeenCalled();
  });

  test("tetap berhasil jika log aktivitas delete gagal", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 1,
    });

    logAktivitas.mockRejectedValueOnce(new Error("Log delete gagal"));

    const response = await request(app).delete("/pengumuman/1");

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty(
      "message",
      "Pengumuman berhasil dihapus"
    );
  });

  test("tetap berhasil ketika data user tidak tersedia", async () => {
    dbSequence([pengumumanLama], {
      affectedRows: 1,
    });

    const response = await request(app)
      .delete("/pengumuman/1")
      .set("x-test-no-user", "true");

    expect(response.statusCode).toBe(200);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: undefined,
        nama_user: "-",
        role: "-",
      })
    );
  });
});
