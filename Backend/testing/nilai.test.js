// ======================================================
// WHITE BOX TESTING - ROUTE NILAI
// ======================================================

process.env.NODE_ENV = "test";

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
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Untuk menguji req.user?.xxx
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

// ======================================================
// MOCK LOG AKTIVITAS
// ======================================================

jest.mock("../utils/logAktivitas", () => jest.fn());

// ======================================================
// IMPORT
// ======================================================

const request = require("supertest");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const db = require("../db");
const logAktivitas = require("../utils/logAktivitas");
const app = require("../server");

// ======================================================
// KONFIGURASI FILE
// ======================================================

const testingDirectory = __dirname;
const uploadDirectory = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const createdFiles = [];

const uploadFilesBeforeTest = new Set(
  fs.existsSync(uploadDirectory) ? fs.readdirSync(uploadDirectory) : []
);

// ======================================================
// HELPER DATABASE
// ======================================================

function mockDbSuccess(result) {
  db.query.mockImplementationOnce((...args) => {
    const callback = args[args.length - 1];
    callback(null, result);
  });
}

function mockDbError(message = "Database Error") {
  db.query.mockImplementationOnce((...args) => {
    const callback = args[args.length - 1];
    callback(new Error(message), null);
  });
}

// ======================================================
// HELPER EXCEL
// ======================================================

function createExcelFile(fileName, rows) {
  const filePath = path.join(testingDirectory, fileName);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  XLSX.writeFile(workbook, filePath);

  createdFiles.push(filePath);

  return filePath;
}

function createEmptyExcelFile(fileName) {
  const filePath = path.join(testingDirectory, fileName);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  XLSX.writeFile(workbook, filePath);

  createdFiles.push(filePath);

  return filePath;
}

// ======================================================
// HELPER UPLOAD
// ======================================================

function uploadRequest(eventId, filePath) {
  return request(app)
    .post(`/nilai/upload/${eventId}`)
    .set("Authorization", "Bearer test-token")
    .attach("file", filePath);
}

// ======================================================
// BEFORE EACH
// ======================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ======================================================
// 1. GET NILAI SISWA BERDASARKAN EVENT
// ======================================================

describe("GET /nilai/siswa/:event_id/:siswa_id", () => {
  test("berhasil mengambil nilai siswa", async () => {
    const data = [
      {
        id: 1,
        siswa_id: 10,
        event_id: 5,
        nilai: 90,
        nama: "Siswa Test",
        nama_event: "Try Out Test",
      },
    ];

    mockDbSuccess(data);

    const response = await request(app).get("/nilai/siswa/5/10");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(data);
  });

  test("gagal karena database error", async () => {
    mockDbError("Database nilai siswa error");

    const response = await request(app).get("/nilai/siswa/5/10");

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Gagal mengambil data nilai siswa");
    expect(response.body.error).toBe("Database nilai siswa error");
  });
});

// ======================================================
// 2. GET SELURUH NILAI SISWA
// ======================================================

describe("GET /nilai/siswa/:siswa_id", () => {
  test("berhasil mengambil seluruh nilai siswa", async () => {
    const data = [
      {
        id: 1,
        siswa_id: 10,
        event_id: 5,
        nilai: 90,
        nama: "Siswa Test",
        nama_event: "Try Out",
      },
    ];

    mockDbSuccess(data);

    const response = await request(app).get("/nilai/siswa/10");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(data);
  });

  test("gagal karena database error", async () => {
    mockDbError("Database seluruh nilai error");

    const response = await request(app).get("/nilai/siswa/10");

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Gagal mengambil seluruh nilai siswa");
    expect(response.body.error).toBe("Database seluruh nilai error");
  });
});

// ======================================================
// 3. GET FILE NILAI
// ======================================================

