import { useEffect, useState } from "react";
import "./KelolaAdmin.css";

export default function KelolaAdmin() {
  const [admin, setAdmin] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [currentUser, setCurrentUser] = useState(null);

  const [form, setForm] = useState({
    id: "",
    nama: "",
    email: "",
    password: "",
    konfirmasi: "",
  });

  const API_URL = "http://localhost:3000/admin";

  // =========================================================
  // AMBIL USER YANG SEDANG LOGIN
  // =========================================================

  useEffect(() => {
    const userStorage = localStorage.getItem("user");

    if (userStorage) {
      try {
        const user = JSON.parse(userStorage);

        setCurrentUser(user);
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }
  }, []);

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =========================================================
  // HEADER AUTH
  // =========================================================

  const getAuthHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal mengambil data admin.");

        return;
      }

      setAdmin(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data admin:", err);

      setAdmin([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CEK MASTER
  // =========================================================

  const isCurrentUserMaster = Number(currentUser?.is_master) === 1;

  // =========================================================
  // CEK BOLEH EDIT
  // =========================================================

  const canEdit = (item) => {
    if (!currentUser) {
      return false;
    }

    // Admin Master dapat mengedit semua admin
    if (isCurrentUserMaster) {
      return true;
    }

    // Admin biasa hanya dapat mengedit dirinya sendiri
    return Number(currentUser.id) === Number(item.id);
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      id: "",
      nama: "",
      email: "",
      password: "",
      konfirmasi: "",
    });

    setEditMode(false);
  };

  // =========================================================
  // TAMBAH ADMIN
  // =========================================================

  const openTambah = () => {
    if (!isCurrentUserMaster) {
      alert("Hanya Admin Master yang dapat menambahkan admin baru.");

      return;
    }

    resetForm();

    setShowModal(true);
  };

  // =========================================================
  // EDIT ADMIN
  // =========================================================

  const openEdit = (item) => {
    if (!canEdit(item)) {
      alert("Anda hanya dapat mengubah data akun Anda sendiri.");

      return;
    }

    setForm({
      id: item.id,
      nama: item.nama || "",
      email: item.email || "",
      password: "",
      konfirmasi: "",
    });

    setEditMode(true);

    setShowModal(true);
  };

  // =========================================================
  // INPUT
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // SIMPAN
  // =========================================================

  const simpanAdmin = async () => {
    const nama = form.nama.trim();
    const email = form.email.trim();

    if (!nama || !email) {
      alert("Nama dan Email wajib diisi!");

      return;
    }

    // =====================================================
    // VALIDASI TAMBAH
    // =====================================================

    if (!editMode) {
      if (!isCurrentUserMaster) {
        alert("Hanya Admin Master yang dapat menambahkan admin.");

        return;
      }

      if (form.password.length < 6) {
        alert("Password minimal 6 karakter!");

        return;
      }

      if (form.password !== form.konfirmasi) {
        alert("Konfirmasi password tidak cocok!");

        return;
      }
    }

    // =====================================================
    // VALIDASI EDIT
    // =====================================================

    if (editMode) {
      const target = admin.find((item) => Number(item.id) === Number(form.id));

      if (!target) {
        alert("Data admin tidak ditemukan.");

        return;
      }

      if (!canEdit(target)) {
        alert("Anda hanya dapat mengubah data akun Anda sendiri.");

        return;
      }

      if (form.password !== "") {
        if (form.password.length < 6) {
          alert("Password baru minimal 6 karakter!");

          return;
        }
      }
    }

    try {
      setSaving(true);

      let url = API_URL;
      let method = "POST";

      if (editMode) {
        url = `${API_URL}/${form.id}`;
        method = "PUT";
      }

      const body = {
        nama,
        email,
        password: form.password,
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Terjadi kesalahan pada server.");

        return;
      }

      alert(
        data.message ||
          (editMode
            ? "Data admin berhasil diperbarui."
            : "Admin berhasil ditambahkan.")
      );

      setShowModal(false);

      resetForm();

      await fetchAdmin();

      // ===================================================
      // UPDATE DATA USER LOCAL STORAGE
      // ===================================================

      if (
        editMode &&
        currentUser &&
        Number(form.id) === Number(currentUser.id)
      ) {
        const updatedUser = {
          ...currentUser,
          nama,
          email,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));

        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("ERROR SIMPAN ADMIN:", err);

      alert("Koneksi ke server gagal.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // HAPUS ADMIN
  // =========================================================

  const hapusAdmin = async (item) => {
    // Hanya master
    if (!isCurrentUserMaster) {
      alert("Hanya Admin Master yang dapat menghapus admin.");

      return;
    }

    // Proteksi master
    if (Number(item.is_master) === 1) {
      alert(
        "Admin Master tidak dapat dihapus.\n\nAkun ini merupakan akun utama sistem."
      );

      return;
    }

    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus admin "${item.nama}"?`
    );

    if (!yakin) {
      return;
    }

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/${item.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal menghapus admin.");

        return;
      }

      alert(data.message || "Admin berhasil dihapus.");

      await fetchAdmin();
    } catch (err) {
      console.error("ERROR HAPUS ADMIN:", err);

      alert("Koneksi ke server gagal.");
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const searchKeyword = search.trim().toLowerCase();

  const hasilFilter = admin.filter((item) => {
    const nama = String(item.nama || "").toLowerCase();

    const email = String(item.email || "").toLowerCase();

    return nama.includes(searchKeyword) || email.includes(searchKeyword);
  });

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    resetForm();
  };

  // =========================================================
  // INITIAL AVATAR
  // =========================================================

  const getInitial = (nama) => {
    if (!nama) {
      return "A";
    }

    return nama.trim().charAt(0).toUpperCase();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="ka-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ka-header">
        <div className="ka-header-content">
          <div className="ka-eyebrow">ADMINISTRASI SISTEM</div>

          <h1 className="ka-title">Kelola Admin</h1>

          <p className="ka-subtitle">
            Kelola akun administrator yang memiliki akses terhadap sistem
            Bimbelku.
          </p>
        </div>

        {/* ===============================================
            TAMBAH ADMIN
            HANYA MASTER
        =============================================== */}

        {isCurrentUserMaster && (
          <button type="button" className="ka-btn-primary" onClick={openTambah}>
            <span className="ka-btn-icon">+</span>
            Tambah Admin
          </button>
        )}
      </header>

      {/* =====================================================
          INFO HAK AKSES
      ===================================================== */}

      <div className="ka-access-info">
        <strong>
          {isCurrentUserMaster ? "Admin Master" : "Administrator"}
        </strong>

        <span>
          {isCurrentUserMaster
            ? "Anda dapat mengelola akun administrator lain."
            : "Anda hanya dapat mengubah data akun Anda sendiri."}
        </span>
      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <section className="ka-card">
        <div className="ka-card-header">
          <div className="ka-card-heading">
            <span className="ka-section-label">DATA ADMIN</span>

            <h2 className="ka-section-title">Daftar Administrator</h2>

            <p className="ka-section-description">
              Daftar akun administrator yang terdaftar pada sistem.
            </p>
          </div>

          {/* SEARCH */}

          <div className="ka-search-wrapper">
            <span className="ka-search-icon">🔍</span>

            <input
              type="text"
              className="ka-search-input"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                className="ka-search-clear"
                onClick={() => setSearch("")}
                aria-label="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* SEARCH INFO */}

        {search && (
          <div className="ka-search-info">
            Menampilkan <strong>{hasilFilter.length}</strong> dari{" "}
            <strong>{admin.length}</strong> admin untuk pencarian{" "}
            <strong>"{search}"</strong>.
          </div>
        )}

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="ka-table-wrapper">
          <table className="ka-table">
            <thead>
              <tr>
                <th className="ka-col-number">No</th>

                <th>Administrator</th>

                <th>Email</th>

                <th>Role</th>

                <th className="ka-col-action">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="ka-empty-cell">
                    <div className="ka-loading">
                      <span className="ka-spinner"></span>

                      <strong>Memuat data admin...</strong>

                      <span>Mohon tunggu sebentar.</span>
                    </div>
                  </td>
                </tr>
              ) : hasilFilter.length === 0 ? (
                <tr>
                  <td colSpan="5" className="ka-empty-cell">
                    <div className="ka-empty">
                      <div className="ka-empty-icon">👤</div>

                      <strong>
                        {search ? "Admin tidak ditemukan" : "Belum ada admin"}
                      </strong>

                      <span>
                        {search
                          ? "Coba gunakan kata kunci pencarian lain."
                          : "Belum terdapat akun administrator."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                hasilFilter.map((item, index) => {
                  const isMaster = Number(item.is_master) === 1;

                  const isMyAccount =
                    Number(currentUser?.id) === Number(item.id);

                  const allowedEdit = canEdit(item);

                  return (
                    <tr className="ka-table-row" key={item.id}>
                      <td className="ka-number-cell">{index + 1}</td>

                      {/* ADMIN PROFILE */}

                      <td>
                        <div className="ka-admin-profile">
                          <div className="ka-avatar">
                            {getInitial(item.nama)}
                          </div>

                          <div className="ka-admin-name">
                            <strong>{item.nama}</strong>

                            <span>
                              {isMaster
                                ? "Admin Master"
                                : isMyAccount
                                ? "Administrator — Anda"
                                : "Administrator"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}

                      <td>
                        <span className="ka-email">{item.email}</span>
                      </td>

                      {/* ROLE */}

                      <td>
                        <span className="ka-role">
                          {isMaster ? "Master" : item.role || "admin"}
                        </span>
                      </td>

                      {/* AKSI */}

                      <td className="ka-action-cell">
                        <div className="ka-action-group">
                          {/* EDIT */}

                          {allowedEdit ? (
                            <button
                              type="button"
                              className="ka-btn-edit"
                              onClick={() => openEdit(item)}
                            >
                              ✏️ Edit
                            </button>
                          ) : (
                            <span
                              className="ka-edit-protected"
                              title="Admin hanya dapat mengubah datanya sendiri"
                            >
                              🔒 Bukan akun Anda
                            </span>
                          )}

                          {/* HAPUS */}

                          {isCurrentUserMaster ? (
                            isMaster ? (
                              <span
                                className="ka-master-protected"
                                title="Admin Master tidak dapat dihapus"
                              >
                                🔒 Dilindungi
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="ka-btn-delete"
                                onClick={() => hapusAdmin(item)}
                              >
                                🗑 Hapus
                              </button>
                            )
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="ka-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="ka-modal" onMouseDown={(e) => e.stopPropagation()}>
            {/* MODAL HEADER */}

            <div className="ka-modal-header">
              <div>
                <span className="ka-modal-label">
                  {editMode ? "EDIT ADMINISTRATOR" : "ADMINISTRATOR BARU"}
                </span>

                <h2>{editMode ? "Edit Admin" : "Tambah Admin"}</h2>

                <p>
                  {editMode
                    ? "Perbarui informasi akun administrator."
                    : "Tambahkan akun administrator baru ke sistem."}
                </p>
              </div>

              <button
                type="button"
                className="ka-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {/* PROFILE PREVIEW */}

            <div className="ka-modal-profile">
              <div className="ka-modal-avatar">{getInitial(form.nama)}</div>

              <div>
                <strong>{form.nama || "Nama Administrator"}</strong>

                <span>{form.email || "email@example.com"}</span>
              </div>
            </div>

            {/* FORM */}

            <div className="ka-form">
              {/* NAMA */}

              <div className="ka-form-group">
                <label htmlFor="ka-nama">Nama Administrator</label>

                <input
                  id="ka-nama"
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama administrator"
                  disabled={saving}
                  autoComplete="name"
                />
              </div>

              {/* EMAIL */}

              <div className="ka-form-group">
                <label htmlFor="ka-email">Email</label>

                <input
                  id="ka-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Masukkan alamat email"
                  disabled={saving}
                  autoComplete="email"
                />
              </div>

              {/* PASSWORD */}

              <div className="ka-form-group">
                <label htmlFor="ka-password">
                  {editMode ? "Password Baru" : "Password"}
                </label>

                <input
                  id="ka-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editMode
                      ? "Kosongkan jika tidak ingin mengubah"
                      : "Minimal 6 karakter"
                  }
                  disabled={saving}
                  autoComplete="new-password"
                />

                <small>
                  {editMode
                    ? "Password hanya perlu diisi jika ingin mengubah password."
                    : "Gunakan minimal 6 karakter untuk keamanan akun."}
                </small>
              </div>

              {/* KONFIRMASI PASSWORD */}

              {!editMode && (
                <div className="ka-form-group">
                  <label htmlFor="ka-konfirmasi">Konfirmasi Password</label>

                  <input
                    id="ka-konfirmasi"
                    type="password"
                    name="konfirmasi"
                    value={form.konfirmasi}
                    onChange={handleChange}
                    placeholder="Ketik ulang password"
                    disabled={saving}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="ka-modal-footer">
              <button
                type="button"
                className="ka-btn-cancel"
                onClick={closeModal}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="button"
                className="ka-btn-save"
                onClick={simpanAdmin}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="ka-button-spinner"></span>
                    Menyimpan...
                  </>
                ) : editMode ? (
                  "Simpan Perubahan"
                ) : (
                  "Simpan Admin"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
