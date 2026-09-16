import { useEffect, useState } from "react";
import "./DataSiswa.css";

export default function DataSiswa() {
  // =====================================================
  // STATE
  // =====================================================

  const [siswa, setSiswa] = useState([]);
  const [pending, setPending] = useState([]);

  const [activeTab, setActiveTab] = useState("siswa");

  const [selectedSiswa, setSelectedSiswa] = useState(null);

  // SEARCH
  const [searchNama, setSearchNama] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const API_URL = "http://localhost:3000";

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // HANDLE UNAUTHORIZED
  // =====================================================

  const handleUnauthorized = () => {
    alert("Sesi login sudah berakhir. Silakan login kembali.");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");

    window.location.href = "/login";
  };

  // =====================================================
  // FETCH AWAL
  // =====================================================

  useEffect(() => {
    fetchSiswa();
    fetchPending();
  }, []);

  // =====================================================
  // GET SISWA APPROVED
  // =====================================================

  const fetchSiswa = async () => {
    try {
      const res = await fetch(`${API_URL}/siswa`);

      const data = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        console.error("ERROR GET SISWA:", data);
        setSiswa([]);
        return;
      }

      setSiswa(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR FETCH SISWA:", err);
      setSiswa([]);
    }
  };

  // =====================================================
  // GET SISWA PENDING
  // =====================================================

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_URL}/siswa/pending`);

      const data = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        console.error("ERROR GET PENDING:", data);
        setPending([]);
        return;
      }

      setPending(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR FETCH PENDING:", err);
      setPending([]);
    }
  };

  // =====================================================
  // SEARCH SISWA BERDASARKAN NAMA
  // =====================================================

  useEffect(() => {
    const keyword = searchNama.trim();

    if (keyword === "") {
      fetchSiswa();
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const res = await fetch(
          `${API_URL}/siswa/search/${encodeURIComponent(keyword)}`
        );

        const data = await res.json();

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!res.ok) {
          console.error("ERROR SEARCH SISWA:", data);
          setSiswa([]);
          return;
        }

        setSiswa(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("ERROR SEARCH SISWA:", err);
        setSiswa([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchNama]);

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const handleClearSearch = () => {
    setSearchNama("");
  };

  // =====================================================
  // LIHAT BUKTI PEMBAYARAN
  // =====================================================

  const handleLihatBukti = (namaFile) => {
    if (!namaFile) {
      alert("Bukti pembayaran belum tersedia.");
      return;
    }

    const url = `${API_URL}/uploads/${namaFile}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // =====================================================
  // APPROVE SISWA
  // =====================================================

  const handleApprove = async (id) => {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    const siswaTarget = pending.find((s) => s.id === id);

    if (!siswaTarget) {
      alert("Data siswa tidak ditemukan.");
      return;
    }

    const yakin = window.confirm(
      `Apakah Anda yakin ingin menyetujui pendaftaran siswa "${siswaTarget.nama}"?\n\nPembayaran pertama siswa juga akan otomatis disetujui.`
    );

    if (!yakin) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/siswa/approve/${id}`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        alert(result.message || "Gagal menyetujui siswa.");
        return;
      }

      alert(
        result.message ||
          "Siswa berhasil disetujui dan pembayaran pertama otomatis disetujui."
      );

      await fetchPending();
      await fetchSiswa();

      setSelectedSiswa(null);
    } catch (err) {
      console.error("ERROR APPROVE SISWA:", err);

      alert("Terjadi kesalahan saat menyetujui siswa.");
    }
  };

  // =====================================================
  // DECLINE / TOLAK SISWA
  // =====================================================

  const handleDecline = async (id) => {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    const siswaTarget = pending.find((s) => s.id === id);

    if (!siswaTarget) {
      alert("Data siswa tidak ditemukan.");
      return;
    }

    const yakin = window.confirm(
      `Apakah Anda yakin ingin menolak pendaftaran siswa "${siswaTarget.nama}"?`
    );

    if (!yakin) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/siswa/${id}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        alert(result.message || "Gagal menolak pendaftaran siswa.");
        return;
      }

      alert(result.message || "Pendaftaran siswa berhasil ditolak.");

      await fetchPending();
      await fetchSiswa();

      if (selectedSiswa?.id === id) {
        setSelectedSiswa(null);
      }
    } catch (err) {
      console.error("ERROR DECLINE SISWA:", err);

      alert("Terjadi kesalahan saat menolak siswa.");
    }
  };

  // =====================================================
  // DELETE SISWA APPROVED
  // =====================================================

  const handleDeleteSiswa = async (id) => {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    const siswaTarget = siswa.find((s) => s.id === id);

    if (!siswaTarget) {
      alert("Data siswa tidak ditemukan.");
      return;
    }

    const yakin = window.confirm(
      `Yakin ingin menghapus siswa "${siswaTarget.nama}"?\n\nData siswa dan akun user siswa akan dihapus.`
    );

    if (!yakin) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/siswa/${id}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        alert(result.message || "Gagal menghapus siswa.");
        return;
      }

      alert(result.message || "Siswa berhasil dihapus.");

      await fetchSiswa();
      await fetchPending();

      if (selectedSiswa?.id === id) {
        setSelectedSiswa(null);
      }
    } catch (err) {
      console.error("ERROR DELETE SISWA:", err);

      alert("Terjadi kesalahan saat menghapus siswa.");
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="ds-page">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="ds-header">
        <div>
          <span className="ds-eyebrow">ADMINISTRATION</span>

          <h1 className="ds-title">Manajemen Siswa</h1>

          <p className="ds-subtitle">
            Kelola data siswa dan permintaan pendaftaran siswa.
          </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* TAB */}
      {/* ================================================= */}

      <div className="ds-tabs">
        <button
          type="button"
          className={`ds-tab ${activeTab === "siswa" ? "ds-tab-active" : ""}`}
          onClick={() => setActiveTab("siswa")}
        >
          Data Siswa
          <span className="ds-tab-count">{siswa.length}</span>
        </button>

        <button
          type="button"
          className={`ds-tab ${activeTab === "pesan" ? "ds-tab-active" : ""}`}
          onClick={() => setActiveTab("pesan")}
        >
          Permintaan
          <span className="ds-tab-count ds-tab-pending">{pending.length}</span>
        </button>
      </div>

      {/* ================================================= */}
      {/* DATA SISWA APPROVED */}
      {/* ================================================= */}

      {activeTab === "siswa" && (
        <section className="ds-card">
          <div className="ds-card-header">
            <div>
              <span className="ds-section-label">DATA TERDAFTAR</span>

              <h2 className="ds-section-title">Daftar Siswa</h2>

              <p className="ds-section-description">
                Daftar siswa yang telah disetujui oleh administrator.
              </p>
            </div>

            {/* SEARCH */}

            <div className="ds-search-wrapper">
              <span className="ds-search-icon">🔍</span>

              <input
                type="text"
                className="ds-search-input"
                placeholder="Cari nama siswa..."
                value={searchNama}
                onChange={(e) => setSearchNama(e.target.value)}
              />

              {searchNama && (
                <button
                  type="button"
                  className="ds-search-clear"
                  onClick={handleClearSearch}
                  title="Hapus pencarian"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* INFO SEARCH */}

          {searchNama && (
            <div className="ds-search-info">
              {searchLoading ? (
                <span>Mencari siswa...</span>
              ) : (
                <span>
                  Hasil pencarian untuk:
                  <strong> "{searchNama}"</strong>
                  {" — "}
                  {siswa.length} siswa ditemukan
                </span>
              )}
            </div>
          )}

          {/* TABLE */}

          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Kelas</th>
                  <th>Program</th>
                  <th className="ds-action-column">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {siswa.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="ds-empty-cell">
                      <div className="ds-empty">
                        <div className="ds-empty-icon">🔍</div>

                        <strong>
                          {searchNama
                            ? "Siswa tidak ditemukan"
                            : "Belum ada data siswa"}
                        </strong>

                        <span>
                          {searchNama
                            ? "Coba gunakan nama yang berbeda."
                            : "Data siswa akan muncul di sini."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  siswa.map((s) => (
                    <tr
                      key={s.id}
                      className="ds-table-row"
                      onClick={() => setSelectedSiswa(s)}
                    >
                      <td>
                        <div className="ds-student-name">
                          <div className="ds-avatar">
                            {s.nama ? s.nama.charAt(0).toUpperCase() : "?"}
                          </div>

                          <span>{s.nama}</span>
                        </div>
                      </td>

                      <td>{s.email || "-"}</td>

                      <td>
                        <span className="ds-class-badge">
                          {s.nama_kelas || "Belum ada kelas"}
                        </span>
                      </td>

                      <td>{s.nama_program || "-"}</td>

                      <td
                        className="ds-action-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="ds-btn-delete"
                          onClick={() => handleDeleteSiswa(s.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================================================= */}
      {/* PERMINTAAN SISWA */}
      {/* ================================================= */}

      {activeTab === "pesan" && (
        <section className="ds-card">
          <div className="ds-card-header">
            <div>
              <span className="ds-section-label">PENDAFTARAN</span>

              <h2 className="ds-section-title">Permintaan Siswa</h2>

              <p className="ds-section-description">
                Periksa dan proses pendaftaran siswa baru.
              </p>
            </div>

            <div className="ds-pending-badge">{pending.length} Pending</div>
          </div>

          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Program</th>
                  <th>Bukti Pembayaran</th>
                  <th className="ds-action-column">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="ds-empty-cell">
                      <div className="ds-empty">
                        <div className="ds-empty-icon">📭</div>

                        <strong>Tidak ada permintaan siswa</strong>

                        <span>Pendaftaran baru akan muncul di sini.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pending.map((s) => (
                    <tr key={s.id} className="ds-table-row">
                      {/* NAMA */}

                      <td onClick={() => setSelectedSiswa(s)}>
                        <div className="ds-student-name">
                          <div className="ds-avatar">
                            {s.nama ? s.nama.charAt(0).toUpperCase() : "?"}
                          </div>

                          <span>{s.nama}</span>
                        </div>
                      </td>

                      {/* EMAIL */}

                      <td>{s.email || "-"}</td>

                      {/* PROGRAM */}

                      <td>{s.nama_program || "-"}</td>

                      {/* ================================================= */}
                      {/* BUKTI PEMBAYARAN */}
                      {/* ================================================= */}

                      <td onClick={(e) => e.stopPropagation()}>
                        {s.bukti_pembayaran ? (
                          <button
                            type="button"
                            className="ds-btn-proof"
                            onClick={() => handleLihatBukti(s.bukti_pembayaran)}
                          >
                            👁 Lihat Bukti
                          </button>
                        ) : (
                          <span className="ds-no-proof">Belum ada bukti</span>
                        )}
                      </td>

                      {/* ================================================= */}
                      {/* AKSI */}
                      {/* ================================================= */}

                      <td
                        className="ds-action-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="ds-action-group">
                          <button
                            type="button"
                            className="ds-btn-approve"
                            onClick={() => handleApprove(s.id)}
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            className="ds-btn-decline"
                            onClick={() => handleDecline(s.id)}
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================================================= */}
      {/* MODAL DETAIL SISWA */}
      {/* ================================================= */}

      {selectedSiswa && (
        <div
          className="ds-modal-overlay"
          onClick={() => setSelectedSiswa(null)}
        >
          <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
            {/* HEADER */}

            <div className="ds-modal-header">
              <div>
                <span className="ds-section-label">DETAIL SISWA</span>

                <h2>Informasi Siswa</h2>
              </div>

              <button
                type="button"
                className="ds-modal-close"
                onClick={() => setSelectedSiswa(null)}
              >
                ×
              </button>
            </div>

            {/* PROFILE */}

            <div className="ds-modal-profile">
              <div className="ds-modal-avatar">
                {selectedSiswa.nama
                  ? selectedSiswa.nama.charAt(0).toUpperCase()
                  : "?"}
              </div>

              <div>
                <h3>{selectedSiswa.nama}</h3>

                <span>{selectedSiswa.email || "-"}</span>
              </div>
            </div>

            {/* DETAIL */}

            <div className="ds-detail-grid">
              <div className="ds-detail-item">
                <span>Nama</span>

                <strong>{selectedSiswa.nama || "-"}</strong>
              </div>

              <div className="ds-detail-item">
                <span>Email</span>

                <strong>{selectedSiswa.email || "-"}</strong>
              </div>

              <div className="ds-detail-item">
                <span>Kelas</span>

                <strong>{selectedSiswa.nama_kelas || "-"}</strong>
              </div>

              <div className="ds-detail-item">
                <span>Program</span>

                <strong>{selectedSiswa.nama_program || "-"}</strong>
              </div>

              <div className="ds-detail-item">
                <span>Asal Sekolah</span>

                <strong>{selectedSiswa.asal_sekolah || "-"}</strong>
              </div>

              <div className="ds-detail-item">
                <span>No HP</span>

                <strong>{selectedSiswa.no_hp || "-"}</strong>
              </div>

              <div className="ds-detail-item">
                <span>Nama Orang Tua</span>

                <strong>{selectedSiswa.nama_orangtua || "-"}</strong>
              </div>

              <div className="ds-detail-item">
                <span>No HP Orang Tua</span>

                <strong>{selectedSiswa.no_hp_orangtua || "-"}</strong>
              </div>
            </div>

            {/* ================================================= */}
            {/* BUKTI PEMBAYARAN */}
            {/* ================================================= */}

            <div className="ds-proof-section">
              <span>Bukti Pembayaran Pendaftaran</span>

              {selectedSiswa.bukti_pembayaran ? (
                <button
                  type="button"
                  className="ds-btn-proof ds-btn-proof-modal"
                  onClick={() =>
                    handleLihatBukti(selectedSiswa.bukti_pembayaran)
                  }
                >
                  👁 Lihat Bukti Pembayaran
                </button>
              ) : (
                <span className="ds-no-proof">
                  Bukti pembayaran belum tersedia.
                </span>
              )}
            </div>

            {/* FOOTER */}

            <div className="ds-modal-footer">
              <button
                type="button"
                className="ds-btn-close"
                onClick={() => setSelectedSiswa(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
