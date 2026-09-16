// ============================================================
// testing/pembayaran.test.js
// White Box Testing - routes/pembayaran.js
// ============================================================

process.env.NODE_ENV = "test";

const request = require("supertest");
const fs = require("fs");
const path = require("path");

// ============================================================
// MOCK DATABASE
// ============================================================

jest.mock("../db", () => ({
  query: jest.fn(),
}));

// ============================================================
// MOCK AUTH MIDDLEWARE
// ============================================================

jest.mock("../middleware/authMiddleware", () => {
  return (req, res, next) => {
    if (req.headers["x-test-no-user"] === "true") {
      return next();
    }

    req.user = {
      id: 1,
      nama: "Admin Test",
      role: "admin",
    };

    next();
  };
});

// ============================================================
// MOCK LOG AKTIVITAS
// ============================================================

jest.mock("../utils/logAktivitas", () => jest.fn());

// ============================================================
// IMPORT
// ============================================================

const db = require("../db");
const logAktivitas = require("../utils/logAktivitas");
const app = require("../server");

// ============================================================
// SETUP UPLOAD
// ============================================================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const existingFiles = new Set(fs.readdirSync(uploadDir));

// ============================================================
// HELPER DATABASE
// ============================================================

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

// ============================================================
// HELPER UPLOAD
// ============================================================

function attachFile(req) {
  return req.attach(
    "bukti_pembayaran",
    Buffer.from("file pembayaran testing"),
    "test-pembayaran.jpg"
  );
}

// ============================================================
// DATA TEST
// ============================================================

const detailPending = {
  id: 1,
  pembayaran_id: 10,
  jumlah: 100000,
  status: "pending",
  nama_siswa: "Siswa Test",
};

const detailApproved = {
  id: 1,
  pembayaran_id: 10,
  jumlah: 100000,
  status: "approved",
  nama_siswa: "Siswa Test",
};

const pembayaranData = {
  id: 10,
  siswa_id: 1,
  nama_siswa: "Siswa Test",
  total_tagihan: 1000000,
  sudah_dibayar: 200000,
};

// ============================================================
// BEFORE EACH
// ============================================================

beforeEach(() => {
  db.query.mockReset();
  logAktivitas.mockReset();
});

// ============================================================
// CLEANUP
// ============================================================

afterAll(() => {
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);

    files.forEach((file) => {
      if (!existingFiles.has(file)) {
        try {
          fs.unlinkSync(path.join(uploadDir, file));
        } catch (error) {
          // Abaikan error cleanup
        }
      }
    });
  }
});

// ============================================================
// POST /pembayaran/generate
// ============================================================

describe("POST /pembayaran/generate", () => {
  test("berhasil generate tagihan", async () => {
    dbSuccess({
      affectedRows: 5,
    });

    const response = await request(app).post("/pembayaran/generate");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "Tagihan berhasil digenerate",
      inserted: 5,
    });
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError();

    const response = await request(app).post("/pembayaran/generate");

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal generate tagihan",
      error: "Database Error",
    });
  });
});

// ============================================================
// GET /pembayaran
// ============================================================

describe("GET /pembayaran", () => {
  test("berhasil mengambil seluruh pembayaran", async () => {
    dbSuccess([pembayaranData]);

    const response = await request(app).get("/pembayaran");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([pembayaranData]);
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/pembayaran");

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal mengambil data pembayaran");

    expect(response.body.error).toBeDefined();
  });
});

// ============================================================
// GET /pembayaran/siswa/:id
// ============================================================

describe("GET /pembayaran/siswa/:id", () => {
  test.each([
    ["0", "ID 0"],
    ["-1", "ID negatif"],
  ])("menolak %s", async (id) => {
    const response = await request(app).get(`/pembayaran/siswa/${id}`);

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "ID siswa tidak valid",
    });

    expect(db.query).not.toHaveBeenCalled();
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/pembayaran/siswa/1");

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal mengambil pembayaran siswa");
  });

  test("mengembalikan array kosong jika pembayaran tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).get("/pembayaran/siswa/1");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("berhasil mengambil pembayaran siswa", async () => {
    dbSuccess([pembayaranData]);

    const response = await request(app).get("/pembayaran/siswa/1");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([pembayaranData]);
  });
});

