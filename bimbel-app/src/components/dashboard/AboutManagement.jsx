import React, { useEffect, useState } from "react";
import "./AboutManagement.css";

export default function AboutManagement() {
  const [about, setAbout] = useState({
    id: 1,
    title: "",
    description: "",
    image: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/about");

      if (!res.ok) {
        throw new Error("Gagal mengambil data About");
      }

      const data = await res.json();
      setAbout(data);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data About");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAbout((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImage(null);
      return;
    }

    // Validasi format gambar
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Format gambar harus JPG, JPEG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }

    // Validasi ukuran maksimal 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!about.title.trim()) {
      alert("Judul wajib diisi.");
      return;
    }

    if (!about.description.trim()) {
      alert("Deskripsi wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", about.title);
      formData.append("description", about.description);

      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(`http://localhost:3000/about/${about.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Gagal memperbarui About");
      }

      alert("About berhasil diperbarui");

      setImage(null);

      // Reset input file
      const fileInput = document.getElementById("abt-image-input");
      if (fileInput) {
        fileInput.value = "";
      }

      await fetchAbout();
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui About");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="abt-page">
        <div className="abt-loading">
          <div className="abt-loading-spinner"></div>
          <p>Memuat data About...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="abt-page">
      {/* Header */}
      <div className="abt-header">
        <div>
          <h1>Kelola About</h1>
          <p>
            Kelola informasi tentang Bimbelku yang ditampilkan pada landing
            page.
          </p>
        </div>

        <div className="abt-header-icon">
          <span>ℹ</span>
        </div>
      </div>

      {/* Content */}
      <div className="abt-content">
        <div className="abt-card">
          <div className="abt-card-header">
            <div>
              <h2>Informasi About</h2>
              <p>Perbarui judul, deskripsi, dan gambar pada bagian About.</p>
            </div>
          </div>

          <form className="abt-form" onSubmit={handleSubmit}>
            {/* Judul */}
            <div className="abt-form-group">
              <label htmlFor="abt-title">
                Judul <span>*</span>
              </label>

              <input
                id="abt-title"
                type="text"
                name="title"
                value={about.title || ""}
                onChange={handleChange}
                placeholder="Masukkan judul About"
                maxLength={150}
              />

              <small>{about.title?.length || 0}/150 karakter</small>
            </div>

            {/* Deskripsi */}
            <div className="abt-form-group">
              <label htmlFor="abt-description">
                Deskripsi <span>*</span>
              </label>

              <textarea
                id="abt-description"
                rows="8"
                name="description"
                value={about.description || ""}
                onChange={handleChange}
                placeholder="Masukkan deskripsi mengenai Bimbelku..."
                maxLength={1000}
              />

              <small>{about.description?.length || 0}/1000 karakter</small>
            </div>

            {/* Gambar */}
            <div className="abt-form-group">
              <label htmlFor="abt-image-input">Gambar</label>

              <div className="abt-upload-wrapper">
                <input
                  id="abt-image-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                />

                <div className="abt-upload-info">
                  <span>Format: JPG, PNG, WEBP</span>
                  <span>Maksimal 5 MB</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            {about.image && (
              <div className="abt-preview-section">
                <div className="abt-preview-header">
                  <h3>Gambar Saat Ini</h3>
                </div>

                <div className="abt-preview-container">
                  <img
                    src={`http://localhost:3000${about.image}`}
                    className="abt-preview-image"
                    alt="Preview About"
                  />
                </div>
              </div>
            )}

            {/* File baru */}
            {image && (
              <div className="abt-selected-file">
                <div className="abt-file-icon">🖼️</div>

                <div className="abt-file-info">
                  <strong>{image.name}</strong>
                  <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>

                <button
                  type="button"
                  className="abt-remove-file"
                  onClick={() => {
                    setImage(null);

                    const fileInput =
                      document.getElementById("abt-image-input");

                    if (fileInput) {
                      fileInput.value = "";
                    }
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="abt-form-footer">
              <button
                type="button"
                className="abt-btn-secondary"
                onClick={fetchAbout}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="submit"
                className="abt-btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="abt-btn-spinner"></span>
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
    </div>
  );
}
