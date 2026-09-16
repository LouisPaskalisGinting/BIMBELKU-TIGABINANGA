import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Kelas.css";

export default function Kelas() {
  const [kelas, setKelas] = useState([]);
  const [programList, setProgramList] = useState([]);

  const [form, setForm] = useState({
    nama_kelas: "",
    program_id: "",
  });

  const [editId, setEditId] = useState(null);

  const navigate = useNavigate();

  // ========================================
  // TOKEN
  // ========================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ========================================
  // LOAD DATA
  // ========================================

  useEffect(() => {
    fetchData();
    fetchProgram();
  }, []);

  // ========================================
  // GET KELAS
  // ========================================

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:3000/kelas");

      const data = await res.json();

      setKelas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data kelas:", err);
      setKelas([]);
    }
  };

  // ========================================
  // GET PROGRAM
  // ========================================

  const fetchProgram = async () => {
    try {
      const res = await fetch("http://localhost:3000/program");

      const data = await res.json();

      setProgramList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data program:", err);
      setProgramList([]);
    }
  };

  // ========================================
  // HANDLE CHANGE
  // ========================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ========================================
  // RESET FORM
  // ========================================

  const resetForm = () => {
    setForm({
      nama_kelas: "",
      program_id: "",
    });

    setEditId(null);
  };

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async () => {
    const namaKelas = form.nama_kelas.trim();

    if (!namaKelas || !form.program_id) {
      alert("Nama kelas dan program wajib diisi");
      return;
    }

    // ========================================
    // CEK DUPLIKAT
    // ========================================

    const namaKelasLower = namaKelas.toLowerCase();

    const kelasDuplikat = kelas.some((k) => {
      const namaDatabase = (k.nama_kelas || "").trim().toLowerCase();

      if (editId && Number(k.id) === Number(editId)) {
        return false;
      }

      return namaDatabase === namaKelasLower;
    });

    if (kelasDuplikat) {
      alert("Nama kelas sudah digunakan. Silakan gunakan nama kelas lain.");

      return;
    }

    const payload = {
      nama_kelas: namaKelas,
      program_id: form.program_id,
    };

    try {
      const token = getToken();

      if (!token) {
        alert("Token login tidak ditemukan. Silakan login kembali.");
        return;
      }

      let res;

      // ========================================
      // EDIT
      // ========================================

      if (editId) {
        res = await fetch(`http://localhost:3000/kelas/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      // ========================================
      // TAMBAH
      // ========================================
      else {
        res = await fetch("http://localhost:3000/kelas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal menyimpan kelas");
        return;
      }

      alert(result.message || "Kelas berhasil disimpan");

      resetForm();

      fetchData();
    } catch (err) {
      console.error("Gagal menyimpan kelas:", err);

      alert("Server tidak terhubung");
    }
  };

  // ========================================
  // EDIT
  // ========================================

  const handleEdit = (k) => {
    setForm({
      nama_kelas: k.nama_kelas || "",
      program_id: k.program_id || "",
    });

    setEditId(k.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // DELETE
  // ========================================

  const handleDelete = async (id) => {
    const yakin = window.confirm("Yakin ingin menghapus kelas ini?");

    if (!yakin) return;

    try {
      const token = getToken();

      if (!token) {
        alert("Token login tidak ditemukan. Silakan login kembali.");

        return;
      }

      const res = await fetch(`http://localhost:3000/kelas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal menghapus kelas");
        return;
      }

      alert(result.message || "Kelas berhasil dihapus");

      fetchData();
    } catch (err) {
      console.error("Gagal menghapus kelas:", err);

      alert("Server tidak terhubung");
    }
  };

  // ========================================
  // DETAIL
  // ========================================

  const handleDetail = (id) => {
    navigate(`/kelas/${id}`);
  };

  // ========================================
  // RETURN
  // ========================================

  return (
    <div className="kls-page">
      {/* ==================================
          HEADER
      ================================== */}

      <div className="kls-header">
        <div className="kls-eyebrow">ADMINISTRATION</div>

        <h1 className="kls-title">Data Kelas</h1>

        <p className="kls-subtitle">
          Kelola data kelas dan program pembelajaran dengan mudah.
        </p>
      </div>

      {/* ==================================
          FORM CARD
      ================================== */}

      <div className="kls-form-card">
        <div className="kls-card-heading">
          <div>
            <span className="kls-section-label">
              {editId ? "EDIT DATA" : "DATA KELAS"}
            </span>

            <h2 className="kls-form-title">
              {editId ? "Edit Kelas" : "Tambah Kelas"}
            </h2>

            <p className="kls-form-description">
              {editId
                ? "Perbarui informasi kelas yang dipilih."
                : "Tambahkan kelas baru ke dalam sistem."}
            </p>
          </div>

          {editId && <div className="kls-edit-badge">Mode Edit</div>}
        </div>

        <div className="kls-form">
          {/* NAMA KELAS */}

          <div className="kls-field">
            <label htmlFor="kls-nama-kelas">Nama Kelas</label>

            <input
              id="kls-nama-kelas"
              name="nama_kelas"
              type="text"
              placeholder="Contoh: Kelas 301"
              value={form.nama_kelas}
              onChange={handleChange}
            />
          </div>

          {/* PROGRAM */}

          <div className="kls-field">
            <label htmlFor="kls-program">Program</label>

            <select
              id="kls-program"
              name="program_id"
              value={form.program_id}
              onChange={handleChange}
            >
              <option value="">Pilih Program</option>

              {programList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_program}
                </option>
              ))}
            </select>
          </div>

          {/* BUTTON */}

          <div className="kls-form-actions">
            <button
              type="button"
              className="kls-btn-submit"
              onClick={handleSubmit}
            >
              <span>{editId ? "✓" : "+"}</span>

              {editId ? "Update Kelas" : "Tambah Kelas"}
            </button>

            {editId && (
              <button
                type="button"
                className="kls-btn-cancel"
                onClick={resetForm}
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================
          TABLE CARD
      ================================== */}

      <div className="kls-table-card">
        {/* TABLE HEADER */}

        <div className="kls-table-header">
          <div>
            <span className="kls-section-label">DATA TERDAFTAR</span>

            <h2 className="kls-table-title">Daftar Kelas</h2>

            <p className="kls-table-description">
              Daftar kelas yang tersedia saat ini.
            </p>
          </div>

          <div className="kls-total">
            <span className="kls-total-number">{kelas.length}</span>

            <span className="kls-total-label">Total Kelas</span>
          </div>
        </div>

        {/* TABLE */}

        <div className="kls-table-wrapper">
          <table className="kls-table">
            <thead>
              <tr>
                <th className="kls-col-name">Nama Kelas</th>

                <th className="kls-col-program">Program</th>

                <th className="kls-col-action">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {kelas.length === 0 ? (
                <tr>
                  <td colSpan="3" className="kls-empty">
                    <div className="kls-empty-content">
                      <div className="kls-empty-icon">📚</div>

                      <strong>Belum ada data kelas</strong>

                      <span>
                        Silakan tambahkan kelas baru menggunakan form di atas.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                kelas.map((k, index) => (
                  <tr key={k.id} className="kls-table-row">
                    {/* NAMA */}

                    <td>
                      <div className="kls-class-name">
                        <div className="kls-class-icon">
                          {String(k.nama_kelas || "K")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="kls-class-info">
                          <strong>{k.nama_kelas}</strong>

                          <span>Kelas #{index + 1}</span>
                        </div>
                      </div>
                    </td>

                    {/* PROGRAM */}

                    <td>
                      <span className="kls-program-badge">
                        {k.nama_program || "-"}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="kls-action-cell">
                      <div className="kls-action-group">
                        <button
                          type="button"
                          className="kls-btn-detail"
                          onClick={() => handleDetail(k.id)}
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          className="kls-btn-edit"
                          onClick={() => handleEdit(k)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="kls-btn-delete"
                          onClick={() => handleDelete(k.id)}
                        >
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
      </div>
    </div>
  );
}