// ============================================================
// GET /pembayaran/detail/:id
// ============================================================

describe("GET /pembayaran/detail/:id", () => {
  test("berhasil mengambil detail pembayaran", async () => {
    dbSuccess([detailPending]);

    const response = await request(app).get("/pembayaran/detail/1");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([detailPending]);
  });

  test("mengembalikan array kosong jika detail tidak ada", async () => {
    dbSuccess([]);

    const response = await request(app).get("/pembayaran/detail/1");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError();

    const response = await request(app).get("/pembayaran/detail/1");

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal mengambil detail pembayaran");
  });
});

// ============================================================
// POST /pembayaran/admin/:id
// ============================================================

describe("POST /pembayaran/admin/:id", () => {
  test("mengembalikan 401 jika req.user tidak tersedia", async () => {
    const req = request(app)
      .post("/pembayaran/admin/1")
      .set("x-test-no-user", "true")
      .field("jumlah", "100000");

    const response = await attachFile(req);

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
      message: "User tidak terautentikasi",
    });
  });

  test.each([
    ["jumlah tidak diisi", undefined],
    ["jumlah kosong", ""],
    ["jumlah nol", "0"],
    ["jumlah negatif", "-100"],
  ])("menolak jika %s", async (_, jumlah) => {
    let req = request(app).post("/pembayaran/admin/1");

    if (jumlah !== undefined) {
      req = req.field("jumlah", jumlah);
    }

    const response = await attachFile(req);

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Jumlah pembayaran tidak valid",
    });
  });

  test("menolak jika bukti pembayaran tidak diupload", async () => {
    const response = await request(app)
      .post("/pembayaran/admin/1")
      .field("jumlah", "100000");

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Bukti pembayaran wajib diupload",
    });
  });

  test("mengembalikan 500 jika gagal mengambil tagihan", async () => {
    dbError();

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal mengambil data tagihan");
  });

  test("mengembalikan 404 jika pembayaran tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      message: "Data pembayaran tidak ditemukan",
    });
  });

  test("menolak jika nominal melebihi sisa tagihan", async () => {
    dbSuccess([
      {
        ...pembayaranData,
        total_tagihan: 100000,
        sudah_dibayar: 50000,
      },
    ]);

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "60000")
    );

    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Nominal pembayaran melebihi sisa tagihan"
    );

    expect(response.body.sisa_tagihan).toBe(50000);
  });

  test("mengembalikan 500 jika insert detail gagal", async () => {
    dbSequence([pembayaranData], new Error("Database Error"));

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal menyimpan detail pembayaran");
  });

  test("mengembalikan 500 jika update pembayaran gagal", async () => {
    dbSequence(
      [pembayaranData],
      {
        insertId: 20,
        affectedRows: 1,
      },
      new Error("Database Error")
    );

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal memperbarui tagihan");
  });

  test("berhasil menambahkan pembayaran admin", async () => {
    dbSequence(
      [pembayaranData],
      {
        insertId: 20,
        affectedRows: 1,
      },
      {
        affectedRows: 1,
      }
    );

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe("Pembayaran siswa berhasil ditambahkan");

    expect(response.body.total_tagihan).toBe(1000000);

    expect(response.body.sudah_dibayar).toBe(300000);

    expect(response.body.sisa_tagihan).toBe(700000);
  });

  test("tetap berhasil jika log pembayaran gagal", async () => {
    logAktivitas.mockImplementationOnce(() => {
      throw new Error("Log Error");
    });

    dbSequence(
      [pembayaranData],
      {
        insertId: 20,
        affectedRows: 1,
      },
      {
        affectedRows: 1,
      }
    );

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe("Pembayaran siswa berhasil ditambahkan");
  });

  test("menggunakan nilai fallback ketika sudah_dibayar bernilai 0", async () => {
    dbSequence(
      [
        {
          ...pembayaranData,
          total_tagihan: 1000000,
          sudah_dibayar: 0,
        },
      ],
      {
        insertId: 21,
        affectedRows: 1,
      },
      {
        affectedRows: 1,
      }
    );

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(201);

    expect(response.body.total_tagihan).toBe(1000000);

    expect(response.body.sudah_dibayar).toBe(100000);

    expect(response.body.sisa_tagihan).toBe(900000);
  });

  test("menggunakan fallback total_tagihan 0", async () => {
    dbSuccess([
      {
        ...pembayaranData,
        total_tagihan: 0,
        sudah_dibayar: 0,
      },
    ]);

    const response = await attachFile(
      request(app).post("/pembayaran/admin/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Nominal pembayaran melebihi sisa tagihan"
    );

    expect(response.body.sisa_tagihan).toBe(0);
  });
});

