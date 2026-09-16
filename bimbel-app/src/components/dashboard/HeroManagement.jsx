import React, { useEffect, useState } from "react";
import "./HeroManagement.css";

const API_URL = "http://localhost:3000";

export default function HeroManagement() {
  // =====================================================
  // DATA HERO
  // =====================================================

  const [hero, setHero] = useState({
    id: 1,
    title: "",
    subtitle: "",
    button_text: "",
    background: "",
  });

  // =====================================================
  // BACKGROUND SLIDER
  // =====================================================

  const [heroSlides, setHeroSlides] = useState([]);

  // File yang baru dipilih
  const [selectedImages, setSelectedImages] = useState([]);

  // Preview file yang baru dipilih
  const [previews, setPreviews] = useState([]);

  // Loading
  const [loadingHero, setLoadingHero] = useState(false);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [uploading, setUploading] = useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchHero();
    fetchHeroSlides();

    return () => {
      // Bersihkan object URL preview
      previews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // =====================================================
  // GET HERO
  // =====================================================

  const fetchHero = async () => {
    try {
      setLoadingHero(true);

      const res = await fetch(`${API_URL}/hero`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data hero.");
      }

      const data = await res.json();

      setHero({
        id: data.id || 1,
        title: data.title || "",
        subtitle: data.subtitle || "",
        button_text: data.button_text || "",
        background: data.background || "",
      });
    } catch (err) {
      console.error("Gagal mengambil data hero:", err);
    } finally {
      setLoadingHero(false);
    }
  };

  // =====================================================
  // GET BACKGROUND SLIDER
  // =====================================================

  const fetchHeroSlides = async () => {
    try {
      setLoadingSlides(true);

      const res = await fetch(`${API_URL}/hero/background`);

      if (!res.ok) {
        throw new Error("Gagal mengambil background hero.");
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setHeroSlides(data);
      } else {
        setHeroSlides([]);
      }
    } catch (err) {
      console.error("Gagal mengambil background hero:", err);
      setHeroSlides([]);
    } finally {
      setLoadingSlides(false);
    }
  };

  // =====================================================
  // HANDLE CHANGE HERO
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setHero((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // HANDLE MULTIPLE IMAGE
  // =====================================================

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    const validFiles = [];

    for (const file of files) {
      // Validasi format
      if (!allowedTypes.includes(file.type)) {
        alert(
          `File "${file.name}" tidak valid.\n\nFormat yang diperbolehkan: JPG, JPEG, PNG, WEBP.`
        );
        continue;
      }

      // Validasi ukuran
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" melebihi ukuran maksimal 5 MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    // Tambahkan file baru ke file sebelumnya
    const newFiles = [...selectedImages, ...validFiles];

    setSelectedImages(newFiles);

    // Buat preview
    const newPreviews = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input supaya file yang sama dapat dipilih kembali
    e.target.value = "";
  };

  // =====================================================
  // REMOVE SELECTED IMAGE
  // =====================================================

  const removeSelectedImage = (index) => {
    const removedPreview = previews[index];

    if (removedPreview?.url) {
      URL.revokeObjectURL(removedPreview.url);
    }

    setSelectedImages((prev) => prev.filter((_, i) => i !== index));

    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // =====================================================
  // CLEAR SELECTED IMAGES
  // =====================================================

  const clearSelectedImages = () => {
    previews.forEach((preview) => {
      if (preview.url) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setSelectedImages([]);
    setPreviews([]);
  };

  // =====================================================
  // SIMPAN INFORMASI HERO
  // =====================================================

  const handleSubmitHero = async (e) => {
    e.preventDefault();

    if (!hero.title.trim()) {
      alert("Judul hero wajib diisi.");
      return;
    }

    if (!hero.subtitle.trim()) {
      alert("Subtitle hero wajib diisi.");
      return;
    }

    if (!hero.button_text.trim()) {
      alert("Text tombol wajib diisi.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", hero.title.trim());
      formData.append("subtitle", hero.subtitle.trim());
      formData.append("button_text", hero.button_text.trim());

      const res = await fetch(`${API_URL}/hero/${hero.id}`, {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal memperbarui informasi hero.");
      }

      alert(result.message || "Informasi hero berhasil diperbarui.");

      fetchHero();
    } catch (err) {
      console.error("Gagal memperbarui hero:", err);

      alert(
        err.message || "Terjadi kesalahan saat memperbarui informasi hero."
      );
    }
  };

  // =====================================================
  // UPLOAD BANYAK BACKGROUND
  // =====================================================

  const handleUploadImages = async () => {
    if (selectedImages.length === 0) {
      alert("Silakan pilih minimal satu gambar background.");
      return;
    }

    try {
      setUploading(true);

      let successCount = 0;
      let failedCount = 0;

      /*
       * Upload satu per satu.
       *
       * Ini dibuat seperti ini agar backend yang menggunakan:
       * upload.single("gambar")
       *
       * tetap dapat digunakan.
       */

      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];

        const formData = new FormData();

        formData.append("gambar", file);

        // Urutan berdasarkan data yang dipilih
        formData.append("urutan", heroSlides.length + i + 1);

        formData.append("status", "aktif");

        try {
          const res = await fetch(`${API_URL}/hero/background`, {
            method: "POST",
            body: formData,
          });

          const result = await res.json();

          if (!res.ok) {
            console.error(`Gagal upload ${file.name}:`, result);

            failedCount++;
            continue;
          }

          successCount++;
        } catch (err) {
          console.error(`Gagal upload ${file.name}:`, err);
          failedCount++;
        }
      }

      clearSelectedImages();

      await fetchHeroSlides();

      if (failedCount === 0) {
        alert(
          `${successCount} background berhasil ditambahkan ke Hero Slider.`
        );
      } else {
        alert(
          `${successCount} background berhasil ditambahkan.\n${failedCount} background gagal diupload.`
        );
      }
    } catch (err) {
      console.error("Gagal mengupload background:", err);

      alert("Terjadi kesalahan saat mengupload background.");
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // HAPUS BACKGROUND
  // =====================================================

  const handleDeleteSlide = async (id) => {
    const konfirmasi = window.confirm(
      "Apakah Anda yakin ingin menghapus background ini?"
    );

    if (!konfirmasi) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/hero/background/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal menghapus background.");
      }

      alert(result.message || "Background berhasil dihapus.");

      fetchHeroSlides();
    } catch (err) {
      console.error("Gagal menghapus background:", err);

      alert(err.message || "Terjadi kesalahan saat menghapus background.");
    }
  };

  // =====================================================
  // AKTIF / NONAKTIF
  // =====================================================

  const handleToggleStatus = async (slide) => {
    const newStatus = slide.status === "aktif" ? "nonaktif" : "aktif";

    try {
      const formData = new FormData();

      formData.append("status", newStatus);
      formData.append("urutan", slide.urutan || 0);

      const res = await fetch(`${API_URL}/hero/background/${slide.id}`, {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal mengubah status background.");
      }

      fetchHeroSlides();
    } catch (err) {
      console.error("Gagal mengubah status background:", err);

      alert(
        err.message || "Terjadi kesalahan saat mengubah status background."
      );
    }
  };

  // =====================================================
  // URL BACKGROUND
  // =====================================================

  const getImageUrl = (gambar) => {
    if (!gambar) {
      return "";
    }

    if (gambar.startsWith("http")) {
      return gambar;
    }

    return `${API_URL}${gambar}`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="hm-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="hm-header">
        <div className="hm-eyebrow">LANDING PAGE</div>

        <h1 className="hm-title">Kelola Hero Section</h1>

        <p className="hm-subtitle">
          Kelola informasi utama dan beberapa gambar background yang akan
          ditampilkan secara bergantian pada landing page.
        </p>
      </div>

      {/* =================================================
          CARD INFORMASI HERO
      ================================================= */}

      <div className="hm-card">
        <div className="hm-card-header">
          <div>
            <span className="hm-section-label">HERO SECTION</span>

            <h2 className="hm-section-title">Pengaturan Hero</h2>

            <p className="hm-section-description">
              Perbarui informasi utama yang akan ditampilkan kepada pengunjung
              website.
            </p>
          </div>

          <div className="hm-status-badge">● Aktif</div>
        </div>

        <form className="hm-form" onSubmit={handleSubmitHero}>
          {/* =================================================
              LEFT FORM
          ================================================= */}

          <div className="hm-form-content">
            {/* JUDUL */}

            <div className="hm-field">
              <label htmlFor="hm-title">
                Judul Hero
                <span>*</span>
              </label>

              <input
                id="hm-title"
                type="text"
                name="title"
                value={hero.title}
                onChange={handleChange}
                placeholder="Contoh: Belajar Lebih Mudah Bersama Bimbelku"
              />

              <small>Judul utama yang akan menjadi perhatian pengunjung.</small>
            </div>

            {/* SUBTITLE */}

            <div className="hm-field">
              <label htmlFor="hm-subtitle">
                Subtitle
                <span>*</span>
              </label>

              <textarea
                id="hm-subtitle"
                name="subtitle"
                rows="5"
                value={hero.subtitle}
                onChange={handleChange}
                placeholder="Masukkan deskripsi singkat mengenai Bimbelku..."
              />

              <small>Gunakan deskripsi singkat dan informatif.</small>
            </div>

            {/* BUTTON */}

            <div className="hm-field">
              <label htmlFor="hm-button">
                Text Tombol
                <span>*</span>
              </label>

              <input
                id="hm-button"
                type="text"
                name="button_text"
                value={hero.button_text}
                onChange={handleChange}
                placeholder="Contoh: Daftar Sekarang"
              />

              <small>Text yang akan ditampilkan pada tombol utama hero.</small>
            </div>

            {/* =================================================
                MULTIPLE BACKGROUND
            ================================================= */}

            <div className="hm-field">
              <label htmlFor="hm-background">Background Hero</label>

              <div className="hm-file-wrapper">
                <input
                  id="hm-background"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                />

                <div className="hm-file-info">
                  <span>📷</span>

                  <div>
                    <strong>Pilih beberapa gambar background</strong>

                    <small>JPG, PNG, WEBP • Maksimal 5 MB per gambar</small>
                  </div>
                </div>
              </div>

              <small>
                Anda dapat memilih lebih dari satu gambar sekaligus. Gambar akan
                ditampilkan bergantian pada landing page.
              </small>
            </div>

            {/* =================================================
                PREVIEW FILE BARU
            ================================================= */}

            {previews.length > 0 && (
              <div className="hm-new-images">
                <div className="hm-new-images-header">
                  <div>
                    <strong>Gambar yang akan ditambahkan</strong>

                    <span>{previews.length} gambar</span>
                  </div>

                  <button
                    type="button"
                    className="hm-clear-btn"
                    onClick={clearSelectedImages}
                  >
                    Hapus Semua
                  </button>
                </div>

                <div className="hm-new-images-grid">
                  {previews.map((item, index) => (
                    <div className="hm-new-image" key={item.id}>
                      <img src={item.url} alt={`Preview ${index + 1}`} />

                      <div className="hm-new-image-number">{index + 1}</div>

                      <button
                        type="button"
                        className="hm-remove-image"
                        onClick={() => removeSelectedImage(index)}
                        title="Hapus gambar"
                      >
                        ×
                      </button>

                      <div className="hm-new-image-name">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================
                ACTION
            ================================================= */}

            <div className="hm-form-actions">
              <button
                type="submit"
                className="hm-btn-save"
                disabled={loadingHero}
              >
                <span>✓</span>

                {loadingHero ? "Menyimpan..." : "Simpan Informasi Hero"}
              </button>

              <button
                type="button"
                className="hm-btn-upload"
                onClick={handleUploadImages}
                disabled={uploading || selectedImages.length === 0}
              >
                <span>⬆</span>

                {uploading
                  ? "Mengupload..."
                  : `Tambahkan ${selectedImages.length} Background`}
              </button>
            </div>
          </div>

          {/* =================================================
              RIGHT PREVIEW
          ================================================= */}

          <div className="hm-preview-section">
            <div className="hm-preview-header">
              <div>
                <span className="hm-section-label">PREVIEW</span>

                <h3 className="hm-preview-title">Tampilan Hero</h3>
              </div>
            </div>

            <div className="hm-preview-card">
              {previews.length > 0 ? (
                <div
                  className="hm-preview-background"
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        90deg,
                        rgba(15, 23, 42, 0.82),
                        rgba(15, 23, 42, 0.42)
                      ),
                      url("${previews[0].url}")
                    `,
                  }}
                >
                  <div className="hm-preview-content">
                    <span className="hm-preview-badge">BIMBELKU</span>

                    <h2>{hero.title || "Judul Hero Anda"}</h2>

                    <p>
                      {hero.subtitle || "Subtitle hero akan tampil di sini."}
                    </p>

                    <button type="button" className="hm-preview-button">
                      {hero.button_text || "Daftar Sekarang"}
                    </button>
                  </div>
                </div>
              ) : heroSlides.length > 0 ? (
                <div
                  className="hm-preview-background"
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        90deg,
                        rgba(15, 23, 42, 0.82),
                        rgba(15, 23, 42, 0.42)
                      ),
                      url("${getImageUrl(heroSlides[0].gambar)}")
                    `,
                  }}
                >
                  <div className="hm-preview-content">
                    <span className="hm-preview-badge">BIMBELKU</span>

                    <h2>{hero.title || "Judul Hero Anda"}</h2>

                    <p>
                      {hero.subtitle || "Subtitle hero akan tampil di sini."}
                    </p>

                    <button type="button" className="hm-preview-button">
                      {hero.button_text || "Daftar Sekarang"}
                    </button>
                  </div>
                </div>
              ) : hero.background ? (
                <div
                  className="hm-preview-background"
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        90deg,
                        rgba(15, 23, 42, 0.82),
                        rgba(15, 23, 42, 0.42)
                      ),
                      url("${getImageUrl(hero.background)}")
                    `,
                  }}
                >
                  <div className="hm-preview-content">
                    <span className="hm-preview-badge">BIMBELKU</span>

                    <h2>{hero.title || "Judul Hero Anda"}</h2>

                    <p>
                      {hero.subtitle || "Subtitle hero akan tampil di sini."}
                    </p>

                    <button type="button" className="hm-preview-button">
                      {hero.button_text || "Daftar Sekarang"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hm-preview-empty">
                  <div className="hm-preview-empty-icon">🖼️</div>

                  <strong>Belum ada background</strong>

                  <span>
                    Pilih beberapa gambar untuk menambahkan background hero.
                  </span>
                </div>
              )}
            </div>

            <div className="hm-preview-info">
              <span className="hm-info-icon">💡</span>

              <p>
                Background yang aktif akan ditampilkan secara otomatis
                bergantian pada landing page.
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* =====================================================
          DAFTAR BACKGROUND SLIDER
      ===================================================== */}

      <div className="hm-card hm-slider-card">
        <div className="hm-card-header">
          <div>
            <span className="hm-section-label">HERO SLIDER</span>

            <h2 className="hm-section-title">Daftar Background</h2>

            <p className="hm-section-description">
              Kelola gambar yang akan digunakan sebagai background slider pada
              landing page.
            </p>
          </div>

          <div className="hm-count-badge">{heroSlides.length} Background</div>
        </div>

        {/* LOADING */}

        {loadingSlides ? (
          <div className="hm-loading">Memuat background...</div>
        ) : heroSlides.length === 0 ? (
          <div className="hm-empty-slides">
            <div className="hm-empty-slides-icon">🖼️</div>

            <strong>Belum ada background slider</strong>

            <span>Tambahkan beberapa gambar menggunakan form di atas.</span>
          </div>
        ) : (
          <div className="hm-slider-grid">
            {heroSlides.map((slide, index) => (
              <div className="hm-slider-item" key={slide.id}>
                {/* IMAGE */}

                <div className="hm-slider-image-wrapper">
                  <img
                    src={getImageUrl(slide.gambar)}
                    alt={`Background Hero ${index + 1}`}
                    className="hm-slider-image"
                  />

                  <div className="hm-slider-number">{index + 1}</div>

                  <div
                    className={
                      slide.status === "aktif"
                        ? "hm-slider-status active"
                        : "hm-slider-status inactive"
                    }
                  >
                    {slide.status === "aktif" ? "● Aktif" : "● Nonaktif"}
                  </div>
                </div>

                {/* DETAIL */}

                <div className="hm-slider-detail">
                  <div className="hm-slider-filename">
                    Background #{index + 1}
                  </div>

                  <div className="hm-slider-actions">
                    <button
                      type="button"
                      className={
                        slide.status === "aktif"
                          ? "hm-btn-toggle active"
                          : "hm-btn-toggle"
                      }
                      onClick={() => handleToggleStatus(slide)}
                    >
                      {slide.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                    </button>

                    <button
                      type="button"
                      className="hm-btn-delete"
                      onClick={() => handleDeleteSlide(slide.id)}
                    >
                      🗑 Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
