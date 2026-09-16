import React from "react";
import { useNavigate } from "react-router-dom";
import "./KelolaLandingpage.css";

export default function LandingManagement() {
  const navigate = useNavigate();

  const menu = [
    {
      title: "Hero Section",
      description: "Kelola banner utama dan informasi pembuka landing page.",
      icon: "🏠",
      code: "01",
      route: "/landing/hero",
    },
    {
      title: "About Us",
      description: "Atur informasi tentang BIMBELKU dan profil lembaga.",
      icon: "📖",
      code: "02",
      route: "/landing/about",
    },
    {
      title: "Testimoni",
      description: "Kelola testimoni dan pengalaman siswa.",
      icon: "⭐",
      code: "03",
      route: "/landing/testimoni",
    },
    {
      title: "FAQ",
      description: "Kelola pertanyaan dan jawaban yang sering ditanyakan.",
      icon: "❓",
      code: "04",
      route: "/landing/faq",
    },
    {
      title: "Kontak",
      description: "Atur informasi kontak dan kanal komunikasi BIMBELKU.",
      icon: "📞",
      code: "05",
      route: "/landing/kontak",
    },
    {
      title: "Galeri",
      description: "Kelola foto dan dokumentasi kegiatan bimbel.",
      icon: "🖼️",
      code: "06",
      route: "/landing/galeri",
    },
  ];

  return (
    <div className="landing-management">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="landing-header">
        <div className="landing-heading">
          <div className="landing-eyebrow">
            <span></span>
            WEBSITE MANAGEMENT
          </div>

          <h1>Kelola Landing Page</h1>

          <p>
            Kelola seluruh konten yang ditampilkan pada landing page BIMBELKU
            TIGABINANGA melalui panel administrasi.
          </p>
        </div>

        <div className="landing-header-info">
          <div className="landing-header-icon">◈</div>

          <div>
            <strong>Landing Page</strong>
            <span>Content Management</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          INFO BAR
          ===================================================== */}

      <section className="landing-info-bar">
        <div className="landing-info-left">
          <div className="landing-info-icon">✦</div>

          <div>
            <strong>Konten Website</strong>

            <span>Pilih bagian landing page yang ingin dikelola.</span>
          </div>
        </div>

        <div className="landing-section-count">
          <strong>{menu.length}</strong>
          <span>SECTION</span>
        </div>
      </section>

      {/* =====================================================
          SECTION GRID
          ===================================================== */}

      <section className="landing-grid">
        {menu.map((item) => (
          <button
            key={item.title}
            className="landing-card"
            onClick={() => navigate(item.route)}
          >
            {/* CARD TOP */}

            <div className="landing-card-top">
              <span className="landing-number">{item.code}</span>

              <span className="landing-arrow">↗</span>
            </div>

            {/* ICON */}

            <div className="landing-icon">{item.icon}</div>

            {/* CONTENT */}

            <div className="landing-card-content">
              <h3>{item.title}</h3>

              <p>{item.description}</p>
            </div>

            {/* FOOTER */}

            <div className="landing-card-footer">
              <span>Kelola konten</span>

              <span className="landing-card-line"></span>

              <span className="landing-card-arrow">→</span>
            </div>
          </button>
        ))}
      </section>

      {/* =====================================================
          FOOTER NOTE
          ===================================================== */}

      <div className="landing-footer-note">
        <span className="landing-online-dot"></span>

        <span>Perubahan konten akan digunakan pada landing page utama.</span>
      </div>
    </div>
  );
}
