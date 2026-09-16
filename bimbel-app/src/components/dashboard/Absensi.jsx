import { useEffect, useState } from "react";
import FormAbsensi from "./FormAbsensi";
import "./Absensi.css";

const API_URL = "http://localhost:3000";

export default function Absensi() {
  const [abJadwal, setAbJadwal] = useState([]);
  const [abFilteredJadwal, setAbFilteredJadwal] = useState([]);
  const [abSelectedJadwal, setAbSelectedJadwal] = useState(null);

  const [abFilterKelas, setAbFilterKelas] = useState("");
  const [abFilterMapel, setAbFilterMapel] = useState("");
  const [abFilterHari, setAbFilterHari] = useState("");

  const [abLoading, setAbLoading] = useState(true);

  // =====================================================
  // AMBIL DATA JADWAL
  // =====================================================

  useEffect(() => {
    abFetchJadwal();
  }, []);

  const abFetchJadwal = async () => {
    try {
      setAbLoading(true);

      const res = await fetch(`${API_URL}/jadwal`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data jadwal");
      }

      let data = await res.json();

      if (!Array.isArray(data)) {
        data = [];
      }

      // Jadwal terbaru di atas
      data.sort((a, b) => Number(b.id) - Number(a.id));

      console.log("DATA JADWAL ABSENSI:", data);

      setAbJadwal(data);
      setAbFilteredJadwal(data);
    } catch (error) {
      console.error("ERROR FETCH JADWAL:", error);

      alert(
        "Gagal mengambil data jadwal. Pastikan server backend sedang berjalan."
      );

      setAbJadwal([]);
      setAbFilteredJadwal([]);
    } finally {
      setAbLoading(false);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  useEffect(() => {
    let result = [...abJadwal];

    if (abFilterKelas.trim() !== "") {
      result = result.filter((jadwal) =>
        String(jadwal.kelas || jadwal.nama_kelas || "")
          .toLowerCase()
          .includes(abFilterKelas.toLowerCase())
      );
    }

    if (abFilterMapel.trim() !== "") {
      result = result.filter((jadwal) =>
        String(jadwal.mata_pelajaran || "")
          .toLowerCase()
          .includes(abFilterMapel.toLowerCase())
      );
    }

    if (abFilterHari.trim() !== "") {
      result = result.filter((jadwal) =>
        String(jadwal.hari || "")
          .toLowerCase()
          .includes(abFilterHari.toLowerCase())
      );
    }

    setAbFilteredJadwal(result);
  }, [abJadwal, abFilterKelas, abFilterMapel, abFilterHari]);

  // =====================================================
  // PILIH JADWAL
  // =====================================================

  const abPilihJadwal = (jadwal) => {
    if (!jadwal.kelas_id) {
      alert(
        "Jadwal ini belum memiliki kelas_id. Silakan periksa data jadwal di database."
      );
      return;
    }

    console.log("JADWAL DIPILIH:", jadwal);

    setAbSelectedJadwal(jadwal);
  };

  // =====================================================
  // RESET FILTER
  // =====================================================

  const abResetFilter = () => {
    setAbFilterKelas("");
    setAbFilterMapel("");
    setAbFilterHari("");
  };

  // =====================================================
  // KEMBALI KE DATA JADWAL
  // =====================================================

  const abKembaliKeJadwal = () => {
    setAbSelectedJadwal(null);
  };

  // =====================================================
  // FORM ABSENSI
  // =====================================================

  if (abSelectedJadwal) {
    return (
      <div className="ab-page">
        <div className="ab-form-container">
          <FormAbsensi jadwal={abSelectedJadwal} onBack={abKembaliKeJadwal} />
        </div>
      </div>
    );
  }

  // =====================================================
  // DATA JADWAL
  // =====================================================

  return (
    <div className="ab-page">
      {/* HEADER */}
      <div className="ab-header">
        <span className="ab-eyebrow">ABSENSI SISWA</span>

        <h1 className="ab-title">Data Jadwal</h1>

        <p className="ab-subtitle">
          Pilih jadwal untuk mengisi dan mengelola kehadiran siswa.
        </p>
      </div>

      {/* FILTER */}
      <div className="ab-filter-card">
        <div className="ab-filter-header">
          <div>
            <span className="ab-section-label">FILTER</span>

            <h2 className="ab-section-title">Cari Jadwal</h2>

            <p className="ab-section-description">
              Gunakan filter untuk menemukan jadwal dengan lebih cepat.
            </p>
          </div>

          {(abFilterKelas || abFilterMapel || abFilterHari) && (
            <button
              type="button"
              className="ab-reset-button"
              onClick={abResetFilter}
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="ab-filter-grid">
          {/* KELAS */}
          <div className="ab-filter-field">
            <label htmlFor="ab-filter-kelas">Kelas</label>

            <div className="ab-input-wrapper">
              <span className="ab-input-icon">🎓</span>

              <input
                id="ab-filter-kelas"
                type="text"
                value={abFilterKelas}
                placeholder="Cari kelas..."
                onChange={(e) => setAbFilterKelas(e.target.value)}
              />
            </div>
          </div>

          {/* MAPEL */}
          <div className="ab-filter-field">
            <label htmlFor="ab-filter-mapel">Mata Pelajaran</label>

            <div className="ab-input-wrapper">
              <span className="ab-input-icon">📚</span>

              <input
                id="ab-filter-mapel"
                type="text"
                value={abFilterMapel}
                placeholder="Cari mata pelajaran..."
                onChange={(e) => setAbFilterMapel(e.target.value)}
              />
            </div>
          </div>

          {/* HARI */}
          <div className="ab-filter-field">
            <label htmlFor="ab-filter-hari">Hari</label>

            <div className="ab-input-wrapper">
              <span className="ab-input-icon">📅</span>

              <input
                id="ab-filter-hari"
                type="text"
                value={abFilterHari}
                placeholder="Cari hari..."
                onChange={(e) => setAbFilterHari(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="ab-table-card">
        <div className="ab-table-header">
          <div>
            <span className="ab-section-label">DAFTAR JADWAL</span>

            <h2 className="ab-section-title">Jadwal Pembelajaran</h2>
          </div>

          <span className="ab-total-badge">
            {abFilteredJadwal.length} Jadwal
          </span>
        </div>

        <div className="ab-table-wrapper">
          <table className="ab-table">
            <thead>
              <tr>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th>Hari</th>
                <th>Jam</th>
                <th className="ab-action-column">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {abLoading ? (
                <tr>
                  <td colSpan="5" className="ab-empty-cell">
                    <div className="ab-loading">
                      <div className="ab-spinner"></div>

                      <strong>Memuat data jadwal...</strong>

                      <span>Silakan tunggu sebentar.</span>
                    </div>
                  </td>
                </tr>
              ) : abFilteredJadwal.length > 0 ? (
                abFilteredJadwal.map((jadwal) => (
                  <tr key={jadwal.id} className="ab-table-row">
                    <td>
                      <span className="ab-class-badge">
                        {jadwal.kelas || jadwal.nama_kelas || "-"}
                      </span>
                    </td>

                    <td>
                      <div className="ab-subject">
                        <span className="ab-subject-icon">📚</span>

                        <span>{jadwal.mata_pelajaran || "-"}</span>
                      </div>
                    </td>

                    <td>
                      <span className="ab-day">{jadwal.hari || "-"}</span>
                    </td>

                    <td>
                      <span className="ab-time">{jadwal.jam || "-"}</span>
                    </td>

                    <td className="ab-action-cell">
                      <button
                        type="button"
                        className="ab-btn-attendance"
                        onClick={() => abPilihJadwal(jadwal)}
                      >
                        <span>✓</span>
                        Isi Absensi
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="ab-empty-cell">
                    <div className="ab-empty">
                      <div className="ab-empty-icon">🔍</div>

                      <strong>Jadwal Tidak Ditemukan</strong>

                      <span>
                        Tidak ada jadwal yang sesuai dengan filter pencarian.
                      </span>

                      <button
                        type="button"
                        className="ab-empty-reset"
                        onClick={abResetFilter}
                      >
                        Reset Pencarian
                      </button>
                    </div>
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