// ============================================================
// POST /pembayaran/:id
// ============================================================

describe("POST /pembayaran/:id", () => {
  test.each([
    ["jumlah tidak ada", undefined],
    ["jumlah kosong", ""],
    ["jumlah nol", "0"],
    ["jumlah negatif", "-100"],
  ])("menolak jika %s", async (_, jumlah) => {
    let req = request(app).post("/pembayaran/1");

    if (jumlah !== undefined) {
      req = req.field("jumlah", jumlah);
    }

    const response = await attachFile(req);

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Jumlah pembayaran tidak valid",
    });
  });

  test("menolak jika bukti tidak diupload", async () => {
    const response = await request(app)
      .post("/pembayaran/1")
      .field("jumlah", "100000");

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Bukti pembayaran wajib diupload",
    });
  });

  test("mengembalikan 500 jika database error", async () => {
    dbError();

    const response = await attachFile(
      request(app).post("/pembayaran/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal mengambil data pembayaran");

    expect(response.body.error).toBeDefined();
  });

  test("mengembalikan 404 jika pembayaran tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await attachFile(
      request(app).post("/pembayaran/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      message: "Data pembayaran tidak ditemukan",
    });
  });

  test("menolak jika jumlah melebihi sisa tagihan", async () => {
    dbSuccess([
      {
        ...pembayaranData,
        total_tagihan: 100000,
        sudah_dibayar: 50000,
      },
    ]);

    const response = await attachFile(
      request(app).post("/pembayaran/1").field("jumlah", "60000")
    );

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Jumlah melebihi sisa tagihan",
      sisa_tagihan: 50000,
    });
  });

  test("mengembalikan 500 jika insert pembayaran gagal", async () => {
    dbSequence([pembayaranData], new Error("Database Error"));

    const response = await attachFile(
      request(app).post("/pembayaran/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal menyimpan pembayaran");
  });

  test("berhasil mengajukan pembayaran siswa", async () => {
    dbSequence([pembayaranData], {
      insertId: 30,
      affectedRows: 1,
    });

    const response = await attachFile(
      request(app).post("/pembayaran/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(201);

    expect(response.body).toEqual({
      message: "Pembayaran berhasil diajukan, menunggu persetujuan admin",
      nama_siswa: "Siswa Test",
    });
  });

  test("menggunakan fallback ketika sudah_dibayar bernilai 0", async () => {
    dbSequence(
      [
        {
          ...pembayaranData,
          total_tagihan: 1000000,
          sudah_dibayar: 0,
        },
      ],
      {
        insertId: 31,
        affectedRows: 1,
      }
    );

    const response = await attachFile(
      request(app).post("/pembayaran/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(201);

    expect(response.body.nama_siswa).toBe("Siswa Test");
  });

  test("menggunakan fallback total_tagihan 0", async () => {
    dbSuccess([
      {
        ...pembayaranData,
        total_tagihan: 0,
        sudah_dibayar: 0,
      },
    ]);

    const response = await attachFile(
      request(app).post("/pembayaran/1").field("jumlah", "100000")
    );

    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe("Jumlah melebihi sisa tagihan");

    expect(response.body.sisa_tagihan).toBe(0);
  });
});

// ============================================================
// PUT /pembayaran/approve/:detailId
// ============================================================

describe("PUT /pembayaran/approve/:detailId", () => {
  test("mengembalikan 500 jika gagal mengambil detail", async () => {
    dbError();

    const response = await request(app).put("/pembayaran/approve/1");

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal mengambil detail pembayaran");
  });

  test("mengembalikan 404 jika detail tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).put("/pembayaran/approve/1");

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      message: "Detail pembayaran tidak ditemukan",
    });
  });

  test("menolak pembayaran yang sudah diproses", async () => {
    dbSuccess([detailApproved]);

    const response = await request(app).put("/pembayaran/approve/1");

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Pembayaran sudah diproses",
    });
  });

  test("mengembalikan 500 jika update detail gagal", async () => {
    dbSequence([detailPending], new Error("Database Error"));

    const response = await request(app).put("/pembayaran/approve/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal menyetujui pembayaran",
      error: "Database Error",
    });
  });

  test("mengembalikan 500 jika update tagihan gagal", async () => {
    dbSequence(
      [detailPending],
      {
        affectedRows: 1,
      },
      new Error("Database Error")
    );

    const response = await request(app).put("/pembayaran/approve/1");

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal memperbarui tagihan",
      error: "Database Error",
    });
  });

  test("berhasil menyetujui pembayaran", async () => {
    dbSequence(
      [detailPending],
      {
        affectedRows: 1,
      },
      {
        affectedRows: 1,
      }
    );

    const response = await request(app).put("/pembayaran/approve/1");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "Pembayaran disetujui",
      nama_siswa: "Siswa Test",
    });
  });

  test("tetap berhasil jika log approve gagal", async () => {
    logAktivitas.mockImplementationOnce(() => {
      throw new Error("Log Error");
    });

    dbSequence(
      [detailPending],
      {
        affectedRows: 1,
      },
      {
        affectedRows: 1,
      }
    );

    const response = await request(app).put("/pembayaran/approve/1");

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe("Pembayaran disetujui");
  });
});

