import { useEffect, useState } from "react";
import "./FormAbsensi.css";

const API_URL = "http://localhost:3000";

export default function FormAbsensi({ jadwal, onBack }) {
  const [absensi, setAbsensi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // TANGGAL HARI INI
  // =====================================================

  const getTanggalHariIni = () => {
    const sekarang = new Date();

    const tahun = sekarang.getFullYear();

    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");

    const tanggal = String(sekarang.getDate()).padStart(2, "0");

    return `${tahun}-${bulan}-${tanggal}`;
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (jadwal?.id) {
      loadData();
    }
  }, [jadwal?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const tanggal = getTanggalHariIni();

      console.log("================================");
      console.log("LOAD ABSENSI");
      console.log("Jadwal ID :", jadwal.id);
      console.log("Tanggal   :", tanggal);
      console.log("================================");

      // =================================================
      // AMBIL ABSENSI
      // =================================================

      let res = await fetch(
        `${API_URL}/absensi/by-jadwal/${jadwal.id}?tanggal=${tanggal}`
      );

      let data = await res.json();

      console.log("DATA ABSENSI:", data);

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil data absensi");
      }

      // =================================================
      // BELUM ADA ABSENSI
      // =================================================

      if (data.length === 0) {
        console.log("Absensi belum ada. Generate...");

        const generateRes = await fetch(`${API_URL}/absensi/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jadwal_id: jadwal.id,
            tanggal: tanggal,
          }),
        });

        const generateData = await generateRes.json();

        console.log("GENERATE ABSENSI:", generateData);

        if (!generateRes.ok) {
          throw new Error(generateData.message || "Gagal membuat absensi");
        }

        // =================================================
        // LOAD ULANG
        // =================================================

        res = await fetch(
          `${API_URL}/absensi/by-jadwal/${jadwal.id}?tanggal=${tanggal}`
        );

        data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Gagal mengambil data absensi");
        }
      }

      setAbsensi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ERROR LOAD ABSENSI:", error);

      alert(error.message);

      setAbsensi([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UBAH STATUS
  // =====================================================

  const handleChange = (id, status) => {
    setAbsensi((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
            }
          : item
      )
    );
  };

  // =====================================================
  // SIMPAN
  // =====================================================

  const simpan = async () => {
    if (absensi.length === 0) {
      alert("Tidak ada data absensi untuk disimpan.");
      return;
    }

    try {
      setSaving(true);

      for (const item of absensi) {
        const res = await fetch(`${API_URL}/absensi/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: item.status,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || `Gagal menyimpan absensi ${item.nama}`
          );
        }
      }

      alert("Absensi berhasil disimpan.");
    } catch (error) {
      console.error("ERROR SIMPAN ABSENSI:", error);

      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // HITUNG STATISTIK
  // =====================================================

  const jumlahHadir = absensi.filter((item) => item.status === "hadir").length;

  const jumlahIzin = absensi.filter((item) => item.status === "izin").length;

  const jumlahSakit = absensi.filter((item) => item.status === "sakit").length;

  const jumlahAlpha = absensi.filter((item) => item.status === "alpha").length;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="form-absensi-container">
      {/* HEADER */}

      <div className="fa-header">
        <button
          type="button"
          className="fa-back-button"
          onClick={onBack}
          disabled={saving}
        >
          ← Kembali
        </button>

        <div className="fa-header-content">
          <span className="fa-eyebrow">ABSENSI SISWA</span>

          <h1>
            {jadwal.kelas || jadwal.nama_kelas || `Kelas ${jadwal.kelas_id}`}
          </h1>

          <p>{jadwal.mata_pelajaran || "Mata pelajaran tidak tersedia"}</p>
        </div>
      </div>

      {/* INFO JADWAL */}

      <div className="fa-info-card">
        <div className="fa-info-item">
          <span className="fa-info-icon">🎓</span>

          <div>
            <small>Kelas</small>

            <strong>{jadwal.kelas || jadwal.nama_kelas || "-"}</strong>
          </div>
        </div>

        <div className="fa-info-item">
          <span className="fa-info-icon">📚</span>

          <div>
            <small>Mata Pelajaran</small>

            <strong>{jadwal.mata_pelajaran || "-"}</strong>
          </div>
        </div>

        <div className="fa-info-item">
          <span className="fa-info-icon">📅</span>

          <div>
            <small>Hari</small>

            <strong>{jadwal.hari || "-"}</strong>
          </div>
        </div>

        <div className="fa-info-item">
          <span className="fa-info-icon">🕐</span>

          <div>
            <small>Jam</small>

            <strong>{jadwal.jam || "-"}</strong>
          </div>
        </div>
      </div>

      {/* STATISTIK */}

      {!loading && absensi.length > 0 && (
        <div className="fa-stat-grid">
          <div className="fa-stat-card">
            <span>👥</span>
            <div>
              <small>Total Siswa</small>
              <strong>{absensi.length}</strong>
            </div>
          </div>

          <div className="fa-stat-card fa-hadir">
            <span>✓</span>
            <div>
              <small>Hadir</small>
              <strong>{jumlahHadir}</strong>
            </div>
          </div>

          <div className="fa-stat-card fa-izin">
            <span>!</span>
            <div>
              <small>Izin</small>
              <strong>{jumlahIzin}</strong>
            </div>
          </div>

          <div className="fa-stat-card fa-sakit">
            <span>+</span>
            <div>
              <small>Sakit</small>
              <strong>{jumlahSakit}</strong>
            </div>
          </div>

          <div className="fa-stat-card fa-alpha">
            <span>×</span>
            <div>
              <small>Alpha</small>
              <strong>{jumlahAlpha}</strong>
            </div>
          </div>
        </div>
      )}

      {/* DATA ABSENSI */}

      <div className="fa-table-card">
        <div className="fa-table-header">
          <div>
            <span className="fa-section-label">DATA KEHADIRAN</span>

            <h2>Daftar Siswa</h2>

            <p>Atur status kehadiran setiap siswa.</p>
          </div>

          {!loading && absensi.length > 0 && (
            <span className="fa-total-badge">{absensi.length} Siswa</span>
          )}
        </div>

        {loading ? (
          <div className="fa-loading">
            <div className="fa-spinner"></div>

            <strong>Memuat data siswa...</strong>

            <span>Silakan tunggu sebentar.</span>
          </div>
        ) : absensi.length === 0 ? (
          <div className="fa-empty">
            <div className="fa-empty-icon">👨‍🎓</div>

            <h3>Tidak Ada Data Siswa</h3>

            <p>Tidak terdapat siswa aktif pada kelas ini.</p>
          </div>
        ) : (
          <>
            <div className="fa-table-wrapper">
              <table className="fa-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>Asal Sekolah</th>
                    <th>Status Kehadiran</th>
                  </tr>
                </thead>

                <tbody>
                  {absensi.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <span className="fa-number">{index + 1}</span>
                      </td>

                      <td>
                        <div className="fa-student">
                          <div className="fa-avatar">
                            {item.nama?.charAt(0)?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <strong>{item.nama || "-"}</strong>

                            <small>ID: {item.siswa_id}</small>
                          </div>
                        </div>
                      </td>

                      <td>{item.asal_sekolah || "-"}</td>

                      <td>
                        <select
                          className={`fa-status-select fa-status-${item.status}`}
                          value={item.status || "alpha"}
                          onChange={(e) =>
                            handleChange(item.id, e.target.value)
                          }
                          disabled={saving}
                        >
                          <option value="hadir">✓ Hadir</option>

                          <option value="izin">! Izin</option>

                          <option value="sakit">+ Sakit</option>

                          <option value="alpha">× Alpha</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}

            <div className="fa-footer">
              <div>
                <span>Perubahan belum disimpan?</span>

                <small>Pastikan status seluruh siswa sudah sesuai.</small>
              </div>

              <button
                type="button"
                className="fa-save-button"
                onClick={simpan}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="fa-button-spinner"></span>
                    Menyimpan...
                  </>
                ) : (
                  <>💾 Simpan Absensi</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
