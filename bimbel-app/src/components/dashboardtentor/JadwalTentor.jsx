import { useEffect, useState } from "react";
import "./JadwalTentor.css";

export default function JadwalTentor() {
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJadwalTentor();
  }, []);

  const fetchJadwalTentor = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      console.log("USER LOGIN:", user);

      if (!user || !user.id) {
        alert("Data tentor tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:3000/jadwal/tentor/${user.id}`);

      if (!res.ok) {
        throw new Error("Gagal mengambil jadwal tentor");
      }

      const data = await res.json();

      console.log("JADWAL TENTOR:", data);

      setJadwal(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ERROR FETCH JADWAL TENTOR:", error);
      alert("Gagal mengambil jadwal tentor. Pastikan backend berjalan.");
      setJadwal([]);
    } finally {
      setLoading(false);
    }
  };

  const tampilJam = (j) => {
    if (j.jam) return j.jam;

    if (j.jam_mulai && j.jam_selesai) {
      return `${j.jam_mulai} - ${j.jam_selesai}`;
    }

    return "-";
  };

  return (
    <div className="jadwal-tentor-page">
      <div className="jadwal-tentor-header">
        <h2>📅 Jadwal Mengajar</h2>
        <p>Daftar jadwal mengajar tentor pada sistem bimbingan belajar.</p>
      </div>

      <div className="jadwal-tentor-card">
        {loading ? (
          <div className="loading-box">Memuat jadwal...</div>
        ) : (
          <div className="table-wrapper">
            <table className="jadwal-tentor-table">
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
                {jadwal.length > 0 ? (
                  jadwal.map((j, index) => (
                    <tr key={j.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="badge-hari">{j.hari || "-"}</span>
                      </td>
                      <td className="mapel">
                        {j.mata_pelajaran || j.mapel || "-"}
                      </td>
                      <td>{j.kelas || j.nama_kelas || "-"}</td>
                      <td className="waktu">{tampilJam(j)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-data">
                      Tidak ada jadwal mengajar
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
