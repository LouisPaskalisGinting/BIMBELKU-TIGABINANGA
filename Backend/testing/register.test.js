process.env.NODE_ENV = "test";

const request = require("supertest");
const fs = require("fs");
const path = require("path");

// ======================================================
// MOCK DATABASE
// ======================================================

jest.mock("../db", () => ({
  query: jest.fn(),
}));

// ======================================================
// IMPORT
// ======================================================

const app = require("../server");
const db = require("../db");

// ======================================================
// FILE TEST UNTUK MULTER
// ======================================================

const testUploadDir = path.join(__dirname, "../uploads");

const testFile = path.join(__dirname, "test-bukti-pembayaran.jpg");

// Buat folder uploads jika belum ada
if (!fs.existsSync(testUploadDir)) {
  fs.mkdirSync(testUploadDir, {
    recursive: true,
  });
}

// Buat file dummy untuk kebutuhan upload
if (!fs.existsSync(testFile)) {
  fs.writeFileSync(testFile, "dummy bukti pembayaran");
}

// ======================================================
// DATA TEST
// ======================================================

const validData = {
  nama: "Siswa Test",
  kelas: "Kelas A",
  asal_sekolah: "SMA Test",
  no_hp: "081234567890",
  nama_orangtua: "Orangtua Test",
  no_hp_orangtua: "081234567891",
  program_id: "1",
  email: "siswa.test@gmail.com",
  password: "password123",
  nominal_pembayaran: "500000",
};

const program = [
  {
    id: 1,
    harga: 1000000,
  },
];

// ======================================================
// HELPER DATABASE
// ======================================================

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
// RESET
// ======================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ======================================================
// VALIDASI DATA WAJIB
// ======================================================

describe("POST /register/siswa - Validasi", () => {
  test("gagal jika data wajib tidak lengkap", async () => {
    const res = await request(app)
      .post("/register/siswa")
      .field("nama", "Siswa Test");

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Semua data wajib diisi.");
  });

  test("gagal jika nomor HP siswa tidak valid", async () => {
    const res = await request(app)
      .post("/register/siswa")
      .field({
        ...validData,
        no_hp: "abc123",
      })
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe(
      "Nomor HP harus terdiri dari 10-15 digit angka."
    );
  });

  test("gagal jika nomor HP orang tua tidak valid", async () => {
    const res = await request(app)
      .post("/register/siswa")
      .field({
        ...validData,
        no_hp_orangtua: "abc123",
      })
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe(
      "Nomor HP Orang Tua harus terdiri dari 10-15 digit angka."
    );
  });

  test("gagal jika format email tidak valid", async () => {
    const res = await request(app)
      .post("/register/siswa")
      .field({
        ...validData,
        email: "email-tidak-valid",
      })
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Format email tidak valid.");
  });

  test("gagal jika nominal pembayaran tidak valid", async () => {
    const res = await request(app)
      .post("/register/siswa")
      .field({
        ...validData,
        nominal_pembayaran: "-100",
      })
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Nominal pembayaran tidak valid.");
  });

  test("gagal jika nominal pembayaran bukan bilangan bulat", async () => {
    const res = await request(app)
      .post("/register/siswa")
      .field({
        ...validData,
        nominal_pembayaran: "100.5",
      })
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Nominal pembayaran tidak valid.");
  });

  test("gagal jika bukti pembayaran tidak diupload", async () => {
    const res = await request(app).post("/register/siswa").field(validData);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe("Bukti pembayaran wajib diupload.");
  });
});

// ======================================================
// CEK EMAIL
// ======================================================

describe("POST /register/siswa - Cek Email", () => {
  test("gagal jika database error saat cek email", async () => {
    dbError(new Error("Email Database Error"));

    const res = await request(app)
      .post("/register/siswa")
      .field(validData)
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal mengambil data program.");
  });

  test("gagal jika email sudah terdaftar", async () => {
    dbSuccess([
      {
        id: 10,
      },
    ]);

    const res = await request(app)
      .post("/register/siswa")
      .field(validData)
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe(
      "Email sudah terdaftar, silakan gunakan email lain."
    );
  });
});

