import { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/auth/forgot-password", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim link reset.");
      }

      setMessage(data.message);
      setEmail("");
    } catch (error) {
      console.log(error);

      setError(error.message || "Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-icon">🔐</div>

        <div className="forgot-password-header">
          <h1>Lupa Password?</h1>

          <p>
            Masukkan email yang terdaftar untuk mendapatkan link reset password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {error && <div className="forgot-error">{error}</div>}

          {message && <div className="forgot-success">{message}</div>}

          <button type="submit" className="forgot-submit" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>

        <div className="back-login">
          <Link to="/login">← Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
}
