const jwt = require("jsonwebtoken");

// =====================================================
// MOCK JWT
// =====================================================

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// HELPER REQUEST & RESPONSE
// =====================================================

const createReq = (authorization) => ({
  headers: {
    ...(authorization !== undefined ? { authorization } : {}),
  },
});

const createRes = () => {
  const res = {};

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
};

// =====================================================
// TEST
// =====================================================

describe("authMiddleware", () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();

    // Gunakan secret yang biasa digunakan middleware
    process.env.JWT_SECRET = "secret_test";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  // ===================================================
  // 1. TOKEN TIDAK DITEMUKAN
  // ===================================================

  test("mengembalikan 401 jika authorization header tidak ada", () => {
    const req = createReq();
    const res = createRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Token tidak ditemukan",
    });

    expect(next).not.toHaveBeenCalled();

    expect(jwt.verify).not.toHaveBeenCalled();
  });

  // ===================================================
  // 2. FORMAT TOKEN TIDAK VALID
  // ===================================================

  test("mengembalikan 401 jika format token bukan Bearer", () => {
    const req = createReq("Basic abc123");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Format token tidak valid",
    });

    expect(next).not.toHaveBeenCalled();

    expect(jwt.verify).not.toHaveBeenCalled();
  });

  // ===================================================
  // 3. TOKEN KOSONG
  // ===================================================

  test("mengembalikan 401 jika token setelah Bearer kosong", () => {
    const req = createReq("Bearer ");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Token tidak ditemukan",
    });

    expect(next).not.toHaveBeenCalled();

    expect(jwt.verify).not.toHaveBeenCalled();
  });

  // ===================================================
  // 4. TOKEN VALID
  // ===================================================

  test("memanggil next dan menyimpan user jika token valid", () => {
    const decodedUser = {
      id: 1,
      nama: "Admin Test",
      role: "admin",
    };

    jwt.verify.mockReturnValue(decodedUser);

    const req = createReq("Bearer token_valid");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("token_valid", "secret_test");

    expect(req.user).toEqual(decodedUser);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  // ===================================================
  // 5. TOKEN TIDAK VALID
  // ===================================================

  test("mengembalikan 401 jika jwt.verify menghasilkan error", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const req = createReq("Bearer token_invalid");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("token_invalid", "secret_test");

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Token tidak valid atau sudah expired",
    });

    expect(next).not.toHaveBeenCalled();
  });

  // ===================================================
  // 6. TOKEN EXPIRED
  // ===================================================

  test("mengembalikan 401 jika token sudah expired", () => {
    const expiredError = new Error("jwt expired");
    expiredError.name = "TokenExpiredError";

    jwt.verify.mockImplementation(() => {
      throw expiredError;
    });

    const req = createReq("Bearer token_expired");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Token tidak valid atau sudah expired",
    });

    expect(next).not.toHaveBeenCalled();
  });

  // ===================================================
  // 7. SECRET DARI ENV
  // ===================================================

  test("menggunakan JWT_SECRET dari environment variable", () => {
    process.env.JWT_SECRET = "jwt_secret_dari_env";

    jwt.verify.mockReturnValue({
      id: 10,
      role: "admin",
    });

    const req = createReq("Bearer token_env");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("token_env", "jwt_secret_dari_env");

    expect(next).toHaveBeenCalled();
  });

  // ===================================================
  // 8. FALLBACK SECRET
  // ===================================================

  test("menggunakan secret fallback jika JWT_SECRET tidak tersedia", () => {
    delete process.env.JWT_SECRET;

    jwt.verify.mockReturnValue({
      id: 20,
      role: "admin",
    });

    const req = createReq("Bearer token_fallback");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "token_fallback",
      "secret_bimbelku"
    );

    expect(next).toHaveBeenCalled();
  });

  // ===================================================
  // 9. TOKEN DENGAN PAYLOAD LENGKAP
  // ===================================================

  test("menyimpan seluruh payload JWT ke req.user", () => {
    const decodedUser = {
      id: 5,
      nama: "Tentor Test",
      email: "tentor@test.com",
      role: "tentor",
    };

    jwt.verify.mockReturnValue(decodedUser);

    const req = createReq("Bearer token_lengkap");
    const res = createRes();

    authMiddleware(req, res, next);

    expect(req.user).toEqual({
      id: 5,
      nama: "Tentor Test",
      email: "tentor@test.com",
      role: "tentor",
    });

    expect(next).toHaveBeenCalledTimes(1);
  });
});
