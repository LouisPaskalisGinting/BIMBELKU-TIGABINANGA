import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DataTentor.css";

const API_URL = "http://localhost:3000";

export default function DataTentor() {
  const navigate = useNavigate();

  const [tentor, setTentor] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    nama: "",
    mapel: "",
    status: "Aktif",
    no_hp: "",
    email: "",
    password: "",
  });

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ==============================
  // CHECK TOKEN
  // ==============================
  const checkToken = () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return false;
    }

    return true;
  };

  // ==============================
  // FETCH DATA TENTOR
  // ==============================
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/tentor`);

      if (!response.ok) {
        throw new Error("Gagal mengambil data tentor");
      }

      const data = await response.json();

      setTentor(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch tentor error:", error);
    }
  };

  // ==============================
  // INITIAL LOAD
  // ==============================
  useEffect(() => {
    if (!checkToken()) return;

    fetchData();
  }, []);

  // ==============================
  // HANDLE INPUT
  // ==============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==============================
  // RESET FORM
  // ==============================
  const resetForm = () => {
    setForm({
      nama: "",
      mapel: "",
      status: "Aktif",
      no_hp: "",
      email: "",
      password: "",
    });

    setEditId(null);
  };

  // ==============================
  // OPEN ADD MODAL
  // ==============================
  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  // ==============================
  // OPEN EDIT MODAL
  // ==============================
  const handleEdit = (data) => {
    setEditId(data.id);

    setForm({
      nama: data.nama || "",
      mapel: data.mapel || "",
      status: data.status || "Aktif",
      no_hp: data.no_hp || "",
      email: data.email || "",
      password: "",
    });

    setShowModal(true);
  };

  // ==============================
  // CLOSE MODAL
  // ==============================
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // ==============================
  // HANDLE SUBMIT
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    // Validasi
    if (!form.nama.trim()) {
      alert("Nama tentor wajib diisi.");
      return;
    }

    if (!form.mapel.trim()) {
      alert("Mata pelajaran wajib diisi.");
      return;
    }

    if (!form.no_hp.trim()) {
      alert("Nomor HP wajib diisi.");
      return;
    }

    if (!form.email.trim()) {
      alert("Email wajib diisi.");
      return;
    }

    if (!editId && !form.password.trim()) {
      alert("Password wajib diisi untuk tentor baru.");
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      mapel: form.mapel.trim(),
      status: form.status,
      no_hp: form.no_hp.trim(),
      email: form.email.trim(),
    };

    // Password hanya dikirim ketika tambah
    if (!editId) {
      payload.password = form.password;
    }

    try {
      const response = await fetch(
        editId ? `${API_URL}/tentor/${editId}` : `${API_URL}/tentor`,
        {
          method: editId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Token expired / unauthorized
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        alert("Sesi login telah berakhir. Silakan login kembali.");

        navigate("/login");
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan data tentor.");
      }

      alert(
        editId
          ? "Data tentor berhasil diperbarui."
          : "Tentor berhasil ditambahkan."
      );

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Submit tentor error:", error);
      alert(error.message || "Terjadi kesalahan.");
    }
  };

  // ==============================
  // HANDLE DELETE
  // ==============================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus data tentor ini?"
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tentor/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Token expired
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        alert("Sesi login telah berakhir. Silakan login kembali.");

        navigate("/login");
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus data tentor.");
      }

      alert("Data tentor berhasil dihapus.");

      fetchData();
    } catch (error) {
      console.error("Delete tentor error:", error);
      alert(error.message || "Terjadi kesalahan.");
    }
  };

  // ==============================
  // SEARCH
  // ==============================
  const filteredTentor = tentor.filter((item) =>
    item.nama?.toLowerCase().includes(search.toLowerCase())
  );

  // ==============================
  // RENDER
  // ==============================
  return (
    <div className="dtx-page">
      {/* ==========================
          HEADER
      ========================== */}
      <div className="dtx-header">
        <div className="dtx-title-wrapper">
          <div className="dtx-title-icon">
            <span>👨‍🏫</span>
          </div>

          <div>
            <h1 className="dtx-title">Data Tentor</h1>

            <p className="dtx-subtitle">
              Kelola data pengajar dan informasi tentor
            </p>
          </div>
        </div>
      </div>

      {/* ==========================
          TOOLBAR
      ========================== */}
      <div className="dtx-toolbar">
        {/* SEARCH */}
        <div className="dtx-search-wrapper">
          <span className="dtx-search-icon">🔍</span>

          <input
            type="text"
            className="dtx-search-input"
            placeholder="Cari nama tentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ADD BUTTON */}
        <button type="button" className="dtx-add-button" onClick={handleAdd}>
          <span className="dtx-add-icon">+</span>

          <span>Tambah Tentor</span>
        </button>
      </div>

      {/* ==========================
          TABLE CARD
      ========================== */}
      <div className="dtx-table-card">
        {/* TABLE HEADER */}
        <div className="dtx-table-top">
          <div>
            <h2 className="dtx-table-top-title">Daftar Tentor</h2>

            <p className="dtx-table-top-subtitle">
              Data seluruh tentor yang terdaftar
            </p>
          </div>

          <div className="dtx-table-top-count">
            {filteredTentor.length} Data
          </div>
        </div>

        {/* TABLE SCROLL */}
        <div className="dtx-table-scroll">
          <table className="dtx-table">
            <thead>
              <tr>
                <th className="dtx-col-number">No</th>

                <th className="dtx-col-nama">Nama Tentor</th>

                <th className="dtx-col-mapel">Mata Pelajaran</th>

                <th className="dtx-col-nohp">No. HP</th>

                <th className="dtx-col-email">Email</th>

                <th className="dtx-col-status">Status</th>

                <th className="dtx-col-aksi">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredTentor.length > 0 ? (
                filteredTentor.map((item, index) => (
                  <tr key={item.id || index}>
                    {/* NOMOR */}
                    <td className="dtx-number">{index + 1}</td>

                    {/* NAMA */}
                    <td>
                      <div className="dtx-name-cell">
                        <div className="dtx-avatar">
                          {item.nama ? item.nama.charAt(0).toUpperCase() : "?"}
                        </div>

                        <div className="dtx-name-info">
                          <span className="dtx-name">{item.nama || "-"}</span>

                          <span className="dtx-name-label">Tentor</span>
                        </div>
                      </div>
                    </td>

                    {/* MAPEL */}
                    <td>
                      <span className="dtx-mapel">{item.mapel || "-"}</span>
                    </td>

                    {/* NO HP */}
                    <td>
                      <span className="dtx-contact">{item.no_hp || "-"}</span>
                    </td>

                    {/* EMAIL */}
                    <td>
                      <span className="dtx-email">{item.email || "-"}</span>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`dtx-status ${
                          item.status?.toLowerCase() === "aktif"
                            ? "dtx-status-active"
                            : "dtx-status-inactive"
                        }`}
                      >
                        <span className="dtx-status-dot"></span>

                        {item.status || "Nonaktif"}
                      </span>
                    </td>

                    {/* AKSI */}
                    <td>
                      <div className="dtx-actions">
                        <button
                          type="button"
                          className="dtx-action-button dtx-edit-button"
                          onClick={() => handleEdit(item)}
                          title="Edit data"
                        >
                          <span>✏️</span>
                          Edit
                        </button>

                        <button
                          type="button"
                          className="dtx-action-button dtx-delete-button"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus data"
                        >
                          <span>🗑️</span>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="dtx-empty">
                    <div className="dtx-empty-content">
                      <div className="dtx-empty-icon">🔎</div>

                      <h3>Data tidak ditemukan</h3>

                      <p>Belum ada data tentor yang sesuai dengan pencarian.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================
          MODAL
      ========================== */}
      {showModal && (
        <div
          className="dtx-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="dtx-modal">
            {/* MODAL HEADER */}
            <div className="dtx-modal-header">
              <div className="dtx-modal-title-wrapper">
                <div className="dtx-modal-icon">{editId ? "✏️" : "👨‍🏫"}</div>

                <div>
                  <h2>{editId ? "Edit Data Tentor" : "Tambah Tentor"}</h2>

                  <p className="dtx-modal-subtitle">
                    {editId
                      ? "Perbarui informasi tentor"
                      : "Tambahkan tentor baru ke dalam sistem"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="dtx-modal-close"
                onClick={handleCloseModal}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            {/* MODAL FORM */}
            <form className="dtx-modal-form" onSubmit={handleSubmit}>
              {/* NAMA */}
              <div className="dtx-modal-field">
                <label htmlFor="dtx-nama">
                  Nama Tentor
                  <span>*</span>
                </label>

                <input
                  id="dtx-nama"
                  type="text"
                  name="nama"
                  className="dtx-modal-input"
                  placeholder="Masukkan nama tentor"
                  value={form.nama}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* MAPEL */}
              <div className="dtx-modal-field">
                <label htmlFor="dtx-mapel">
                  Mata Pelajaran
                  <span>*</span>
                </label>

                <input
                  id="dtx-mapel"
                  type="text"
                  name="mapel"
                  className="dtx-modal-input"
                  placeholder="Contoh: Matematika"
                  value={form.mapel}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* STATUS */}
              <div className="dtx-modal-field">
                <label htmlFor="dtx-status">
                  Status
                  <span>*</span>
                </label>

                <select
                  id="dtx-status"
                  name="status"
                  className="dtx-modal-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Aktif">Aktif</option>

                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* NO HP */}
              <div className="dtx-modal-field">
                <label htmlFor="dtx-nohp">
                  Nomor HP
                  <span>*</span>
                </label>

                <input
                  id="dtx-nohp"
                  type="tel"
                  name="no_hp"
                  className="dtx-modal-input"
                  placeholder="Contoh: 081234567890"
                  value={form.no_hp}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* EMAIL */}
              <div className="dtx-modal-field">
                <label htmlFor="dtx-email">
                  Email
                  <span>*</span>
                </label>

                <input
                  id="dtx-email"
                  type="email"
                  name="email"
                  className="dtx-modal-input"
                  placeholder="Contoh: tentor@email.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* PASSWORD */}
              {!editId && (
                <div className="dtx-modal-field">
                  <label htmlFor="dtx-password">
                    Password
                    <span>*</span>
                  </label>

                  <input
                    id="dtx-password"
                    type="password"
                    name="password"
                    className="dtx-modal-input"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <small className="dtx-field-hint">
                    Password digunakan untuk login tentor.
                  </small>
                </div>
              )}

              {/* BUTTON */}
              <div className="dtx-modal-buttons">
                <button
                  type="button"
                  className="dtx-modal-button dtx-cancel-button"
                  onClick={handleCloseModal}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="dtx-modal-button dtx-save-button"
                >
                  <span>{editId ? "✓" : "+"}</span>

                  {editId ? "Simpan Perubahan" : "Tambah Tentor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
