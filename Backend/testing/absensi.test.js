const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn(),
}));

const db = require("../db");
const app = require("../server");

// ======================================================
// HELPER MOCK DATABASE
// ======================================================

const dbSuccess = (result) => {
  db.query.mockImplementationOnce((sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
    }

    callback(null, result);
  });
};

const dbError = (message = "Database error") => {
  db.query.mockImplementationOnce((sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
    }

    callback(new Error(message));
  });
};

const dbSequence = (...results) => {
  results.forEach((result) => {
    if (result instanceof Error) {
      dbError(result.message);
    } else {
      dbSuccess(result);
    }
  });
};

// ======================================================
// DATA TEST
// ======================================================

const jadwal = {
  id: 1,
  kelas_id: 10,
  mata_pelajaran: "Matematika",
  hari: "Senin",
  jam: "10:00:00",
  nama_kelas: "Kelas A",
};

const siswa = [
  {
    id: 101,
    nama: "Andi",
    kelas_id: 10,
    status: "approved",
  },
  {
    id: 102,
    nama: "Budi",
    kelas_id: 10,
    status: "approved",
  },
];

const absensi = [
  {
    id: 1,
    jadwal_id: 1,
    siswa_id: 101,
    tanggal: "2026-08-20",
    status: "alpha",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  db.query.mockReset();
});

// ======================================================
// POST /absensi/generate
// ======================================================

describe("POST /absensi/generate", () => {
  test("400 jika jadwal_id tidak diisi", async () => {
    const res = await request(app).post("/absensi/generate").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("jadwal_id wajib diisi");
  });

  test("400 jika jadwal_id null", async () => {
    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: null,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("jadwal_id wajib diisi");
  });

  test("400 jika jadwal_id berupa string kosong", async () => {
    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: "",
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(400);
  });

  test("400 jika jadwal_id bukan angka", async () => {
    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: "abc",
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(400);
  });

  test("400 jika tanggal bukan string", async () => {
    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: 123,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Format tanggal tidak valid. Gunakan YYYY-MM-DD"
    );
  });

  test("400 jika format tanggal salah", async () => {
    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "20-08-2026",
    });

    expect(res.status).toBe(400);
  });

  test("400 jika tanggal tidak valid secara kalender", async () => {
    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-02-30",
    });

    expect(res.status).toBe(400);
  });

  test("400 jika bulan tidak sesuai", async () => {
    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-13-01",
    });

    expect(res.status).toBe(400);
  });

  test("berhasil menggunakan tanggal valid", async () => {
    dbSequence([jadwal], siswa, [], { affectedRows: 2 });

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exists).toBe(false);
    expect(res.body.jumlah_siswa).toBe(2);
  });

  test("menggunakan tanggal WIB jika tanggal tidak dikirim", async () => {
    dbSequence([jadwal], siswa, [], { affectedRows: 2 });

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
    });

    expect(res.status).toBe(200);
    expect(res.body.tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("500 jika database jadwal error", async () => {
    dbError("Jadwal database error");

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal mengambil data jadwal");
  });

  test("404 jika jadwal tidak ditemukan", async () => {
    dbSuccess([]);

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 999,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Jadwal tidak ditemukan");
  });

  test("400 jika jadwal belum memiliki kelas_id", async () => {
    dbSuccess([
      {
        ...jadwal,
        kelas_id: null,
      },
    ]);

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Jadwal belum memiliki kelas_id");
  });

  test("500 jika database siswa error", async () => {
    dbSequence([jadwal], new Error("Siswa database error"));

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal mengambil data siswa");
  });

  test("404 jika tidak ada siswa approved dan nama kelas tersedia", async () => {
    dbSequence([jadwal], []);

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("Kelas A");
  });

  test("404 jika tidak ada siswa dan nama kelas tidak tersedia", async () => {
    dbSequence(
      [
        {
          ...jadwal,
          nama_kelas: null,
        },
      ],
      []
    );

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("10");
  });

  test("500 jika pengecekan absensi gagal", async () => {
    dbSequence([jadwal], siswa, new Error("Check absensi error"));

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal mengecek absensi");
  });

  test("berhasil jika absensi sudah tersedia", async () => {
    dbSequence([jadwal], siswa, [{ id: 1 }]);

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);
    expect(res.body.jumlah_siswa).toBe(2);
  });

  test("500 jika insert absensi gagal", async () => {
    dbSequence([jadwal], siswa, [], new Error("Insert error"));

    const res = await request(app).post("/absensi/generate").send({
      jadwal_id: 1,
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal membuat data absensi");
  });
});

