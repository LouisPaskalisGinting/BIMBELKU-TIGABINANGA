const request = require("supertest");
const fs = require("fs");
const path = require("path");

// =====================================================
// MOCK DATABASE
// =====================================================
jest.mock("../db", () => ({
  query: jest.fn(),
}));

// =====================================================
// IMPORT SETELAH MOCK
// =====================================================
const app = require("../server");
const db = require("../db");

// =====================================================
// FOLDER UPLOAD
// =====================================================
const uploadDir = path.join(process.cwd(), "uploads");

// File sementara untuk pengujian upload
const testImagePath = path.join(uploadDir, "about-test.jpg");

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

// =====================================================
// SETUP
// =====================================================
beforeAll(() => {
  // Pastikan folder uploads tersedia
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Buat file dummy untuk test upload
  fs.writeFileSync(testImagePath, "dummy image content");
});

// =====================================================
// CLEANUP
// =====================================================
afterAll(() => {
  // Hapus file dummy
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }

  // Hapus file hasil upload test yang diawali timestamp
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);

    files.forEach((file) => {
      if (file.endsWith(".jpg") || file.endsWith(".png")) {
        // Jangan hapus file yang sudah ada sebelum test
        // selain file dengan pola timestamp hasil test
        if (/^\d+\.(jpg|png)$/i.test(file)) {
          const filePath = path.join(uploadDir, file);

          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            // Abaikan jika file sudah tidak tersedia
          }
        }
      }
    });
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  db.query.mockReset();
});

// =====================================================
// GET /about
// =====================================================
describe("GET /about", () => {
  test("berhasil mengambil data about", async () => {
    const data = {
      id: 1,
      title: "Tentang Bimbelku",
      description: "Deskripsi tentang Bimbelku",
      image: "/uploads/about.jpg",
    };

    dbSuccess([data]);

    const response = await request(app).get("/about");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(data);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      "SELECT * FROM about_section LIMIT 1",
      expect.any(Function)
    );
  });

  test("mengembalikan error 500 jika database gagal", async () => {
    dbError("Gagal mengambil data about");

    const response = await request(app).get("/about");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});
  });

  test("mengembalikan undefined jika data about kosong", async () => {
    dbSuccess([]);

    const response = await request(app).get("/about");

    expect(response.status).toBe(200);
  });
});

// =====================================================
// PUT /about/:id TANPA GAMBAR
// =====================================================
describe("PUT /about/:id - tanpa upload gambar", () => {
  test("berhasil mengupdate about tanpa mengganti gambar", async () => {
    const oldData = {
      id: 1,
      title: "Tentang Lama",
      description: "Deskripsi Lama",
      image: "/uploads/about-lama.jpg",
    };

    // Query SELECT
    dbSuccess([oldData]);

    // Query UPDATE
    dbSuccess({ affectedRows: 1 });

    const response = await request(app)
      .put("/about/1")
      .field("title", "Tentang Baru")
      .field("description", "Deskripsi Baru");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "About berhasil diupdate",
    });

    expect(db.query).toHaveBeenCalledTimes(2);

    // Memastikan gambar lama tetap digunakan
    expect(db.query.mock.calls[1][1]).toEqual([
      "Tentang Baru",
      "Deskripsi Baru",
      "/uploads/about-lama.jpg",
      "1",
    ]);
  });

  test("mengembalikan error 500 jika SELECT data about gagal", async () => {
    dbError("Gagal SELECT about");

    const response = await request(app)
      .put("/about/1")
      .field("title", "Tentang Baru")
      .field("description", "Deskripsi Baru");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});

    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("mengembalikan error 500 jika UPDATE about gagal", async () => {
    const oldData = {
      id: 1,
      title: "Tentang Lama",
      description: "Deskripsi Lama",
      image: "/uploads/about-lama.jpg",
    };

    // SELECT berhasil
    dbSuccess([oldData]);

    // UPDATE gagal
    dbError("Gagal UPDATE about");

    const response = await request(app)
      .put("/about/1")
      .field("title", "Tentang Baru")
      .field("description", "Deskripsi Baru");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});

    expect(db.query).toHaveBeenCalledTimes(2);
  });
});

// =====================================================
// PUT /about/:id DENGAN GAMBAR
// =====================================================
describe("PUT /about/:id - dengan upload gambar", () => {
  test("berhasil mengupdate about dan mengganti gambar", async () => {
    const oldData = {
      id: 1,
      title: "Tentang Lama",
      description: "Deskripsi Lama",
      image: "/uploads/about-lama.jpg",
    };

    // SELECT
    dbSuccess([oldData]);

    // UPDATE
    dbSuccess({ affectedRows: 1 });

    const response = await request(app)
      .put("/about/1")
      .field("title", "Tentang Dengan Gambar")
      .field("description", "Deskripsi dengan gambar")
      .attach("image", testImagePath);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "About berhasil diupdate",
    });

    expect(db.query).toHaveBeenCalledTimes(2);

    // Ambil parameter UPDATE
    const updateParams = db.query.mock.calls[1][1];

    expect(updateParams[0]).toBe("Tentang Dengan Gambar");
    expect(updateParams[1]).toBe("Deskripsi dengan gambar");

    // Gambar harus diganti dengan /uploads/...
    expect(updateParams[2]).toMatch(/^\/uploads\/\d+\.jpg$/);

    expect(updateParams[3]).toBe("1");
  });

  test("mengembalikan error 500 jika UPDATE gagal setelah upload gambar", async () => {
    const oldData = {
      id: 1,
      title: "Tentang Lama",
      description: "Deskripsi Lama",
      image: "/uploads/about-lama.jpg",
    };

    // SELECT berhasil
    dbSuccess([oldData]);

    // UPDATE gagal
    dbError("Gagal UPDATE setelah upload");

    const response = await request(app)
      .put("/about/1")
      .field("title", "Tentang Baru")
      .field("description", "Deskripsi Baru")
      .attach("image", testImagePath);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({});

    expect(db.query).toHaveBeenCalledTimes(2);
  });
});

// =====================================================
// TEST ID
// =====================================================
describe("PUT /about/:id - variasi ID", () => {
  test("tetap memproses ID string sesuai route", async () => {
    const oldData = {
      id: 10,
      title: "Tentang",
      description: "Deskripsi",
      image: "/uploads/about.jpg",
    };

    dbSuccess([oldData]);
    dbSuccess({ affectedRows: 1 });

    const response = await request(app)
      .put("/about/10")
      .field("title", "Tentang 10")
      .field("description", "Deskripsi 10");

    expect(response.status).toBe(200);

    expect(db.query.mock.calls[1][1][3]).toBe("10");
  });
});
