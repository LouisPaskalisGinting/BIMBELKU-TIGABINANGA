import { useEffect, useState } from "react";
import "./AbsensiSiswa.css";

export default function AbsensiSiswa() {
  const [absensi, setAbsensi] = useState([]);
  const [loading, setLoading] = useState(true);

  const siswa = JSON.parse(localStorage.getItem("siswa")) || {};
  const siswaId = siswa.id;

  console.log("DATA SISWA:", siswa);
  console.log("SISWA ID:", siswaId);

  useEffect(() => {
    const fetchAbsensi = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/absensi/siswa/${siswaId}`
        );
        const data = await res.json();
        setAbsensi(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    if (siswaId) fetchAbsensi();
  }, [siswaId]);

  const getStatusClass = (status) => {
    if (status === "Hadir") return "status-hadir";
    if (status === "Izin") return "status-izin";
    if (status === "Sakit") return "status-sakit";
    if (status === "Alfa") return "status-alfa";
    return "";
  };

  return (
    <div className="absensi-siswa-container">
      <div className="absensi-siswa-card">
        <h2 className="absensi-siswa-title">Absensi Saya</h2>

        {loading ? (
          <p className="absensi-loading">Loading...</p>
        ) : (
          <div className="absensi-table-wrapper">
            <table className="absensi-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Mapel</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {absensi.length > 0 ? (
                  absensi.map((a) => (
                    <tr key={a.id}>
                      <td>{a.tanggal}</td>
                      <td>{a.mata_pelajaran}</td>
                      <td className={getStatusClass(a.status)}>{a.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="absensi-empty">
                      Belum ada absensi
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