// ======================================================
// GET /absensi/by-jadwal/:jadwal_id
// ======================================================

describe("GET /absensi/by-jadwal/:jadwal_id", () => {
  test("400 jika jadwal_id tidak valid", async () => {
    const res = await request(app).get("/absensi/by-jadwal/abc").query({
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("jadwal_id tidak valid");
  });

  test("400 jika tanggal tidak valid", async () => {
    const res = await request(app).get("/absensi/by-jadwal/1").query({
      tanggal: "20-08-2026",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Format tanggal tidak valid. Gunakan YYYY-MM-DD"
    );
  });

  test("berhasil mengambil absensi berdasarkan jadwal", async () => {
    dbSuccess(absensi);

    const res = await request(app).get("/absensi/by-jadwal/1").query({
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(absensi);
  });

  test("berhasil dengan tanggal WIB jika query tanggal tidak diberikan", async () => {
    dbSuccess([]);

    const res = await request(app).get("/absensi/by-jadwal/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("500 jika database error", async () => {
    dbError("Get absensi error");

    const res = await request(app).get("/absensi/by-jadwal/1").query({
      tanggal: "2026-08-20",
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal mengambil data absensi");
  });
});

// ======================================================
// PUT /absensi/:id
// ======================================================

describe("PUT /absensi/:id", () => {
  test("400 jika ID tidak valid", async () => {
    const res = await request(app).put("/absensi/abc").send({
      status: "hadir",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ID absensi tidak valid");
  });

  test("400 jika status tidak diisi", async () => {
    const res = await request(app).put("/absensi/1").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Status wajib diisi");
  });

  test("400 jika status bukan string", async () => {
    const res = await request(app).put("/absensi/1").send({
      status: 123,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Status tidak valid");
  });

  test("400 jika status tidak termasuk pilihan", async () => {
    const res = await request(app).put("/absensi/1").send({
      status: "terlambat",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Status tidak valid");
  });

  test("berhasil update status dan normalisasi input", async () => {
    dbSuccess({
      affectedRows: 1,
    });

    const res = await request(app).put("/absensi/1").send({
      status: "  HADIR  ",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Status absensi berhasil diupdate",
      status: "hadir",
    });
  });

  test("404 jika data absensi tidak ditemukan", async () => {
    dbSuccess({
      affectedRows: 0,
    });

    const res = await request(app).put("/absensi/999").send({
      status: "hadir",
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Data absensi tidak ditemukan");
  });

  test("500 jika update database gagal", async () => {
    dbError("Update absensi error");

    const res = await request(app).put("/absensi/1").send({
      status: "hadir",
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal mengupdate status absensi");
  });
});

// ======================================================
// GET /absensi/siswa/:id
// ======================================================

describe("GET /absensi/siswa/:id", () => {
  test("400 jika ID siswa tidak valid", async () => {
    const res = await request(app).get("/absensi/siswa/abc");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ID siswa tidak valid");
  });

  test("berhasil mengambil absensi siswa", async () => {
    dbSuccess(absensi);

    const res = await request(app).get("/absensi/siswa/101");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(absensi);
  });

  test("500 jika database gagal", async () => {
    dbError("Database siswa error");

    const res = await request(app).get("/absensi/siswa/101");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal mengambil data absensi siswa");
  });
});
