import { useEffect, useState } from "react";
import "./KontakManagement.css";

export default function KontakManagement() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKontak();
  }, []);

  const fetchKontak = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/kontak");

      if (!res.ok) {
        throw new Error("Gagal mengambil data kontak");
      }

      const data = await res.json();

      setForm(data || {});
    } catch (err) {
      console.error("Gagal mengambil data kontak:", err);
      alert("Gagal mengambil data kontak.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nama_bimbel?.trim()) {
      alert("Nama bimbel wajib diisi.");
      return;
    }

    if (!form.alamat?.trim()) {
      alert("Alamat wajib diisi.");
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert("Format email tidak valid.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`http://localhost:3000/kontak/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui kontak");
      }

      alert(data.message || "Data kontak berhasil diperbarui");

      await fetchKontak();
    } catch (err) {
      console.error("Gagal menyimpan kontak:", err);
      alert(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ktk-page">
        <div className="ktk-loading">
          <div className="ktk-spinner"></div>
          <p>Memuat data kontak...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ktk-page">
      {/* ================= HEADER ================= */}
      <div className="ktk-header">
        <div className="ktk-header-content">
          <div className="ktk-header-icon">
            <span>☎</span>
          </div>

          <div>
            <h1>Kelola Kontak</h1>
            <p>
              Kelola informasi kontak yang ditampilkan pada landing page
              Bimbelku.
            </p>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="ktk-summary">
        <div className="ktk-summary-card">
          <div className="ktk-summary-icon">☎</div>

          <div className="ktk-summary-info">
            <span>Status Informasi</span>
            <strong>Aktif</strong>
          </div>
        </div>

        <div className="ktk-summary-card">
          <div className="ktk-summary-icon">✉</div>

          <div className="ktk-summary-info">
            <span>Email</span>
            <strong>{form.email ? "Tersedia" : "Belum diisi"}</strong>
          </div>
        </div>
      </div>

      {/* ================= FORM CARD ================= */}
      <div className="ktk-card">
        <div className="ktk-card-header">
          <div>
            <h2>Informasi Kontak</h2>
            <p>Perbarui informasi kontak Bimbelku sesuai kebutuhan.</p>
          </div>
        </div>

        <form className="ktk-form" onSubmit={handleSubmit}>
          {/* ================= INFORMASI UTAMA ================= */}
          <div className="ktk-section">
            <div className="ktk-section-title">
              <span className="ktk-section-number">01</span>

              <div>
                <h3>Informasi Utama</h3>
                <p>Informasi identitas dan lokasi bimbel.</p>
              </div>
            </div>

            <div className="ktk-form-grid">
              {/* Nama Bimbel */}
              <div className="ktk-form-group ktk-full">
                <label htmlFor="ktk-nama-bimbel">
                  Nama Bimbel <span>*</span>
                </label>

                <input
                  id="ktk-nama-bimbel"
                  type="text"
                  name="nama_bimbel"
                  value={form.nama_bimbel || ""}
                  onChange={handleChange}
                  placeholder="Masukkan nama bimbel"
                  maxLength={150}
                />
              </div>

              {/* Alamat */}
              <div className="ktk-form-group ktk-full">
                <label htmlFor="ktk-alamat">
                  Alamat <span>*</span>
                </label>

                <textarea
                  id="ktk-alamat"
                  rows="4"
                  name="alamat"
                  value={form.alamat || ""}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap bimbel"
                  maxLength={500}
                />

                <small>{(form.alamat || "").length}/500 karakter</small>
              </div>
            </div>
          </div>

          {/* ================= KONTAK ================= */}
          <div className="ktk-section">
            <div className="ktk-section-title">
              <span className="ktk-section-number">02</span>

              <div>
                <h3>Informasi Komunikasi</h3>
                <p>Nomor telepon, WhatsApp, dan email.</p>
              </div>
            </div>

            <div className="ktk-form-grid">
              {/* Telepon */}
              <div className="ktk-form-group">
                <label htmlFor="ktk-telepon">Telepon</label>

                <input
                  id="ktk-telepon"
                  type="tel"
                  name="telepon"
                  value={form.telepon || ""}
                  onChange={handleChange}
                  placeholder="Contoh: 08123456789"
                  inputMode="numeric"
                />
              </div>

              {/* WhatsApp */}
              <div className="ktk-form-group">
                <label htmlFor="ktk-whatsapp">WhatsApp</label>

                <input
                  id="ktk-whatsapp"
                  type="tel"
                  name="whatsapp"
                  value={form.whatsapp || ""}
                  onChange={handleChange}
                  placeholder="Contoh: 08123456789"
                  inputMode="numeric"
                />
              </div>

              {/* Email */}
              <div className="ktk-form-group ktk-full">
                <label htmlFor="ktk-email">Email</label>

                <input
                  id="ktk-email"
                  type="email"
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  placeholder="Contoh: info@bimbelku.com"
                />
              </div>
            </div>
          </div>

          {/* ================= MEDIA SOSIAL ================= */}
          <div className="ktk-section">
            <div className="ktk-section-title">
              <span className="ktk-section-number">03</span>

              <div>
                <h3>Media Sosial</h3>
                <p>Tautan media sosial resmi Bimbelku.</p>
              </div>
            </div>

            <div className="ktk-form-grid">
              {/* Instagram */}
              <div className="ktk-form-group">
                <label htmlFor="ktk-instagram">Instagram</label>

                <input
                  id="ktk-instagram"
                  type="text"
                  name="instagram"
                  value={form.instagram || ""}
                  onChange={handleChange}
                  placeholder="https://instagram.com/..."
                />
              </div>

              {/* Facebook */}
              <div className="ktk-form-group">
                <label htmlFor="ktk-facebook">Facebook</label>

                <input
                  id="ktk-facebook"
                  type="text"
                  name="facebook"
                  value={form.facebook || ""}
                  onChange={handleChange}
                  placeholder="https://facebook.com/..."
                />
              </div>

              {/* YouTube */}
              <div className="ktk-form-group ktk-full">
                <label htmlFor="ktk-youtube">YouTube</label>

                <input
                  id="ktk-youtube"
                  type="text"
                  name="youtube"
                  value={form.youtube || ""}
                  onChange={handleChange}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="ktk-form-footer">
            <button
              type="button"
              className="ktk-btn-secondary"
              onClick={fetchKontak}
              disabled={saving}
            >
              Muat Ulang
            </button>

            <button className="ktk-btn-save" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <span className="ktk-btn-spinner"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
