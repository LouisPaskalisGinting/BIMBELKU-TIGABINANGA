import { useEffect, useState } from "react";
import "./Jadwal.css";

export default function Jadwal() {
  const [jadwal, setJadwal] = useState([]);

  const [form, setForm] = useState({
    kelas_id: "",
    mata_pelajaran: "",
    tentor: "",
    tanggal: "",
    hari: "",
    jam_mulai: "",
    jam_selesai: "",
    tentor_id: "",
  });

  const [kelasList, setKelasList] = useState([]);
  const [tentorList, setTentorList] = useState([]);

  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchData(), fetchKelas(), fetchTentor()]);
    };

    loadData();
  }, []);

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // AUTH HEADER
  // =====================================================

  const getAuthHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // =====================================================
  // GET HARI
  // =====================================================

  const getHariDariTanggal = (tanggal) => {
    if (!tanggal) return "";

    const hariIndonesia = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    const tanggalBersih = String(tanggal).split("T")[0];

    const [tahun, bulan, hari] = tanggalBersih.split("-");

    const date = new Date(Number(tahun), Number(bulan) - 1, Number(hari));

    return hariIndonesia[date.getDay()];
  };

  // =====================================================
  // FORMAT HARI + TANGGAL
  // =====================================================

  const gabungHariTanggal = (tanggal) => {
    if (!tanggal) return "";

    const tanggalBersih = String(tanggal).split("T")[0];

    const [tahun, bulan, tanggalHari] = tanggalBersih.split("-");

    const date = new Date(
      Number(tahun),
      Number(bulan) - 1,
      Number(tanggalHari)
    );

    const namaHari = getHariDariTanggal(tanggalBersih);

    const tanggalFormat = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return `${namaHari}, ${tanggalFormat}`;
  };

  // =====================================================
  // FORMAT TANGGAL
  // =====================================================

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";

    return gabungHariTanggal(tanggal);
  };

  // =====================================================
  // FORMAT JAM
  // =====================================================

  const tampilJam = (j) => {
    if (j.jam_mulai && j.jam_selesai) {
      return `${j.jam_mulai} - ${j.jam_selesai}`;
    }

    if (j.jam) {
      return j.jam;
    }

    return "-";
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      kelas_id: "",
      mata_pelajaran: "",
      tentor: "",
      tanggal: "",
      hari: "",
      jam_mulai: "",
      jam_selesai: "",
      tentor_id: "",
    });

    setEditId(null);
  };

  // =====================================================
  // TAMBAH JADWAL
  // =====================================================

  const handleTambah = () => {
    resetForm();
    setShowForm(true);
  };

  // =====================================================
  // TUTUP MODAL
  // =====================================================

  const handleCloseForm = () => {
    resetForm();
    setShowForm(false);
  };

  // =====================================================
  // GET JADWAL
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/jadwal");

      if (!res.ok) {
        throw new Error("Gagal mengambil data jadwal");
      }

      const data = await res.json();

      const jadwalData = Array.isArray(data) ? data : [];

      jadwalData.sort((a, b) => Number(b.id) - Number(a.id));

      setJadwal(jadwalData);
    } catch (err) {
      console.error("Gagal mengambil data jadwal:", err);

      setJadwal([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET KELAS
  // =====================================================

  const fetchKelas = async () => {
    try {
      const res = await fetch("http://localhost:3000/kelas");

      if (!res.ok) {
        throw new Error("Gagal mengambil data kelas");
      }

      const data = await res.json();

      setKelasList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data kelas:", err);

      setKelasList([]);
    }
  };

  // =====================================================
  // GET TENTOR
  // =====================================================

  const fetchTentor = async () => {
    try {
      const res = await fetch("http://localhost:3000/tentor");

      if (!res.ok) {
        throw new Error("Gagal mengambil data tentor");
      }

      const data = await res.json();

      setTentorList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data tentor:", err);

      setTentorList([]);
    }
  };

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // PILIH TENTOR
    if (name === "tentor") {
      const selectedTentor = tentorList.find((t) => t.nama === value);

      setForm((prev) => ({
        ...prev,
        tentor: value,
        tentor_id: selectedTentor ? selectedTentor.id : "",
      }));

      return;
    }

    // PILIH TANGGAL
    if (name === "tanggal") {
      const hariTanggal = getHariDariTanggal(value);

      setForm((prev) => ({
        ...prev,
        tanggal: value,
        hari: hariTanggal,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.kelas_id ||
      !form.mata_pelajaran.trim() ||
      !form.tentor ||
      !form.tanggal ||
      !form.jam_mulai ||
      !form.jam_selesai
    ) {
      alert("Seluruh data jadwal wajib diisi.");
      return;
    }

    if (form.jam_mulai >= form.jam_selesai) {
      alert("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    const payload = {
      kelas_id: form.kelas_id,
      mata_pelajaran: form.mata_pelajaran.trim(),
      tentor: form.tentor,
      tanggal: form.tanggal,
      hari: form.hari,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
      jam: `${form.jam_mulai} - ${form.jam_selesai}`,
      tentor_id: form.tentor_id || null,
    };

    try {
      let res;

      if (editId) {
        res = await fetch(`http://localhost:3000/jadwal/${editId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("http://localhost:3000/jadwal", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal menyimpan jadwal.");

        console.error("ERROR JADWAL:", result);

        return;
      }

      alert(result.message || "Jadwal berhasil disimpan.");

      handleCloseForm();

      await fetchData();
    } catch (err) {
      console.error("Gagal menyimpan jadwal:", err);

      alert("Terjadi kesalahan saat menyimpan jadwal.");
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (j) => {
    const tanggalEdit = j.tanggal ? String(j.tanggal).split("T")[0] : "";

    let jamMulai = j.jam_mulai || "";
    let jamSelesai = j.jam_selesai || "";

    if ((!jamMulai || !jamSelesai) && j.jam) {
      const pecahJam = String(j.jam).split("-");

      jamMulai = pecahJam[0]?.trim() || "";

      jamSelesai = pecahJam[1]?.trim() || "";
    }

    setForm({
      kelas_id: j.kelas_id || "",
      mata_pelajaran: j.mata_pelajaran || "",
      tentor: j.tentor || "",
      tanggal: tanggalEdit,
      hari: j.hari || getHariDariTanggal(tanggalEdit),
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      tentor_id: j.tentor_id || "",
    });

    setEditId(j.id);
    setShowForm(true);
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin menghapus jadwal ini?"
    );

    if (!yakin) return;

    try {
      const res = await fetch(`http://localhost:3000/jadwal/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal menghapus jadwal.");

        return;
      }

      alert(result.message || "Jadwal berhasil dihapus.");

      await fetchData();
    } catch (err) {
      console.error("Gagal menghapus jadwal:", err);

      alert("Terjadi kesalahan saat menghapus jadwal.");
    }
  };

  // =====================================================
  // ESC CLOSE MODAL
  // =====================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showForm) {
        handleCloseForm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showForm]);

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="jd-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="jd-header">
        <div>
          <span className="jd-eyebrow">ADMINISTRATION</span>

          <h1 className="jd-title">Data Jadwal</h1>

          <p className="jd-subtitle">
            Kelola jadwal pembelajaran, kelas, mata pelajaran, dan tentor.
          </p>
        </div>

        <button type="button" className="jd-btn-add" onClick={handleTambah}>
          <span className="jd-btn-add-icon">+</span>
          Tambah Jadwal
        </button>
      </header>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="jd-summary">
        <div className="jd-summary-card">
          <div className="jd-summary-icon">📅</div>

          <div className="jd-summary-content">
            <span>Total Jadwal</span>
            <strong>{jadwal.length}</strong>
          </div>
        </div>

        <div className="jd-summary-card">
          <div className="jd-summary-icon">🏫</div>

          <div className="jd-summary-content">
            <span>Total Kelas</span>
            <strong>{kelasList.length}</strong>
          </div>
        </div>

        <div className="jd-summary-card">
          <div className="jd-summary-icon">👨‍🏫</div>

          <div className="jd-summary-content">
            <span>Total Tentor</span>
            <strong>{tentorList.length}</strong>
          </div>
        </div>
      </section>

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <section className="jd-card">
        <div className="jd-card-header">
          <div>
            <span className="jd-section-label">DATA TERDAFTAR</span>

            <h2 className="jd-section-title">Daftar Jadwal</h2>

            <p className="jd-section-description">
              Daftar seluruh jadwal bimbingan belajar yang tersedia.
            </p>
          </div>

          <div className="jd-total-badge">
            <strong>{jadwal.length}</strong>
            <span>Total Jadwal</span>
          </div>
        </div>

        <div className="jd-table-wrapper">
          <table className="jd-table">
            <thead>
              <tr>
                <th className="jd-col-no">No</th>

                <th className="jd-col-kelas">Kelas</th>

                <th className="jd-col-mapel">Mata Pelajaran</th>

                <th className="jd-col-tentor">Tentor</th>

                <th className="jd-col-tanggal">Hari / Tanggal</th>

                <th className="jd-col-waktu">Waktu</th>

                <th className="jd-col-aksi">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="jd-empty-cell">
                    <div className="jd-loading">
                      <div className="jd-loading-spinner"></div>

                      <span>Memuat data jadwal...</span>
                    </div>
                  </td>
                </tr>
              ) : jadwal.length === 0 ? (
                <tr>
                  <td colSpan="7" className="jd-empty-cell">
                    <div className="jd-empty">
                      <div className="jd-empty-icon">📅</div>

                      <strong>Belum ada jadwal</strong>

                      <span>
                        Silakan tambahkan jadwal baru menggunakan tombol di
                        atas.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                jadwal.map((j, index) => (
                  <tr key={j.id} className="jd-table-row">
                    <td className="jd-number-cell">
                      <span className="jd-number">{index + 1}</span>
                    </td>

                    <td>
                      <div className="jd-class-info">
                        <div className="jd-class-avatar">
                          {String(j.nama_kelas || j.kelas || "K")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="jd-class-text">
                          <strong>{j.nama_kelas || j.kelas || "-"}</strong>

                          <span>Kelas #{index + 1}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="jd-subject">
                        <span className="jd-subject-icon">📖</span>

                        <strong>{j.mata_pelajaran || "-"}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="jd-tentor">
                        <span className="jd-tentor-icon">👨‍🏫</span>

                        <span>{j.tentor || "-"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="jd-date">
                        <strong>
                          {j.tanggal ? formatTanggal(j.tanggal) : j.hari || "-"}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <span className="jd-time-badge">
                        <span>🕐</span>
                        {tampilJam(j)}
                      </span>
                    </td>

                    <td>
                      <div className="jd-action-group">
                        <button
                          type="button"
                          className="jd-btn-edit"
                          onClick={() => handleEdit(j)}
                          title="Edit jadwal"
                        >
                          <span>✏</span>
                          Edit
                        </button>

                        <button
                          type="button"
                          className="jd-btn-delete"
                          onClick={() => handleDelete(j.id)}
                          title="Hapus jadwal"
                        >
                          <span>🗑</span>
                          Hapus
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

      {/* =================================================
          MODAL
      ================================================= */}

      {showForm && (
        <div
          className="jd-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseForm();
            }
          }}
        >
          <div className="jd-modal" onMouseDown={(e) => e.stopPropagation()}>
            {/* MODAL HEADER */}

            <div className="jd-modal-header">
              <div className="jd-modal-heading">
                <div className="jd-modal-icon">{editId ? "✏" : "📅"}</div>

                <div>
                  <span className="jd-modal-label">
                    {editId ? "EDIT DATA" : "DATA JADWAL"}
                  </span>

                  <h2>{editId ? "Edit Jadwal" : "Tambah Jadwal"}</h2>

                  <p>
                    {editId
                      ? "Perbarui informasi jadwal yang dipilih."
                      : "Isi informasi untuk membuat jadwal baru."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="jd-modal-close"
                onClick={handleCloseForm}
                title="Tutup"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form className="jd-form" onSubmit={handleSubmit}>
              {/* KELAS */}

              <div className="jd-field">
                <label>
                  Kelas
                  <span>*</span>
                </label>

                <select
                  name="kelas_id"
                  value={form.kelas_id}
                  onChange={handleChange}
                >
                  <option value="">Pilih Kelas</option>

                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* MAPEL */}

              <div className="jd-field">
                <label>
                  Mata Pelajaran
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="mata_pelajaran"
                  placeholder="Contoh: Matematika"
                  value={form.mata_pelajaran}
                  onChange={handleChange}
                />
              </div>

              {/* TENTOR */}

              <div className="jd-field">
                <label>
                  Tentor
                  <span>*</span>
                </label>

                <select
                  name="tentor"
                  value={form.tentor}
                  onChange={handleChange}
                >
                  <option value="">Pilih Tentor</option>

                  {tentorList.map((t) => (
                    <option key={t.id} value={t.nama}>
                      {t.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* TANGGAL */}

              <div className="jd-form-row">
                <div className="jd-field">
                  <label>
                    Tanggal
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="tanggal"
                    value={form.tanggal}
                    onChange={handleChange}
                  />
                </div>

                <div className="jd-field">
                  <label>Hari</label>

                  <input
                    type="text"
                    name="hari"
                    value={form.hari}
                    placeholder="Otomatis"
                    readOnly
                  />
                </div>
              </div>

              {/* JAM */}

              <div className="jd-form-row">
                <div className="jd-field">
                  <label>
                    Jam Mulai
                    <span>*</span>
                  </label>

                  <input
                    type="time"
                    name="jam_mulai"
                    value={form.jam_mulai}
                    onChange={handleChange}
                  />
                </div>

                <div className="jd-field">
                  <label>
                    Jam Selesai
                    <span>*</span>
                  </label>

                  <input
                    type="time"
                    name="jam_selesai"
                    value={form.jam_selesai}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* FOOTER */}

              <div className="jd-modal-footer">
                <button
                  type="button"
                  className="jd-btn-cancel"
                  onClick={handleCloseForm}
                >
                  Batal
                </button>

                <button type="submit" className="jd-btn-save">
                  <span>{editId ? "✓" : "+"}</span>

                  {editId ? "Simpan Perubahan" : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
