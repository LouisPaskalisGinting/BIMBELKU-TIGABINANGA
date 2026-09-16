import { useEffect, useState } from "react";
import "./JadwalSiswa.css";

export default function JadwalSiswa() {
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // AMBIL ID SISWA
  // =====================================================

  const getSiswaId = () => {
    // Prioritas 1: localStorage siswa
    try {
      const siswaStorage = localStorage.getItem("siswa");

      if (siswaStorage) {
        const siswa = JSON.parse(siswaStorage);

        if (siswa?.id) {
          return siswa.id;
        }

        if (siswa?.siswa_id) {
          return siswa.siswa_id;
        }
      }
    } catch (err) {
      console.error("Gagal membaca data siswa:", err);
    }

    // Prioritas 2: siswa_id
    const siswaId = localStorage.getItem("siswa_id");

    if (siswaId) {
      return siswaId;
    }

    // Prioritas 3: user
    try {
      const userStorage = localStorage.getItem("user");

      if (userStorage) {
        const user = JSON.parse(userStorage);

        if (user?.siswa_id) {
          return user.siswa_id;
        }
      }
    } catch (err) {
      console.error("Gagal membaca data user:", err);
    }

    return null;
  };

  const siswaId = getSiswaId();

  // =====================================================
  // AMBIL JADWAL SISWA
  // =====================================================

  useEffect(() => {
    const fetchJadwal = async () => {
      if (!siswaId) {
        console.error("ID siswa tidak ditemukan");

        setError("ID siswa tidak ditemukan. Silakan logout dan login kembali.");

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("ID SISWA YANG DIGUNAKAN:", siswaId);

        const res = await fetch(
          `http://localhost:3000/jadwal/siswa/${siswaId}`
        );

        const data = await res.json();

        console.log("STATUS JADWAL SISWA:", res.status);
        console.log("DATA JADWAL SISWA:", data);

        if (!res.ok) {
          throw new Error(data.message || "Gagal mengambil jadwal siswa");
        }

        setJadwal(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("ERROR JADWAL SISWA:", err);

        setError(err.message || "Terjadi kesalahan saat mengambil jadwal");

        setJadwal([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJadwal();
  }, [siswaId]);

  // =====================================================
  // TAMPILAN LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="jadwal-siswa-container">
        <div className="jadwal-siswa-card">
          <h2 className="jadwal-siswa-title">📅 Jadwal Saya</h2>

          <div className="jadwal-empty">Memuat jadwal...</div>
        </div>
      </div>
    );
  }

  // =====================================================
  // TAMPILAN ERROR
  // =====================================================

  if (error) {
    return (
      <div className="jadwal-siswa-container">
        <div className="jadwal-siswa-card">
          <h2 className="jadwal-siswa-title">📅 Jadwal Saya</h2>

          <div className="jadwal-error">{error}</div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="jadwal-siswa-container">
      <div className="jadwal-siswa-card">
        <div className="jadwal-siswa-header">
          <div>
            <h2 className="jadwal-siswa-title">📅 Jadwal Saya</h2>

            <p className="jadwal-siswa-subtitle">
              Jadwal pembelajaran berdasarkan kelas Anda
            </p>
          </div>
        </div>

        <div className="jadwal-table-wrapper">
          <table className="jadwal-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th>Tentor</th>
                <th>Hari</th>
                <th>Jam</th>
              </tr>
            </thead>

            <tbody>
              {jadwal.length > 0 ? (
                jadwal.map((j, index) => (
                  <tr key={j.id}>
                    <td>{index + 1}</td>

                    <td>{j.nama_kelas || j.kelas || "-"}</td>

                    <td className="jadwal-mapel">{j.mata_pelajaran || "-"}</td>

                    <td>{j.tentor || "-"}</td>

                    <td>
                      <span className="jadwal-hari">{j.hari || "-"}</span>
                    </td>

                    <td className="jadwal-jam">{j.jam || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="jadwal-empty">
                    Belum ada jadwal untuk kelas Anda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
