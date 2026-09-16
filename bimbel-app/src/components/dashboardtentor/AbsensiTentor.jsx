import { useEffect, useMemo, useState } from "react";
import FormAbsensi from "../dashboard/FormAbsensi";
import "./AbsensiTentor.css";
import "./Absensi.css";

export default function AbsensiTentor() {
  const [jadwal, setJadwal] = useState([]);
  const [selectedJadwal, setSelectedJadwal] = useState(null);

  const [filterKelas, setFilterKelas] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [filterHari, setFilterHari] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJadwalTentor();
  }, []);

  const fetchJadwalTentor = async () => {
    try {
      setLoading(true);
      setError("");

      const userData = localStorage.getItem("user");

      if (!userData) {
        setError("Data tentor tidak ditemukan. Silakan login kembali.");
        return;
      }

      const user = JSON.parse(userData);

      if (!user?.id) {
        setError("ID tentor tidak ditemukan. Silakan login kembali.");
        return;
      }

      const res = await fetch(`http://localhost:3000/jadwal/tentor/${user.id}`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data jadwal tentor");
      }

      const data = await res.json();

      const jadwalData = Array.isArray(data) ? data : [];

      jadwalData.sort((a, b) => Number(b.id) - Number(a.id));

      setJadwal(jadwalData);
    } catch (err) {
      console.error("ERROR FETCH JADWAL TENTOR:", err);

      setError(
        "Gagal mengambil data jadwal. Pastikan backend sedang berjalan."
      );

      setJadwal([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredJadwal = useMemo(() => {
    return jadwal.filter((j) => {
      const kelas = String(j.kelas || j.nama_kelas || "").toLowerCase();

      const mapel = String(j.mata_pelajaran || j.mapel || "").toLowerCase();

      const hari = String(j.hari || "").toLowerCase();

      const cocokKelas = kelas.includes(filterKelas.toLowerCase());
      const cocokMapel = mapel.includes(filterMapel.toLowerCase());
      const cocokHari = hari.includes(filterHari.toLowerCase());

      return cocokKelas && cocokMapel && cocokHari;
    });
  }, [jadwal, filterKelas, filterMapel, filterHari]);

  const pilihJadwal = (j) => {
    if (!j.kelas_id) {
      alert(
        "Jadwal ini belum memiliki kelas_id. Silakan cek data jadwal di database."
      );
      return;
    }

    setSelectedJadwal(j);
  };

  const resetFilter = () => {
    setFilterKelas("");
    setFilterMapel("");
    setFilterHari("");
  };

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
  // FORM ABSENSI
  // =====================================================

  if (selectedJadwal) {
    return (
      <div className="absensi-tentor-page">
        <div className="absensi-form-header">
          <button
            className="btn-back-absensi"
            onClick={() => setSelectedJadwal(null)}
          >
            ← Kembali
          </button>

          <div>
            <h1>Pengisian Absensi Siswa</h1>
            <p>Silakan periksa data jadwal sebelum mengisi kehadiran siswa.</p>
          </div>
        </div>

        <div className="jadwal-info-card">
          <div className="jadwal-info-header">
            <div className="jadwal-info-icon">📚</div>

            <div>
              <h2>
                {selectedJadwal.kelas || selectedJadwal.nama_kelas || "Kelas"}
              </h2>

              <p>
                {selectedJadwal.mata_pelajaran ||
                  selectedJadwal.mapel ||
                  "Mata Pelajaran"}
              </p>
            </div>
          </div>

          <div className="jadwal-info-grid">
            <div className="info-item">
              <span>Hari</span>
              <strong>{selectedJadwal.hari || "-"}</strong>
            </div>

            <div className="info-item">
              <span>Waktu</span>
              <strong>{tampilJam(selectedJadwal)}</strong>
            </div>

            <div className="info-item">
              <span>Kelas ID</span>
              <strong>{selectedJadwal.kelas_id || "-"}</strong>
            </div>

            <div className="info-item">
              <span>Jadwal ID</span>
              <strong>{selectedJadwal.id || "-"}</strong>
            </div>
          </div>
        </div>

        <div className="form-absensi-card">
          <FormAbsensi
            jadwal={selectedJadwal}
            onBack={() => setSelectedJadwal(null)}
          />
        </div>
      </div>
    );
  }

  // =====================================================
  // HALAMAN DAFTAR JADWAL
  // =====================================================

  return (
    <div className="absensi-tentor-page">
      <div className="page-header-absensi">
        <div>
          <span className="page-label">PANEL TENTOR</span>

          <h1>Absensi Siswa</h1>

          <p>Kelola dan catat kehadiran siswa berdasarkan jadwal mengajar.</p>
        </div>

        <div className="header-total">
          <span>Total Jadwal</span>
          <strong>{jadwal.length}</strong>
        </div>
      </div>

      <div className="filter-card-tentor">
        <div className="filter-title">
          <div>
            <h2>Filter Jadwal</h2>
            <p>Gunakan filter untuk menemukan jadwal yang ingin diabsen.</p>
          </div>

          {(filterKelas || filterMapel || filterHari) && (
            <button className="btn-reset-filter" onClick={resetFilter}>
              Reset Filter
            </button>
          )}
        </div>

        <div className="filter-grid-tentor">
          <div className="input-group-tentor">
            <label>Kelas</label>

            <div className="input-with-icon">
              <span>🏫</span>

              <input
                type="text"
                placeholder="Cari kelas..."
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group-tentor">
            <label>Mata Pelajaran</label>

            <div className="input-with-icon">
              <span>📚</span>

              <input
                type="text"
                placeholder="Cari mata pelajaran..."
                value={filterMapel}
                onChange={(e) => setFilterMapel(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group-tentor">
            <label>Hari</label>

            <div className="input-with-icon">
              <span>📅</span>

              <input
                type="text"
                placeholder="Cari hari..."
                value={filterHari}
                onChange={(e) => setFilterHari(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="table-card-tentor">
        <div className="table-header-tentor">
          <div>
            <h2>Daftar Jadwal Mengajar</h2>

            <p>
              Menampilkan <strong>{filteredJadwal.length}</strong> dari{" "}
              <strong>{jadwal.length}</strong> jadwal.
            </p>
          </div>

          <button className="btn-refresh-tentor" onClick={fetchJadwalTentor}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="loading-spinner"></div>

            <h3>Memuat jadwal...</h3>

            <p>Mohon tunggu sebentar.</p>
          </div>
        ) : error ? (
          <div className="state-box error-state">
            <div className="state-icon">⚠️</div>

            <h3>Data tidak dapat dimuat</h3>

            <p>{error}</p>

            <button className="btn-retry" onClick={fetchJadwalTentor}>
              Coba Lagi
            </button>
          </div>
        ) : filteredJadwal.length === 0 ? (
          <div className="state-box">
            <div className="state-icon">📭</div>

            <h3>Jadwal tidak ditemukan</h3>

            <p>
              Tidak terdapat jadwal yang sesuai dengan filter yang digunakan.
            </p>

            <button className="btn-retry" onClick={resetFilter}>
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="table-responsive-tentor">
            <table className="absensi-tentor-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kelas</th>
                  <th>Mata Pelajaran</th>
                  <th>Hari</th>
                  <th>Waktu</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredJadwal.map((j, index) => (
                  <tr key={j.id}>
                    <td>
                      <span className="number-cell">{index + 1}</span>
                    </td>

                    <td>
                      <div className="kelas-cell">
                        <div className="kelas-icon">🏫</div>

                        <div>
                          <strong>{j.kelas || j.nama_kelas || "-"}</strong>

                          <small>ID: {j.kelas_id || "-"}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="mapel-cell">
                        {j.mata_pelajaran || j.mapel || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="hari-badge">{j.hari || "-"}</span>
                    </td>

                    <td>
                      <span className="jam-cell">🕐 {tampilJam(j)}</span>
                    </td>

                    <td>
                      <span className="status-ready">● Siap Diabsen</span>
                    </td>

                    <td>
                      <button
                        className="btn-isi-absensi"
                        onClick={() => pilihJadwal(j)}
                      >
                        <span>✓</span>
                        Isi Absensi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
