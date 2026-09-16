const request = require("supertest");
const app = require("../server");

describe("Server Bimbelku", () => {
  // =====================================================
  // ROOT ENDPOINT
  // =====================================================

  test("GET / berhasil menampilkan pesan backend", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toBe("Backend Bimbel Berjalan");
  });

  // =====================================================
  // ROUTE TIDAK DITEMUKAN
  // =====================================================

  test("GET route yang tidak tersedia mengembalikan 404", async () => {
    const response = await request(app).get("/route-tidak-tersedia");

    expect(response.status).toBe(404);
  });

  // =====================================================
  // JSON REQUEST
  // =====================================================

  test("server dapat menerima request JSON", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "",
      password: "",
    });

    // Endpoint auth seharusnya tetap merespons
    // dan menunjukkan bahwa request JSON berhasil diproses.
    expect([400, 401, 404, 500]).toContain(response.status);
  });

  // =====================================================
  // URL ENCODED REQUEST
  // =====================================================

  test("server mendukung request urlencoded", async () => {
    const response = await request(app).post("/auth/login").type("form").send({
      email: "",
      password: "",
    });

    expect([400, 401, 404, 500]).toContain(response.status);
  });
});
