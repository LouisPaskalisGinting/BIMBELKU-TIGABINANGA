const db = require("../db");

// =====================================================
// MOCK DATABASE
// =====================================================

jest.mock("../db", () => ({
  query: jest.fn(),
}));

// =====================================================
// IMPORT FUNCTION
// =====================================================

const logAktivitas = require("../utils/logAktivitas");

// =====================================================
// RESET MOCK
// =====================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// =====================================================
// TEST
// =====================================================

describe("Utils - logAktivitas", () => {
  // ===================================================
  // SUCCESS
  // ===================================================

  test("berhasil menyimpan log aktivitas", async () => {
    const resultDb = {
      insertId: 10,
      affectedRows: 1,
    };

    db.query.mockImplementation((sql, values, callback) => {
      callback(null, resultDb);
    });

    const result = await logAktivitas({
      user_id: 1,
      nama_user: "Admin Test",
      role: "admin",
      aktivitas: "Tambah Data",
      keterangan: "Menambahkan data siswa",
    });

    expect(result).toEqual(resultDb);

    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, values] = db.query.mock.calls[0];

    expect(sql).toContain("INSERT INTO log_aktivitas");

    expect(values).toEqual([
      1,
      "Admin Test",
      "admin",
      "Tambah Data",
      "Menambahkan data siswa",
    ]);
  });

  // ===================================================
  // DATABASE ERROR
  // ===================================================

  test("gagal menyimpan log ketika database error", async () => {
    const dbError = new Error("Database gagal");

    db.query.mockImplementation((sql, values, callback) => {
      callback(dbError, null);
    });

    await expect(
      logAktivitas({
        user_id: 1,
        nama_user: "Admin Test",
        role: "admin",
        aktivitas: "Tambah Data",
        keterangan: "Testing error",
      })
    ).rejects.toThrow("Database gagal");

    expect(db.query).toHaveBeenCalledTimes(1);
  });

  // ===================================================
  // DEFAULT USER_ID
  // ===================================================

  test("menggunakan null ketika user_id tidak diberikan", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 11,
      });
    });

    await logAktivitas({
      nama_user: "Admin Test",
      role: "admin",
      aktivitas: "Login",
      keterangan: "User berhasil login",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[0]).toBeNull();
  });

  test("menggunakan null ketika user_id bernilai null", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 12,
      });
    });

    await logAktivitas({
      user_id: null,
      nama_user: "Admin Test",
      role: "admin",
      aktivitas: "Login",
      keterangan: "Login",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[0]).toBeNull();
  });

  // ===================================================
  // DEFAULT NAMA_USER
  // ===================================================

  test("menggunakan '-' ketika nama_user tidak diberikan", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 13,
      });
    });

    await logAktivitas({
      user_id: 1,
      role: "admin",
      aktivitas: "Login",
      keterangan: "Login",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[1]).toBe("-");
  });

  test("menggunakan '-' ketika nama_user bernilai null", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 14,
      });
    });

    await logAktivitas({
      user_id: 1,
      nama_user: null,
      role: "admin",
      aktivitas: "Login",
      keterangan: "Login",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[1]).toBe("-");
  });

  // ===================================================
  // DEFAULT ROLE
  // ===================================================

  test("menggunakan '-' ketika role tidak diberikan", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 15,
      });
    });

    await logAktivitas({
      user_id: 1,
      nama_user: "Admin Test",
      aktivitas: "Login",
      keterangan: "Login",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[2]).toBe("-");
  });

  test("menggunakan '-' ketika role bernilai null", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 16,
      });
    });

    await logAktivitas({
      user_id: 1,
      nama_user: "Admin Test",
      role: null,
      aktivitas: "Login",
      keterangan: "Login",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[2]).toBe("-");
  });

  // ===================================================
  // DEFAULT AKTIVITAS
  // ===================================================

  test("menggunakan '-' ketika aktivitas tidak diberikan", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 17,
      });
    });

    await logAktivitas({
      user_id: 1,
      nama_user: "Admin Test",
      role: "admin",
      keterangan: "Testing",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[3]).toBe("-");
  });

  test("menggunakan '-' ketika aktivitas bernilai null", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 18,
      });
    });

    await logAktivitas({
      user_id: 1,
      nama_user: "Admin Test",
      role: "admin",
      aktivitas: null,
      keterangan: "Testing",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[3]).toBe("-");
  });

  // ===================================================
  // DEFAULT KETERANGAN
  // ===================================================

  test("menggunakan '-' ketika keterangan tidak diberikan", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 19,
      });
    });

    await logAktivitas({
      user_id: 1,
      nama_user: "Admin Test",
      role: "admin",
      aktivitas: "Login",
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[4]).toBe("-");
  });

  test("menggunakan '-' ketika keterangan bernilai null", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 20,
      });
    });

    await logAktivitas({
      user_id: 1,
      nama_user: "Admin Test",
      role: "admin",
      aktivitas: "Login",
      keterangan: null,
    });

    const [, values] = db.query.mock.calls[0];

    expect(values[4]).toBe("-");
  });

  // ===================================================
  // SEMUA NILAI KOSONG
  // ===================================================

  test("menggunakan nilai default untuk seluruh parameter kosong", async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, {
        insertId: 21,
      });
    });

    await logAktivitas({});

    const [, values] = db.query.mock.calls[0];

    expect(values).toEqual([null, "-", "-", "-", "-"]);
  });

  // ===================================================
  // MEMASTIKAN INSERT ID
  // ===================================================

  test("mengembalikan result dari database termasuk insertId", async () => {
    const resultDb = {
      insertId: 999,
      affectedRows: 1,
    };

    db.query.mockImplementation((sql, values, callback) => {
      callback(null, resultDb);
    });

    const result = await logAktivitas({
      user_id: 5,
      nama_user: "User Test",
      role: "tentor",
      aktivitas: "Update Nilai",
      keterangan: "Mengubah nilai siswa",
    });

    expect(result.insertId).toBe(999);
    expect(result.affectedRows).toBe(1);
  });
});