// ======================================================
// CEK PROGRAM
// ======================================================

describe("POST /register/siswa - Program", () => {
  test("gagal jika database error saat mengambil program", async () => {
    dbSequence([], new Error("Program Database Error"));

    const res = await request(app)
      .post("/register/siswa")
      .field(validData)
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal mengambil data program.");
  });

  test("gagal jika program tidak ditemukan", async () => {
    dbSequence([], []);

    const res = await request(app)
      .post("/register/siswa")
      .field(validData)
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(404);

    expect(res.body.message).toBe("Program tidak ditemukan.");
  });

  test("gagal jika nominal melebihi total tagihan", async () => {
    dbSequence(
      [],
      [
        {
          id: 1,
          harga: 100000,
        },
      ]
    );

    const res = await request(app)
      .post("/register/siswa")
      .field({
        ...validData,
        nominal_pembayaran: "200000",
      })
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(400);

    expect(res.body.message).toBe(
      "Nominal pembayaran tidak boleh lebih besar dari total tagihan."
    );
  });
});

// ======================================================
// INSERT SISWA
// ======================================================

describe("POST /register/siswa - Insert Siswa", () => {
  test("gagal ketika insert siswa database error", async () => {
    dbSequence([], program, new Error("Insert Siswa Error"));

    const res = await request(app)
      .post("/register/siswa")
      .field(validData)
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal register siswa.");
  });
});

// ======================================================
// INSERT PEMBAYARAN
// ======================================================

describe("POST /register/siswa - Pembayaran", () => {
  test("gagal ketika insert pembayaran database error", async () => {
    dbSequence(
      [],
      program,
      {
        insertId: 100,
      },
      new Error("Insert Pembayaran Error")
    );

    const res = await request(app)
      .post("/register/siswa")
      .field(validData)
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal membuat data pembayaran.");
  });
});

// ======================================================
// INSERT DETAIL PEMBAYARAN
// ======================================================

describe("POST /register/siswa - Detail Pembayaran", () => {
  test("gagal ketika insert detail pembayaran database error", async () => {
    dbSequence(
      [],
      program,
      {
        insertId: 100,
      },
      {
        insertId: 200,
      },
      new Error("Insert Detail Error")
    );

    const res = await request(app)
      .post("/register/siswa")
      .field(validData)
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(500);

    expect(res.body.message).toBe("Gagal menyimpan detail pembayaran.");
  });
});

// ======================================================
// REGISTER BERHASIL
// ======================================================

describe("POST /register/siswa - Berhasil", () => {
  test("berhasil melakukan registrasi siswa", async () => {
    dbSequence(
      [],
      program,
      {
        insertId: 100,
      },
      {
        insertId: 200,
      },
      {
        insertId: 300,
      }
    );

    const res = await request(app)
      .post("/register/siswa")
      .field({
        ...validData,
        email: "  SISWA.TEST@GMAIL.COM  ",
      })
      .attach("bukti_pembayaran", testFile);

    expect(res.statusCode).toBe(201);

    expect(res.body.message).toBe(
      "Pendaftaran berhasil. Pembayaran menunggu verifikasi admin."
    );
  });
});

// ======================================================
// OUTER CATCH
// ======================================================

describe("Register Siswa - Outer Catch", () => {
  test("mengembalikan Server Error jika terjadi error sinkron", () => {
    const registerSiswa = require("../routes/Register").registerSiswa;

    const req = {};

    Object.defineProperty(req, "body", {
      get: () => {
        throw new Error("Simulated Server Error");
      },
    });

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    registerSiswa(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: "Server Error.",
    });
  });
});

// ======================================================
// CLEANUP FILE TEST
// ======================================================

afterAll(() => {
  try {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  } catch (error) {
    // Tidak perlu menggagalkan pengujian
  }
});
