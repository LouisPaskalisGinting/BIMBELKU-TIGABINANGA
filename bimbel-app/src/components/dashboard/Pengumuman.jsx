import { useEffect, useState } from "react";
import "./Pengumuman.css";

export default function Pengumuman() {
  const [pengumuman, setPengumuman] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    judul: "",
    isi: "",
  });

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =========================================================
  // AUTH HEADER
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
    fetchData();
  }, []);

  // =========================================================
  // GET DATA
  // =========================================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/pengumuman");

      if (!res.ok) {
        throw new Error("Gagal mengambil data pengumuman");
      }

      const data = await res.json();

      setPengumuman(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ERROR GET PENGUMUMAN:", error);

      setPengumuman([]);

      alert("Gagal mengambil data pengumuman.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      judul: "",
      isi: "",
    });

    setEditId(null);
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
  // TAMBAH
  // =========================================================

  const handleTambah = () => {
    resetForm();
    setShowModal(true);
  };

  // =========================================================
  // EDIT
  // =========================================================

  const handleEdit = (data) => {
    setForm({
      judul: data.judul || "",
      isi: data.isi || "",
    });

    setEditId(data.id);
    setShowModal(true);
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const judul = form.judul.trim();
    const isi = form.isi.trim();

    if (!judul) {
      alert("Judul pengumuman wajib diisi.");
      return;
    }

    if (!isi) {
      alert("Isi pengumuman wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const url = editId
        ? `http://localhost:3000/pengumuman/${editId}`
        : "http://localhost:3000/pengumuman";

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          judul,
          isi,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          alert("Sesi login telah berakhir. Silakan login kembali.");
          return;
        }

        alert(result.message || "Gagal menyimpan pengumuman.");
        return;
      }

      alert(
        result.message ||
          (editId
            ? "Pengumuman berhasil diperbarui."
            : "Pengumuman berhasil ditambahkan.")
      );

      resetForm();
      setShowModal(false);

      await fetchData();
    } catch (error) {
      console.error("ERROR SIMPAN PENGUMUMAN:", error);

      alert("Server tidak terhubung.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin menghapus pengumuman ini?"
    );

    if (!yakin) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/pengumuman/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          alert("Sesi login telah berakhir. Silakan login kembali.");
          return;
        }

        alert(result.message || "Gagal menghapus pengumuman.");
        return;
      }

      alert(result.message || "Pengumuman berhasil dihapus.");

      await fetchData();
    } catch (error) {
      console.error("ERROR DELETE PENGUMUMAN:", error);

      alert("Server tidak terhubung.");
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    resetForm();
  };

  // =========================================================
  // FORMAT TANGGAL
  // =========================================================

  const formatTanggal = (tanggal) => {
    if (!tanggal) {
      return "-";
    }

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="pg-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="pg-header">
        <div className="pg-header-content">
          <span className="pg-eyebrow">MANAJEMEN INFORMASI</span>

          <h1 className="pg-title">Pengumuman</h1>

          <p className="pg-subtitle">
            Kelola informasi dan pengumuman yang akan disampaikan kepada siswa.
          </p>
        </div>

        <button type="button" className="pg-btn-add" onClick={handleTambah}>
          <span className="pg-btn-add-icon">+</span>
          Tambah Pengumuman
        </button>
      </header>

      {/* =====================================================
          CONTENT CARD
      ===================================================== */}

      <section className="pg-card">
        {/* CARD HEADER */}

        <div className="pg-card-header">
          <div>
            <span className="pg-section-label">DAFTAR INFORMASI</span>

            <h2 className="pg-section-title">Pengumuman Terbaru</h2>

            <p className="pg-section-description">
              Daftar informasi yang telah dibuat dan tersedia untuk siswa.
            </p>
          </div>

          <div className="pg-total-badge">{pengumuman.length} Pengumuman</div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="pg-content">
          {loading ? (
            <div className="pg-loading">
              <div className="pg-loading-spinner"></div>

              <strong>Memuat pengumuman...</strong>

              <span>Mohon tunggu sebentar.</span>
            </div>
          ) : pengumuman.length === 0 ? (
            <div className="pg-empty">
              <div className="pg-empty-icon">📢</div>

              <h3>Belum Ada Pengumuman</h3>

              <p>
                Belum terdapat pengumuman yang tersedia. Silakan tambahkan
                pengumuman baru.
              </p>

              <button
                type="button"
                className="pg-btn-empty"
                onClick={handleTambah}
              >
                + Tambah Pengumuman
              </button>
            </div>
          ) : (
            <div className="pg-list">
              {pengumuman.map((item) => (
                <article className="pg-item" key={item.id}>
                  {/* ITEM HEADER */}

                  <div className="pg-item-header">
                    <div className="pg-item-icon">📢</div>

                    <div className="pg-item-heading">
                      <h3 className="pg-item-title">{item.judul}</h3>

                      <span className="pg-item-date">
                        {formatTanggal(item.tanggal)}
                      </span>
                    </div>
                  </div>

                  {/* ITEM CONTENT */}

                  <div className="pg-item-body">
                    <p>{item.isi}</p>
                  </div>

                  {/* ITEM FOOTER */}

                  <div className="pg-item-footer">
                    <span className="pg-item-status">● Aktif</span>

                    <div className="pg-item-actions">
                      <button
                        type="button"
                        className="pg-btn-edit"
                        onClick={() => handleEdit(item)}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        className="pg-btn-delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="pg-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="pg-modal" onMouseDown={(e) => e.stopPropagation()}>
            {/* MODAL HEADER */}

            <div className="pg-modal-header">
              <div>
                <span className="pg-modal-label">
                  {editId ? "EDIT INFORMASI" : "INFORMASI BARU"}
                </span>

                <h2>{editId ? "Edit Pengumuman" : "Tambah Pengumuman"}</h2>

                <p>
                  {editId
                    ? "Perbarui informasi pengumuman."
                    : "Tambahkan informasi baru untuk siswa."}
                </p>
              </div>

              <button
                type="button"
                className="pg-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form className="pg-form" onSubmit={handleSubmit}>
              {/* JUDUL */}

              <div className="pg-form-group">
                <label htmlFor="pg-judul">Judul Pengumuman</label>

                <input
                  id="pg-judul"
                  type="text"
                  name="judul"
                  placeholder="Contoh: Tryout Akbar 2026"
                  value={form.judul}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength={150}
                  className="pg-form-input"
                />

                <small>{form.judul.length}/150 karakter</small>
              </div>

              {/* ISI */}

              <div className="pg-form-group">
                <label htmlFor="pg-isi">Isi Pengumuman</label>

                <textarea
                  id="pg-isi"
                  name="isi"
                  placeholder="Tuliskan isi pengumuman di sini..."
                  value={form.isi}
                  onChange={handleChange}
                  disabled={saving}
                  rows="7"
                  maxLength={1000}
                  className="pg-form-textarea"
                />

                <small>{form.isi.length}/1000 karakter</small>
              </div>

              {/* FOOTER */}

              <div className="pg-modal-footer">
                <button
                  type="button"
                  className="pg-btn-cancel"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button type="submit" className="pg-btn-save" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="pg-button-spinner"></span>
                      Menyimpan...
                    </>
                  ) : editId ? (
                    "Simpan Perubahan"
                  ) : (
                    "Simpan Pengumuman"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