// ============================================================
// PUT /pembayaran/reject/:detailId
// ============================================================

describe("PUT /pembayaran/reject/:detailId", () => {
  test("mengembalikan 500 jika gagal mengambil detail", async () => {
    dbError();

    const response = await request(app).put("/pembayaran/reject/1").send({});

    expect(response.statusCode).toBe(500);

    expect(response.body.message).toBe("Gagal mengambil detail pembayaran");
  });

  test("mengembalikan 404 jika detail tidak ditemukan", async () => {
    dbSuccess([]);

    const response = await request(app).put("/pembayaran/reject/1").send({});

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      message: "Detail pembayaran tidak ditemukan",
    });
  });

  test("menolak jika pembayaran sudah diproses", async () => {
    dbSuccess([detailApproved]);

    const response = await request(app).put("/pembayaran/reject/1").send({
      catatan: "Sudah diproses",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Pembayaran sudah diproses",
    });
  });

  test("menggunakan catatan default jika catatan kosong", async () => {
    dbSequence([detailPending], {
      affectedRows: 1,
    });

    const response = await request(app).put("/pembayaran/reject/1").send({
      catatan: "",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "Pembayaran ditolak",
      nama_siswa: "Siswa Test",
    });
  });

  test("menggunakan catatan yang diberikan", async () => {
    dbSequence([detailPending], {
      affectedRows: 1,
    });

    const response = await request(app).put("/pembayaran/reject/1").send({
      catatan: "Bukti pembayaran tidak sesuai",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "Pembayaran ditolak",
      nama_siswa: "Siswa Test",
    });
  });

  test("mengembalikan 500 jika proses reject gagal", async () => {
    dbSequence([detailPending], new Error("Database Error"));

    const response = await request(app).put("/pembayaran/reject/1").send({
      catatan: "Bukti tidak valid",
    });

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      message: "Gagal menolak pembayaran",
      error: "Database Error",
    });
  });

  test("mengembalikan 400 jika affectedRows bernilai 0", async () => {
    dbSequence([detailPending], {
      affectedRows: 0,
    });

    const response = await request(app).put("/pembayaran/reject/1").send({
      catatan: "Bukti tidak valid",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      message: "Pembayaran tidak ditemukan atau sudah diproses",
    });
  });

  test("berhasil menolak pembayaran dengan catatan", async () => {
    dbSequence([detailPending], {
      affectedRows: 1,
    });

    const response = await request(app).put("/pembayaran/reject/1").send({
      catatan: "Bukti pembayaran tidak sesuai",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "Pembayaran ditolak",
      nama_siswa: "Siswa Test",
    });
  });

  test("tetap berhasil jika log reject gagal", async () => {
    logAktivitas.mockImplementationOnce(() => {
      throw new Error("Log Error");
    });

    dbSequence([detailPending], {
      affectedRows: 1,
    });

    const response = await request(app).put("/pembayaran/reject/1").send({
      catatan: "Bukti tidak valid",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe("Pembayaran ditolak");
  });
});
