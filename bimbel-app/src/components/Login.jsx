import { useState } from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // =====================================================
    // VALIDASI
    // =====================================================

    if (!email.trim() || !password) {
      alert("Email dan password wajib diisi!");
      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // LOGIN
      // =====================================================

      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await res.json();

      console.log("=================================");
      console.log("DATA LOGIN:", data);
      console.log("STATUS LOGIN:", res.status);
      console.log("=================================");

      // =====================================================
      // CEK LOGIN
      // =====================================================

      if (!res.ok) {
        alert(data.message || "Login gagal");
        return;
      }

      // =====================================================
      // CEK TOKEN
      // =====================================================

      if (!data.token) {
        console.error("TOKEN TIDAK DITEMUKAN:", data);

        alert("Login gagal: token tidak diterima dari server.");
        return;
      }

      // =====================================================
      // CEK USER
      // =====================================================

      if (!data.user) {
        console.error("USER TIDAK DITEMUKAN:", data);

        alert("Login gagal: data user tidak ditemukan.");
        return;
      }

      const user = data.user;

      const role = user.role ? String(user.role).trim().toLowerCase() : "";

      console.log("USER LOGIN:", user);
      console.log("USER ID:", user.id);
      console.log("NAMA:", user.nama);
      console.log("EMAIL:", user.email);
      console.log("ROLE:", role);

      // =====================================================
      // HAPUS SESSION LAMA
      // =====================================================

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("siswa");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("siswa_id");

      // =====================================================
      // SIMPAN TOKEN
      // =====================================================

      localStorage.setItem("token", data.token);

      // =====================================================
      // SIMPAN USER
      // =====================================================

      localStorage.setItem("user", JSON.stringify(user));

      // user_id = ID PADA TABEL USER
      localStorage.setItem("user_id", String(user.id));

      // role
      localStorage.setItem("role", role);

      // =====================================================
      // JIKA SISWA
      // =====================================================

      if (role === "siswa") {
        console.log("=================================");
        console.log("MENGAMBIL DATA SISWA");
        console.log("USER ID:", user.id);
        console.log("=================================");

        try {
          const siswaRes = await fetch(
            `http://localhost:3000/siswa/user/${user.id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${data.token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const siswaData = await siswaRes.json();

          console.log("=================================");
          console.log("RESPONSE DATA SISWA");
          console.log("STATUS:", siswaRes.status);
          console.log("DATA:", siswaData);
          console.log("=================================");

          if (!siswaRes.ok) {
            console.error("GAGAL MENGAMBIL DATA SISWA:", siswaData);

            alert(
              siswaData.message ||
                "Data siswa tidak ditemukan berdasarkan akun login."
            );

            return;
          }

          // =================================================
          // CARI OBJECT SISWA
          // =================================================

          let siswa = null;

          if (siswaData.siswa) {
            siswa = siswaData.siswa;
          } else if (siswaData.data) {
            siswa = siswaData.data;
          } else if (Array.isArray(siswaData)) {
            siswa = siswaData[0];
          } else {
            siswa = siswaData;
          }

          // =================================================
          // VALIDASI SISWA
          // =================================================

          if (!siswa || !siswa.id) {
            console.error("DATA SISWA TIDAK VALID:", siswaData);

            alert("Data akun ditemukan, tetapi data siswa tidak ditemukan.");

            return;
          }

          // =================================================
          // CEK ID SISWA
          // =================================================

          console.log("=================================");
          console.log("DATA SISWA BERHASIL DITEMUKAN");
          console.log("SISWA ID:", siswa.id);
          console.log("USER ID:", user.id);
          console.log("NAMA SISWA:", siswa.nama);
          console.log("=================================");

          // =================================================
          // SIMPAN DATA SISWA
          // =================================================

          localStorage.setItem("siswa", JSON.stringify(siswa));

          // =================================================
          // SIMPAN SISWA ID SECARA TERPISAH
          // =================================================

          localStorage.setItem("siswa_id", String(siswa.id));

          // =================================================
          // VERIFIKASI
          // =================================================

          console.log("=================================");
          console.log("LOCAL STORAGE SISWA");
          console.log("user_id:", localStorage.getItem("user_id"));
          console.log("siswa_id:", localStorage.getItem("siswa_id"));
          console.log("siswa:", localStorage.getItem("siswa"));
          console.log("=================================");
        } catch (error) {
          console.error("ERROR MENGAMBIL DATA SISWA:", error);

          alert("Login berhasil, tetapi data siswa gagal diambil.");

          return;
        }
      }

      // =====================================================
      // VALIDASI ROLE
      // =====================================================

      if (!role) {
        console.error("ROLE KOSONG:", user);

        alert("Login berhasil tetapi role user tidak ditemukan.");

        return;
      }

      // =====================================================
      // REDIRECT
      // =====================================================

      console.log("=================================");
      console.log("LOGIN BERHASIL");
      console.log("ROLE:", role);
      console.log("USER ID:", user.id);
      console.log("SISWA ID:", localStorage.getItem("siswa_id"));
      console.log("=================================");

      switch (role) {
        case "admin":
          window.location.href = "/dashboard-admin";
          break;

        case "tentor":
          window.location.href = "/dashboard-tentor";
          break;

        case "siswa":
          window.location.href = "/dashboard-siswa";
          break;

        default:
          console.error("ROLE TIDAK DIKENALI:", role);

          alert(`Role "${role}" tidak dikenali oleh sistem.`);
          break;
      }
    } catch (error) {
      console.error("ERROR LOGIN:", error);

      alert(
        "Tidak bisa terhubung ke server. Pastikan backend sedang berjalan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          {/* =========================
              EMAIL
          ========================= */}

          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          {/* =========================
              PASSWORD
          ========================= */}

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a18.45 18.45 0 0 1 5.06-6.94" />

                  <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19" />

                  <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />

                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* =========================
              LUPA PASSWORD
          ========================= */}

          <p
            className="forgot-password"
            onClick={() => {
              if (!loading) {
                window.location.href = "/forgot-password";
              }
            }}
          >
            Lupa Password?
          </p>

          {/* =========================
              LOGIN
          ========================= */}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