describe("GET /nilai/files/:event_id", () => {
  test("berhasil mengambil file nilai", async () => {
    const data = [
      {
        id: 1,
        event_id: 5,
        nama_file: "nilai.xlsx",
        path_file: "nilai.xlsx",
      },
    ];

    mockDbSuccess(data);

    const response = await request(app).get("/nilai/files/5");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(data);
  });

  test("gagal karena database error", async () => {
    mockDbError("Database file error");

    const response = await request(app).get("/nilai/files/5");

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Gagal mengambil file nilai");
  });
});

// ======================================================
// 4. GET NILAI EVENT
// ======================================================

describe("GET /nilai/event/:event_id", () => {
  test("berhasil mengambil nilai berdasarkan event", async () => {
    const data = [
      {
        id: 1,
        siswa_id: 10,
        event_id: 5,
        nilai: 90,
        nama: "Siswa Test",
        email: "siswa@test.com",
        user_id: 20,
        nama_event: "Try Out",
      },
    ];

    mockDbSuccess(data);

    const response = await request(app).get("/nilai/event/5");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(data);
  });

  test("gagal karena database error", async () => {
    mockDbError("Database event error");

    const response = await request(app).get("/nilai/event/5");

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      "Gagal mengambil nilai berdasarkan event"
    );
  });
});

// ======================================================
// 5. AUTHENTICATION
// ======================================================

