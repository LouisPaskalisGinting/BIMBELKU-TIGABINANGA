import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./ResetPassword.css";

export default function ResetPassword() {
  const { token } = useParams();

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // ==============================
    // VALIDASI TOKEN
    // ==============================

    if (!token) {
      setError("Token reset password tidak ditemukan.");
      return;
    }

    // ==============================
    // VALIDASI PASSWORD
    // ==============================

    if (!password) {
      setError("Password baru wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal terdiri dari 6 karakter.");
      return;
    }

    if (!confirmPassword) {
      setError("Konfirmasi password wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          token: token,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengubah password.");
      }

      setMessage(data.message || "Password berhasil diperbarui.");

      setPassword("");
      setConfirmPassword("");

      // ==============================
      // KEMBALI KE LOGIN
      // ==============================

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      console.error("ERROR RESET PASSWORD:", err);

      setError(err.message || "Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        {/* ICON */}

        <div className="reset-password-icon">🔐</div>

        {/* HEADER */}

        <div className="reset-password-header">
          <h1>Reset Password</h1>

          <p>Masukkan password baru untuk akun Bimbelku Anda.</p>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          {/* PASSWORD */}

          <div className="form-group">
            <label htmlFor="password">Password Baru</label>

            <input
              id="password"
              type="password"
              placeholder="Masukkan password baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* KONFIRMASI */}

          <div className="form-group">
            <label htmlFor="confirmPassword">Konfirmasi Password</label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* ERROR */}

          {error && <div className="reset-error">{error}</div>}

          {/* SUCCESS */}

          {message && <div className="reset-success">{message}</div>}

          {/* BUTTON */}

          <button type="submit" className="reset-submit" disabled={loading}>
            {loading ? "Memproses..." : "Simpan Password Baru"}
          </button>
        </form>

        {/* LOGIN */}

        <div className="back-login">
          <Link to="/login">← Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
}
