import { useEffect, useState } from "react";
import "./DashboardSiswa.css";

export default function DashboardSiswa() {
  const [loading, setLoading] = useState(true);
  const [siswa, setSiswa] = useState(null);

  const userLogin = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!userLogin) {
      window.location.href = "/";
      return;
    }

    fetchDataSiswa();
  }, []);

  const fetchDataSiswa = async () => {
    try {
      const headers = { "Content-Type": "application/json" };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Gunakan /siswa/me jika token tersedia, atau fallback ke endpoint dashboard dengan query email
      const endpoint = token
        ? "http://localhost:3000/siswa/me"
        : `http://localhost:3000/siswa/dashboard/${
            userLogin.id
          }?email=${encodeURIComponent(userLogin.email || "")}`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers,
      });

      const data = await res.json();

      if (res.ok) {
        setSiswa(data);
        localStorage.setItem("user", JSON.stringify(data));
      } else {
        console.error("Error API:", data.message);
        setSiswa(null);
      }
    } catch (err) {
      console.error("Gagal mengambil data siswa:", err);
      setSiswa(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!siswa) return <div>Data siswa tidak ditemukan</div>;

  return (
    <div className="content">
      <div className="header">
        <h2>Halo, {siswa.nama} 👋</h2>
        <p>Selamat datang di sistem bimbingan belajar</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>📘 Program</h3>
          <p>{siswa.nama_program || "-"}</p>
        </div>

        <div className="card">
          <h3>🏫 Kelas</h3>
          <p>{siswa.nama_kelas || "-"}</p>
        </div>

        <div className="card">
          <h3>📧 Email</h3>
          <p>{siswa.email || "-"}</p>
        </div>

        <div className="card">
          <h3>📊 Status</h3>
          <p className="status-active">
            {siswa.status === "approved" ? "Aktif" : siswa.status || "-"}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>📢 Informasi</h3>
        <p>
          Selamat datang di dashboard siswa. Silakan cek data diri, nilai,
          pembayaran, dan jadwal melalui menu yang tersedia.
        </p>
      </div>
    </div>
  );
}
