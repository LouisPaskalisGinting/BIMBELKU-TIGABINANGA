import React, { useEffect, useState } from "react";
import "./DashboardTentor.css";

export default function DashboardTentor() {
  const [user, setUser] = useState(null);
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // AMBIL USER LOGIN
  // =====================================================

  useEffect(() => {
    try {
      const userStorage = localStorage.getItem("user");

      if (!userStorage) {
        window.location.href = "/login";
        return;
      }

      const userLogin = JSON.parse(userStorage);

      setUser(userLogin);

      fetchJadwalTentor(userLogin.id);
    } catch (error) {
      console.error("ERROR USER LOGIN:", error);

      window.location.href = "/login";
    }
  }, []);

  // =====================================================
  // AMBIL JADWAL TENTOR
  // =====================================================

  const fetchJadwalTentor = async (tentorId) => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/jadwal/tentor/${tentorId}`
      );

      if (!res.ok) {
        throw new Error("Gagal mengambil jadwal tentor");
      }

      const data = await res.json();

      const jadwalData = Array.isArray(data) ? data : [];

      jadwalData.sort((a, b) => b.id - a.id);

      setJadwal(jadwalData);
    } catch (error) {
      console.error("ERROR FETCH JADWAL TENTOR:", error);

      setJadwal([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HARI INI
  // =====================================================

  const hariIni = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
  });

  // =====================================================
  // JADWAL HARI INI
  // =====================================================

  const jadwalHariIni = jadwal.filter(
    (j) => (j.hari || "").toLowerCase().trim() === hariIni.toLowerCase().trim()
  );

  // =====================================================
  // TOTAL KELAS
  // =====================================================

  const totalKelas = new Set(
    jadwal.map((j) => j.kelas || j.nama_kelas || j.kelas_nama).filter(Boolean)
  ).size;

  // =====================================================
  // TOTAL MAPEL
  // =====================================================

  const totalMapel = new Set(
    jadwal
      .map((j) => j.mata_pelajaran || j.mapel || j.nama_mapel)
      .filter(Boolean)
  ).size;

  // =====================================================
  // FORMAT JAM
  // =====================================================

  const tampilJam = (j) => {
    if (j.jam) {
      return j.jam;
    }

    if (j.jam_mulai && j.jam_selesai) {
      return `${j.jam_mulai} - ${j.jam_selesai}`;
    }

    return "-";
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="dashboard-content">
      {/* =================================================
          WELCOME CARD
      ================================================= */}

      <div className="welcome-card">
        <div>
          <h1>Dashboard Tentor</h1>

          <p>
            Selamat datang,{" "}
            <strong>{user?.nama || user?.name || "Tentor"}</strong>
          </p>
        </div>

        <div className="date-box">
          <span>{hariIni}</span>

          <strong>{new Date().toLocaleDateString("id-ID")}</strong>
        </div>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="summary-grid">
        <div className="summary-card">
          <span>Total Jadwal</span>

          <h2>{jadwal.length}</h2>

          <p>Seluruh jadwal mengajar</p>
        </div>

        <div className="summary-card">
          <span>Jadwal Hari Ini</span>

          <h2>{jadwalHariIni.length}</h2>

          <p>Jadwal mengajar hari ini</p>
        </div>

        <div className="summary-card">
          <span>Total Kelas</span>

          <h2>{totalKelas}</h2>

          <p>Kelas yang diajar</p>
        </div>

        <div className="summary-card">
          <span>Total Mapel</span>

          <h2>{totalMapel}</h2>

          <p>Mata pelajaran aktif</p>
        </div>
      </div>

      {/* =================================================
          JADWAL HARI INI
      ================================================= */}

      <div className="dashboard-table-card">
        <div className="table-header">
          <div>
            <h2>Jadwal Hari Ini</h2>

            <p>Daftar jadwal mengajar tentor pada hari ini.</p>
          </div>
        </div>

        {loading ? (
          <p className="empty-text">Memuat jadwal...</p>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>No</th>

                  <th>Hari</th>

                  <th>Mata Pelajaran</th>

                  <th>Kelas</th>

                  <th>Waktu</th>
                </tr>
              </thead>

              <tbody>
                {jadwalHariIni.length > 0 ? (
                  jadwalHariIni.map((j, index) => (
                    <tr key={j.id}>
                      <td>{index + 1}</td>

                      <td>{j.hari || "-"}</td>

                      <td>
                        {j.mata_pelajaran || j.mapel || j.nama_mapel || "-"}
                      </td>

                      <td>{j.kelas || j.nama_kelas || j.kelas_nama || "-"}</td>

                      <td>{tampilJam(j)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-table">
                      Tidak ada jadwal mengajar hari ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