describe("POST /nilai/upload/:event_id - Authentication", () => {
  test("gagal upload tanpa token", async () => {
    const response = await request(app).post("/nilai/upload/5");

    expect(response.statusCode).toBe(401);
    expect(db.query).not.toHaveBeenCalled();
  });

  test("berhasil ketika req.user tidak tersedia", async () => {
    const filePath = createExcelFile("nilai-no-user.xlsx", [
      {
        nama: "",
        nilai: 80,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbSuccess({
      insertId: 1,
    });

    const response = await request(app)
      .post("/nilai/upload/5")
      .set("Authorization", "Bearer test-token")
      .set("x-test-no-user", "true")
      .attach("file", filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

// ======================================================
// 6. VALIDASI FILE
// ======================================================

describe("POST /nilai/upload/:event_id - File", () => {
  test("gagal jika file tidak ditemukan", async () => {
    const response = await request(app)
      .post("/nilai/upload/5")
      .set("Authorization", "Bearer test-token");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("File Excel tidak ditemukan");
  });

  test("gagal jika file bukan XLSX", async () => {
    const filePath = path.join(testingDirectory, "nilai-salah.txt");

    fs.writeFileSync(filePath, "file bukan excel");

    createdFiles.push(filePath);

    const response = await request(app)
      .post("/nilai/upload/5")
      .set("Authorization", "Bearer test-token")
      .attach("file", filePath);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("File harus berformat Excel (.xlsx)");
  });
});

// ======================================================
// 7. EVENT
// ======================================================

describe("POST /nilai/upload/:event_id - Event", () => {
  test("gagal jika event tidak ditemukan", async () => {
    const filePath = createExcelFile("nilai-event-not-found.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 90,
      },
    ]);

    mockDbSuccess([]);

    const response = await uploadRequest(999, filePath);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Event tidak ditemukan");
  });

  test("gagal ketika query event error", async () => {
    const filePath = createExcelFile("nilai-event-error.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 90,
      },
    ]);

    mockDbError("Event database error");

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      "Terjadi kesalahan saat memproses file nilai"
    );
  });
});

// ======================================================
// 8. EXCEL
// ======================================================

describe("POST /nilai/upload/:event_id - Excel", () => {
  test("gagal jika Excel tidak memiliki sheet", async () => {
    const filePath = createExcelFile("nilai-no-sheet.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 80,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    const spy = jest.spyOn(XLSX, "readFile").mockReturnValueOnce({
      SheetNames: [],
      Sheets: {},
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Sheet Excel tidak ditemukan");

    spy.mockRestore();
  });

  test("gagal jika Excel tidak memiliki data", async () => {
    const filePath = createEmptyExcelFile("nilai-empty.xlsx");

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("File Excel tidak memiliki data");
  });

  test("gagal jika terjadi error membaca Excel", async () => {
    const filePath = createExcelFile("nilai-read-error.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 80,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    const spy = jest.spyOn(XLSX, "readFile").mockImplementationOnce(() => {
      throw new Error("Excel rusak");
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      "Terjadi kesalahan saat memproses file nilai"
    );
    expect(response.body.error).toBe("Excel rusak");

    spy.mockRestore();
  });
});

// ======================================================
// 9. VALIDASI DATA
// ======================================================

describe("POST /nilai/upload/:event_id - Validasi Data", () => {
  test("memproses nama siswa kosong", async () => {
    const filePath = createExcelFile("nilai-nama-kosong.xlsx", [
      {
        nama: "",
        nilai: 80,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbSuccess({
      insertId: 1,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.data_tidak_valid[0].alasan).toBe("Nama siswa kosong");
  });

  test("memproses nilai kosong", async () => {
    const filePath = createExcelFile("nilai-kosong.xlsx", [
      {
        nama: "Siswa Test",
        nilai: "",
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbSuccess({
      insertId: 1,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.data_tidak_valid[0].alasan).toBe("Nilai kosong");
  });

  test("memproses nilai bukan angka", async () => {
    const filePath = createExcelFile("nilai-string.xlsx", [
      {
        nama: "Siswa Test",
        nilai: "abc",
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbSuccess({
      insertId: 1,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.data_tidak_valid[0].alasan).toBe("Nilai bukan angka");
  });

  test("memproses nilai di luar rentang", async () => {
    const filePath = createExcelFile("nilai-invalid-range.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 120,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbSuccess({
      insertId: 1,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.data_tidak_valid[0].alasan).toBe(
      "Nilai harus berada pada rentang 0-100"
    );
  });
});

// ======================================================
// 10. SISWA
// ======================================================

describe("POST /nilai/upload/:event_id - Siswa", () => {
  test("berhasil jika siswa tidak ditemukan", async () => {
    const filePath = createExcelFile("nilai-siswa-not-found.xlsx", [
      {
        nama: "Siswa Tidak Ada",
        nilai: 90,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbSuccess([]);

    mockDbSuccess({
      insertId: 1,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.jumlah_tidak_ditemukan).toBe(1);
  });

  test("gagal ketika query siswa error", async () => {
    const filePath = createExcelFile("nilai-siswa-error.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 90,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbError("Database siswa error");

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Database siswa error");
  });
});

// ======================================================
// 11. INSERT NILAI
// ======================================================

describe("POST /nilai/upload/:event_id - INSERT", () => {
  test("berhasil INSERT nilai baru", async () => {
    const filePath = createExcelFile("nilai-insert.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 87,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Try Out Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 10,
        user_id: 20,
        nama: "Siswa Test",
        email: "siswa@test.com",
      },
    ]);

    mockDbSuccess([]);

    mockDbSuccess({
      insertId: 100,
    });

    mockDbSuccess({
      insertId: 200,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.jumlah_data).toBe(1);

    expect(response.body.data_berhasil[0]).toEqual({
      siswa_id: 10,
      nama: "Siswa Test",
      nilai: 87,
    });
  });

  test("gagal ketika INSERT nilai error", async () => {
    const filePath = createExcelFile("nilai-insert-error.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 87,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Try Out Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 10,
        user_id: 20,
        nama: "Siswa Test",
      },
    ]);

    mockDbSuccess([]);

    mockDbError("INSERT nilai gagal");

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("INSERT nilai gagal");
  });
});

// ======================================================
// 12. UPDATE NILAI
// ======================================================

describe("POST /nilai/upload/:event_id - UPDATE", () => {
  test("berhasil UPDATE nilai existing", async () => {
    const filePath = createExcelFile("nilai-update.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 95,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Try Out Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 10,
        user_id: 20,
        nama: "Siswa Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 99,
      },
    ]);

    mockDbSuccess({
      affectedRows: 1,
    });

    mockDbSuccess({
      insertId: 200,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.jumlah_data).toBe(1);
    expect(response.body.data_berhasil[0].nilai).toBe(95);
  });

  test("gagal ketika UPDATE nilai error", async () => {
    const filePath = createExcelFile("nilai-update-error.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 95,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Try Out Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 10,
        user_id: 20,
        nama: "Siswa Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 99,
      },
    ]);

    mockDbError("UPDATE nilai gagal");

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("UPDATE nilai gagal");
  });
});

// ======================================================
// 13. FILE NILAI
// ======================================================

describe("POST /nilai/upload/:event_id - File Nilai", () => {
  test("gagal ketika INSERT file_nilai error", async () => {
    const filePath = createExcelFile("nilai-file-error.xlsx", [
      {
        nama: "",
        nilai: 90,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Event Test",
      },
    ]);

    mockDbError("INSERT file_nilai gagal");

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("INSERT file_nilai gagal");
  });
});

// ======================================================
// 14. LOG AKTIVITAS
// ======================================================

describe("POST /nilai/upload/:event_id - Log", () => {
  test("berhasil menyimpan log aktivitas", async () => {
    const filePath = createExcelFile("nilai-log-success.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 89,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Try Out Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 10,
        user_id: 20,
        nama: "Siswa Test",
      },
    ]);

    mockDbSuccess([]);

    mockDbSuccess({
      insertId: 100,
    });

    mockDbSuccess({
      insertId: 200,
    });

    logAktivitas.mockResolvedValueOnce(true);

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);

    expect(logAktivitas).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 1,
        nama_user: "Admin Test",
        role: "admin",
        aktivitas: "Upload Nilai",
      })
    );
  });

  test("tetap berhasil jika log aktivitas gagal", async () => {
    const filePath = createExcelFile("nilai-log-error.xlsx", [
      {
        nama: "Siswa Test",
        nilai: 88,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Try Out Test",
      },
    ]);

    mockDbSuccess([
      {
        id: 10,
        user_id: 20,
        nama: "Siswa Test",
      },
    ]);

    mockDbSuccess([]);

    mockDbSuccess({
      insertId: 100,
    });

    mockDbSuccess({
      insertId: 200,
    });

    logAktivitas.mockRejectedValueOnce(new Error("Log gagal"));

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

// ======================================================
// 15. DATA CAMPURAN
// ======================================================

describe("POST /nilai/upload/:event_id - Multiple Rows", () => {
  test("berhasil memproses data valid dan tidak valid", async () => {
    const filePath = createExcelFile("nilai-multiple.xlsx", [
      {
        nama: "",
        nilai: 80,
      },
      {
        nama: "Siswa Tidak Ada",
        nilai: 90,
      },
    ]);

    mockDbSuccess([
      {
        id: 5,
        judul: "Try Out",
      },
    ]);

    mockDbSuccess([]);

    mockDbSuccess({
      insertId: 200,
    });

    const response = await uploadRequest(5, filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.jumlah_data).toBe(0);
    expect(response.body.jumlah_data_tidak_valid).toBe(1);
    expect(response.body.jumlah_tidak_ditemukan).toBe(1);
  });
});

// ======================================================
// CLEANUP
// ======================================================

afterAll(() => {
  // Hapus file Excel yang dibuat test
  for (const filePath of createdFiles) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Gagal menghapus file test:", filePath, error.message);
    }
  }

  // Hapus file hasil multer
  try {
    if (fs.existsSync(uploadDirectory)) {
      const currentFiles = fs.readdirSync(uploadDirectory);

      for (const fileName of currentFiles) {
        if (!uploadFilesBeforeTest.has(fileName)) {
          const filePath = path.join(uploadDirectory, fileName);

          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.error(
              "Gagal menghapus upload test:",
              fileName,
              error.message
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Gagal cleanup uploads:", error.message);
  }

  console.log("");
  console.log("======================================");
  console.log("CLEANUP TEST NILAI SELESAI");
  console.log("======================================");
  console.log("");
});
