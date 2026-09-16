import { useEffect, useState } from "react";
import "./GaleriModal.css";

export default function GaleriModal({ editData, onClose }) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [gambar, setGambar] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setJudul(editData.judul || "");
      setDeskripsi(editData.deskripsi || "");

      if (editData.gambar) {
        setPreview(`http://localhost:3000${editData.gambar}`);
      } else {
        setPreview("");
      }
    } else {
      setJudul("");
      setDeskripsi("");
      setGambar(null);
      setPreview("");
    }
  }, [editData]);

  const handleImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Format gambar harus JPG, JPEG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    setGambar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!judul.trim()) {
      alert("Judul foto wajib diisi.");
      return;
    }

    // Saat tambah, gambar wajib dipilih
    if (!editData && !gambar) {
      alert("Silakan pilih gambar terlebih dahulu.");
      return;
    }

    const formData = new FormData();

    formData.append("judul", judul.trim());
    formData.append("deskripsi", deskripsi.trim());

    if (gambar) {
      formData.append("gambar", gambar);
    }

    try {
      setSaving(true);

      let url = "http://localhost:3000/galeri";
      let method = "POST";

      if (editData) {
        url = `http://localhost:3000/galeri/${editData.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal menyimpan data galeri.");
      }

      alert(
        result.message ||
          (editData
            ? "Galeri berhasil diperbarui."
            : "Galeri berhasil ditambahkan.")
      );

      onClose();
    } catch (err) {
      console.error("Gagal menyimpan galeri:", err);
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glm-overlay">
      <div className="glm-modal">
        {/* ================= HEADER ================= */}
        <div className="glm-header">
          <div className="glm-header-icon">
            <span>▧</span>
          </div>

          <div className="glm-header-text">
            <h2>{editData ? "Edit Galeri" : "Tambah Galeri"}</h2>

            <p>
              {editData
                ? "Perbarui informasi foto galeri."
                : "Tambahkan foto baru ke galeri Bimbelku."}
            </p>
          </div>

          <button
            type="button"
            className="glm-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* ================= FORM ================= */}
        <form className="glm-form" onSubmit={handleSubmit}>
          {/* Judul */}
          <div className="glm-form-group">
            <label htmlFor="glm-judul">
              Judul Foto <span>*</span>
            </label>

            <input
              id="glm-judul"
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Masukkan judul foto"
              maxLength={150}
              required
              disabled={saving}
            />

            <div className="glm-counter">{judul.length}/150 karakter</div>
          </div>

          {/* Deskripsi */}
          <div className="glm-form-group">
            <label htmlFor="glm-deskripsi">Deskripsi</label>

            <textarea
              id="glm-deskripsi"
              rows="4"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Masukkan deskripsi foto"
              maxLength={500}
              disabled={saving}
            />

            <div className="glm-counter">{deskripsi.length}/500 karakter</div>
          </div>

          {/* Upload */}
          <div className="glm-form-group">
            <label htmlFor="glm-gambar">
              Upload Foto {!editData && <span>*</span>}
            </label>

            <div className="glm-upload-box">
              <div className="glm-upload-icon">↑</div>

              <div className="glm-upload-content">
                <strong>Pilih gambar</strong>
                <span>JPG, JPEG, PNG atau WEBP • Maksimal 5 MB</span>
              </div>

              <input
                id="glm-gambar"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImage}
                disabled={saving}
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="glm-preview-section">
              <div className="glm-preview-header">
                <span>Preview Foto</span>

                {gambar && <span className="glm-new-badge">Foto Baru</span>}
              </div>

              <div className="glm-preview-wrapper">
                <img
                  src={preview}
                  alt="Preview galeri"
                  className="glm-preview-image"
                />
              </div>
            </div>
          )}

          {/* ================= BUTTON ================= */}
          <div className="glm-buttons">
            <button
              type="button"
              className="glm-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>

            <button type="submit" className="glm-btn-save" disabled={saving}>
              {saving ? (
                <>
                  <span className="glm-spinner"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span>✓</span>
                  {editData ? "Simpan Perubahan" : "Simpan"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
