import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  // ===========================
  // API
  // ===========================

  const API_URL = "http://localhost:3000";

  // ===========================
  // STATE HERO
  // ===========================

  const [hero, setHero] = useState({
    title: "",
    subtitle: "",
    button_text: "",
    background: "",
  });

  const [heroSlides, setHeroSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ===========================
  // STATE ABOUT
  // ===========================

  const [about, setAbout] = useState({
    title: "",
    description: "",
    image: "",
  });

  // ===========================
  // STATE PROGRAM
  // ===========================

  const [program, setProgram] = useState([]);

  // ===========================
  // STATE TESTIMONIAL
  // ===========================

  const [testimonial, setTestimonial] = useState([]);

  // ===========================
  // STATE FAQ
  // ===========================

  const [faq, setFaq] = useState([]);

  // ===========================
  // STATE GALERI
  // ===========================

  const [galeri, setGaleri] = useState([]);

  // ===========================
  // STATE KONTAK
  // ===========================

  const [kontak, setKontak] = useState({
    id: null,
    nama_bimbel: "",
    alamat: "",
    telepon: "",
    whatsapp: "",
    email: "",
    instagram: "",
    facebook: "",
    youtube: "",
    maps: "",
  });

  const [activeFAQ, setActiveFAQ] = useState(null);

  // ===========================
  // USE EFFECT
  // ===========================

  useEffect(() => {
    fetchHero();
    fetchHeroSlides();
    fetchAbout();
    fetchProgram();
    fetchTestimonial();
    fetchFAQ();
    fetchGaleri();
    fetchKontak();
  }, []);

  // ===========================
  // AUTO SLIDER HERO
  // ===========================

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        return (prev + 1) % heroSlides.length;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [heroSlides]);

  // ===========================
  // NAVIGASI
  // ===========================

  const handleDaftar = () => {
    navigate("/Register");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  // ===========================
  // FETCH HERO
  // ===========================

  const fetchHero = async () => {
    try {
      const res = await fetch(`${API_URL}/hero`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data hero");
      }

      const data = await res.json();

      setHero(data || {});
    } catch (err) {
      console.error("ERROR FETCH HERO:", err);
    }
  };

  // ===========================
  // FETCH HERO SLIDER
  // ===========================

  const fetchHeroSlides = async () => {
    try {
      const res = await fetch(`${API_URL}/hero/background/aktif`);

      if (!res.ok) {
        throw new Error("Gagal mengambil background hero");
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setHeroSlides(data);
        setCurrentSlide(0);
      } else {
        setHeroSlides([]);
      }
    } catch (err) {
      console.error("ERROR FETCH HERO SLIDER:", err);

      setHeroSlides([]);
    }
  };

  // ===========================
  // FETCH ABOUT
  // ===========================

  const fetchAbout = async () => {
    try {
      const res = await fetch(`${API_URL}/about`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data about");
      }

      const data = await res.json();

      setAbout(data || {});
    } catch (err) {
      console.error("ERROR FETCH ABOUT:", err);
    }
  };

  // ===========================
  // FETCH PROGRAM
  // ===========================

  const fetchProgram = async () => {
    try {
      const res = await fetch(`${API_URL}/program/aktif`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data program");
      }

      const data = await res.json();

      setProgram(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR FETCH PROGRAM:", err);

      setProgram([]);
    }
  };

  // ===========================
  // FETCH TESTIMONIAL
  // ===========================

  const fetchTestimonial = async () => {
    try {
      const res = await fetch(`${API_URL}/testimonial`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data testimonial");
      }

      const data = await res.json();

      setTestimonial(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR FETCH TESTIMONIAL:", err);

      setTestimonial([]);
    }
  };

  // ===========================
  // FETCH FAQ
  // ===========================

  const fetchFAQ = async () => {
    try {
      const res = await fetch(`${API_URL}/faq`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data FAQ");
      }

      const data = await res.json();

      setFaq(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR FETCH FAQ:", err);

      setFaq([]);
    }
  };

  // ===========================
  // FETCH GALERI
  // ===========================

  const fetchGaleri = async () => {
    try {
      const res = await fetch(`${API_URL}/galeri`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data galeri");
      }

      const data = await res.json();

      setGaleri(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR FETCH GALERI:", err);

      setGaleri([]);
    }
  };

  // ===========================
  // FETCH KONTAK
  // ===========================

  const fetchKontak = async () => {
    try {
      const res = await fetch(`${API_URL}/kontak`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data kontak");
      }

      const data = await res.json();

      setKontak({
        id: data?.id || null,
        nama_bimbel: data?.nama_bimbel || "",
        alamat: data?.alamat || "",
        telepon: data?.telepon || "",
        whatsapp: data?.whatsapp || "",
        email: data?.email || "",
        instagram: data?.instagram || "",
        facebook: data?.facebook || "",
        youtube: data?.youtube || "",
        maps: data?.maps || "",
      });
    } catch (err) {
      console.error("ERROR FETCH KONTAK:", err);

      setKontak({
        id: null,
        nama_bimbel: "",
        alamat: "",
        telepon: "",
        whatsapp: "",
        email: "",
        instagram: "",
        facebook: "",
        youtube: "",
        maps: "",
      });
    }
  };

  // ===========================
  // FORMAT WHATSAPP
  // ===========================

  const getWhatsAppLink = (number) => {
    if (!number) return "#";

    let phone = String(number).replace(/\D/g, "");

    // 08xxxxxxxx -> 628xxxxxxxx
    if (phone.startsWith("0")) {
      phone = "62" + phone.substring(1);
    }

    // Jika belum menggunakan kode negara
    if (!phone.startsWith("62")) {
      phone = "62" + phone;
    }

    return `https://wa.me/${phone}`;
  };

  // ===========================
  // FORMAT TELEPON
  // ===========================

  const getPhoneLink = (number) => {
    if (!number) return "#";

    const phone = String(number).replace(/[^\d+]/g, "");

    return `tel:${phone}`;
  };

  // ===========================
  // FORMAT EMAIL
  // ===========================

  const getEmailLink = (email) => {
    if (!email) return "#";

    return `mailto:${email}`;
  };

  // ===========================
  // FORMAT SOCIAL MEDIA
  // ===========================

  const getSocialLink = (url) => {
    if (!url) return "#";

    const value = String(url).trim();

    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    return `https://${value}`;
  };

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="landing-container">
      {/* ================= NAVBAR ================= */}

      <header className="navbar">
        <div className="logo">
          <img src="/logobimbelku.png" alt="Logo Bimbelku" />
        </div>

        <nav className="nav-menu">
          <span onClick={() => scrollToSection("hero")}>Home</span>

          <span onClick={() => scrollToSection("about")}>About</span>

          <span onClick={() => scrollToSection("program")}>Program</span>

          <span onClick={() => scrollToSection("testimoni")}>Testimoni</span>

          <span onClick={() => scrollToSection("faq")}>FAQ</span>

          <span onClick={() => scrollToSection("galeri")}>Galeri</span>

          <span onClick={() => scrollToSection("kontak")}>Kontak</span>

          <button className="btn-login" onClick={() => navigate("/Login")}>
            Login
          </button>
        </nav>

        <button className="btn-daftar" onClick={handleDaftar}>
          {hero.button_text || "DAFTAR SEKARANG"}
        </button>
      </header>

      {/* ================= HERO ================= */}

      <section id="hero" className="hero">
        <div className="hero-slider">
          {heroSlides.length > 0
            ? heroSlides.map((slide, index) => (
                <img
                  key={slide.id}
                  src={`${API_URL}${slide.gambar}`}
                  alt={`Background Bimbelku ${index + 1}`}
                  className={
                    index === currentSlide ? "hero-slide active" : "hero-slide"
                  }
                />
              ))
            : hero.background && (
                <div
                  className="hero-slide active"
                  style={{
                    backgroundImage: `url(${API_URL}${hero.background})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}
        </div>

        <div className="hero-overlay">
          <div className="hero-text">
            <h1>{hero.title}</h1>

            <p>{hero.subtitle}</p>

            <button className="hero-btn" onClick={handleDaftar}>
              {hero.button_text || "DAFTAR SEKARANG"}
            </button>
          </div>
        </div>

        {heroSlides.length > 1 && (
          <div className="hero-slider-indicators">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={
                  index === currentSlide
                    ? "hero-indicator active"
                    : "hero-indicator"
                }
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= ABOUT ================= */}

      <section id="about" className="about">
        <div className="about-container">
          <div className="about-image">
            {about.image && (
              <img src={`${API_URL}${about.image}`} alt={about.title} />
            )}
          </div>

          <div className="about-content">
            <h2>{about.title}</h2>

            <p>{about.description}</p>
          </div>
        </div>
      </section>

      {/* ================= PROGRAM ================= */}

      <section id="program" className="program">
        <h2>Program Kami</h2>

        <div className="program-grid">
          {program.length === 0 ? (
            <p>Belum ada program tersedia.</p>
          ) : (
            program.map((item) => (
              <div className="program-card" key={item.id}>
                {item.gambar && (
                  <img
                    src={item.gambar}
                    alt={item.nama_program}
                    className="program-img"
                  />
                )}

                <h3>{item.nama_program}</h3>

                <p className="program-desc">{item.deskripsi}</p>

                <div className="program-info">
                  <span>Durasi : {item.durasi}</span>

                  <span>{item.jumlah_pertemuan} Pertemuan</span>
                </div>

                <div className="price-box">
                  Rp {Number(item.harga).toLocaleString("id-ID")}
                </div>

                <button className="btn-daftar-card" onClick={handleDaftar}>
                  Daftar Sekarang
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================= TESTIMONI ================= */}

      <section id="testimoni" className="testimoni">
        <h2>Testimoni Alumni</h2>

        <div className="testimoni-scroll">
          {testimonial.length === 0 ? (
            <p>Belum ada testimoni.</p>
          ) : (
            testimonial.map((item) => (
              <div className="testimoni-card" key={item.id}>
                <img src={`${API_URL}${item.foto}`} alt={item.nama} />

                <h4>{item.nama}</h4>

                <p>{item.asal_sekolah}</p>

                <p>{item.universitas}</p>

                <p className="pesan">"{item.pesan}"</p>

                <p className="signature">{item.signature}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================= FAQ ================= */}

      <section id="faq" className="faq">
        <h2>Pertanyaan Yang Sering Diajukan</h2>

        <div className="faq-container">
          {faq.length === 0 ? (
            <p>Belum ada FAQ.</p>
          ) : (
            faq.map((item) => (
              <div className="faq-item" key={item.id}>
                <div
                  className="faq-question"
                  onClick={() =>
                    setActiveFAQ(activeFAQ === item.id ? null : item.id)
                  }
                >
                  <h3>{item.question}</h3>

                  <span>{activeFAQ === item.id ? "-" : "+"}</span>
                </div>

                {activeFAQ === item.id && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================= GALERI ================= */}

      <section id="galeri" className="galeri">
        <h2>Galeri Kegiatan</h2>

        <div className="galeri-grid">
          {galeri.length === 0 ? (
            <p>Belum ada foto.</p>
          ) : (
            galeri.map((item) => (
              <div className="galeri-card" key={item.id}>
                <img src={`${API_URL}${item.gambar}`} alt={item.judul} />

                <div className="galeri-info">
                  <h4>{item.judul}</h4>

                  <p>{item.deskripsi}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================= KONTAK ================= */}

      <footer id="kontak" className="footer">
        <div className="footer-content">
          {/* ================= INFORMASI BIMBEL ================= */}

          <div className="footer-left">
            <h2>{kontak.nama_bimbel || "Bimbelku Tigabinanga"}</h2>

            {kontak.alamat && <p>📍 {kontak.alamat}</p>}

            {/* TELEPON */}

            {kontak.telepon && (
              <p>
                📞 <a href={getPhoneLink(kontak.telepon)}>{kontak.telepon}</a>
              </p>
            )}

            {/* WHATSAPP */}

            {kontak.whatsapp && (
              <p>
                📱{" "}
                <a
                  href={getWhatsAppLink(kontak.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {kontak.whatsapp}
                </a>
              </p>
            )}

            {/* EMAIL */}

            {kontak.email && (
              <p>
                ✉ <a href={getEmailLink(kontak.email)}>{kontak.email}</a>
              </p>
            )}
          </div>

          {/* ================= MEDIA SOSIAL ================= */}

          <div className="footer-right">
            <h3>Media Sosial</h3>

            {/* INSTAGRAM */}

            {kontak.instagram && (
              <p>
                <a
                  href={getSocialLink(kontak.instagram)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              </p>
            )}

            {/* FACEBOOK */}

            {kontak.facebook && (
              <p>
                <a
                  href={getSocialLink(kontak.facebook)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              </p>
            )}

            {/* YOUTUBE */}

            {kontak.youtube && (
              <p>
                <a
                  href={getSocialLink(kontak.youtube)}
                  target="_blank"
                  rel="noreferrer"
                >
                  YouTube
                </a>
              </p>
            )}
          </div>
        </div>
        {/* ================= FOOTER BOTTOM ================= */}

        <div className="footer-bottom">
          © {new Date().getFullYear()}{" "}
          {kontak.nama_bimbel || "Bimbelku Tigabinanga"}
        </div>
      </footer>
    </div>
  );
}
