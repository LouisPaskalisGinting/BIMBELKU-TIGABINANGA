import { useEffect, useState } from "react";
import "./Register.css";

export default function Register() {
  const [programList, setProgramList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [form, setForm] = useState({
    nama: "",
    kelas: "",
    asal_sekolah: "",
    no_hp: "",
    nama_orangtua: "",
    no_hp_orangtua: "",
    program_id: "",
    email: "",
    password: "",
    nominal_pembayaran: "",
  });

  const [buktiPembayaran, setBuktiPembayaran] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchProgram();

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // ========================================
  // FETCH PROGRAM
  // ========================================

  const fetchProgram = async () => {
    try {
      const res = await fetch("http://localhost:3000/program");

      if (!res.ok) {
        throw new Error("Gagal mengambil program");
      }

      const data = await res.json();

      setProgramList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal ambil program:", error);

      setMessage({
        type: "error",
        text: "Program belum dapat dimuat. Pastikan server aktif.",
      });
    }
  };

  // ========================================
  // HANDLE INPUT
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage({
      type: "",
      text: "",
    });
  };

  // ========================================
  // NOMOR HP SISWA
  // ========================================

  const handleNoHpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      no_hp: value,
    }));
  };

  // ========================================
  // NOMOR HP ORANG TUA
  // ========================================

  const handleNoHpOrangtuaChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      no_hp_orangtua: value,
    }));
  };

  // ========================================
  // NOMINAL PEMBAYARAN
  // ========================================

  const handleNominalChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      nominal_pembayaran: value,
    }));
  };

  // ========================================
  // FORMAT RUPIAH
  // ========================================

  const formatRupiah = (value) => {
    if (!value) return "";

    return `Rp ${Number(value).toLocaleString("id-ID")}`;
  };

  // ========================================
  // BUKTI PEMBAYARAN
  // ========================================

  const handleBuktiChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Bukti pembayaran harus berupa gambar.",
      });

      e.target.value = "";
      return;
    }

    // Maksimal 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Ukuran gambar maksimal 5 MB.",
      });

      e.target.value = "";
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const imageUrl = URL.createObjectURL(file);

    setBuktiPembayaran(file);
    setPreview(imageUrl);

    setMessage({
      type: "",
      text: "",
    });
  };

  // ========================================
  // VALIDASI EMAIL
  // ========================================

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email.trim().toLowerCase());
  };

  // ========================================
  // VALIDASI
  // ========================================

  const validateForm = () => {
    if (
      !form.nama.trim() ||
      !form.kelas.trim() ||
      !form.asal_sekolah.trim() ||
      !form.no_hp ||
      !form.nama_orangtua.trim() ||
      !form.no_hp_orangtua ||
      !form.program_id ||
      !form.email.trim() ||
      !form.password ||
      !form.nominal_pembayaran
    ) {
      return "Semua data wajib diisi.";
    }

    if (!isValidEmail(form.email)) {
      return "Format email tidak valid. Contoh: nama@gmail.com";
    }

    if (!/^[0-9]{10,15}$/.test(form.no_hp)) {
      return "Nomor HP siswa harus terdiri dari 10-15 digit.";
    }

    if (!/^[0-9]{10,15}$/.test(form.no_hp_orangtua)) {
      return "Nomor HP orang tua harus terdiri dari 10-15 digit.";
    }

    if (form.password.length < 6) {
      return "Password minimal terdiri dari 6 karakter.";
    }

    const nominal = Number(form.nominal_pembayaran);

    if (!Number.isInteger(nominal) || nominal <= 0) {
      return "Nominal pembayaran harus lebih dari 0.";
    }

    if (!buktiPembayaran) {
      return "Bukti pembayaran wajib diupload.";
    }

    return null;
  };

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    const validationError = validateForm();

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("nama", form.nama.trim());
      formData.append("kelas", form.kelas.trim());
      formData.append("asal_sekolah", form.asal_sekolah.trim());
      formData.append("no_hp", form.no_hp);
      formData.append("nama_orangtua", form.nama_orangtua.trim());
      formData.append("no_hp_orangtua", form.no_hp_orangtua);
      formData.append("program_id", form.program_id);
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("password", form.password);
      formData.append("nominal_pembayaran", form.nominal_pembayaran);
      formData.append("bukti_pembayaran", buktiPembayaran);

      const res = await fetch("http://localhost:3000/register/siswa", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("RESP REGISTER:", data);

      if (!res.ok) {
        throw new Error(data.message || "Gagal melakukan pendaftaran.");
      }

      setMessage({
        type: "success",
        text: "Pendaftaran berhasil! Pembayaran sedang menunggu verifikasi admin.",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 1800);
    } catch (error) {
      console.error("ERROR REGISTER:", error);

      setMessage({
        type: "error",
        text: error.message || "Server tidak terhubung. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // HAPUS BUKTI
  // ========================================

  const removeBukti = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setBuktiPembayaran(null);

    const fileInput = document.getElementById("bukti-pembayaran");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="register-page">
      {/* =====================================
          NAVBAR
      ====================================== */}

      <header className="register-navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand">
            <div className="brand-icon">🎓</div>

            <div>
              <strong>Bimbelku</strong>
              <span>Learning Center</span>
            </div>
          </a>

          <a href="/" className="navbar-back">
            ← Kembali ke Beranda
          </a>
        </div>
      </header>

      {/* =====================================
          MAIN
      ====================================== */}

      <main className="register-main">
        <div className="register-header">
          <div className="header-badge">Pendaftaran Siswa</div>

          <h1>
            Mulai Perjalanan
            <span> Belajarmu</span>
          </h1>

          <p>
            Lengkapi data berikut untuk melakukan pendaftaran sebagai siswa.
          </p>
        </div>

        {/* =====================================
            MESSAGE
        ====================================== */}

        {message.text && (
          <div className={`form-message ${message.type}`}>
            <div className="message-icon">
              {message.type === "success" ? "✓" : "!"}
            </div>

            <div>
              <strong>
                {message.type === "success" ? "Berhasil" : "Perhatian"}
              </strong>

              <p>{message.text}</p>
            </div>
          </div>
        )}

        {/* =====================================
            FORM CARD
        ====================================== */}

        <form className="register-card" onSubmit={handleSubmit}>
          {/* =====================================
              DATA SISWA
          ====================================== */}

          <section className="form-section">
            <div className="section-heading">
              <div className="section-number">01</div>

              <div>
                <h2>Data Siswa</h2>

                <p>Masukkan informasi pribadi siswa.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Nama Lengkap
                  <span>*</span>
                </label>

                <input
                  name="nama"
                  placeholder="Masukkan nama lengkap"
                  value={form.nama}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label>
                  Kelas
                  <span>*</span>
                </label>

                <input
                  name="kelas"
                  placeholder="Contoh: XII IPA 1"
                  value={form.kelas}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Asal Sekolah
                  <span>*</span>
                </label>

                <input
                  name="asal_sekolah"
                  placeholder="Masukkan nama sekolah"
                  value={form.asal_sekolah}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Nomor HP Siswa
                  <span>*</span>
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  name="no_hp"
                  placeholder="08xxxxxxxxxx"
                  value={form.no_hp}
                  onChange={handleNoHpChange}
                  maxLength={15}
                />

                <small>10-15 digit angka</small>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* =====================================
              ORANG TUA
          ====================================== */}

          <section className="form-section">
            <div className="section-heading">
              <div className="section-number">02</div>

              <div>
                <h2>Data Orang Tua</h2>

                <p>Data orang tua/wali siswa.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Nama Orang Tua
                  <span>*</span>
                </label>

                <input
                  name="nama_orangtua"
                  placeholder="Masukkan nama orang tua"
                  value={form.nama_orangtua}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Nomor HP Orang Tua
                  <span>*</span>
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  name="no_hp_orangtua"
                  placeholder="08xxxxxxxxxx"
                  value={form.no_hp_orangtua}
                  onChange={handleNoHpOrangtuaChange}
                  maxLength={15}
                />

                <small>10-15 digit angka</small>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* =====================================
              PROGRAM & AKUN
          ====================================== */}

          <section className="form-section">
            <div className="section-heading">
              <div className="section-number">03</div>

              <div>
                <h2>Program & Akun</h2>

                <p>Pilih program dan buat akun siswa.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  Pilih Program
                  <span>*</span>
                </label>

                <select
                  name="program_id"
                  value={form.program_id}
                  onChange={handleChange}
                >
                  <option value="">Pilih program pembelajaran</option>

                  {programList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_program} — Rp{" "}
                      {Number(p.harga).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Email
                  <span>*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="nama@gmail.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label>
                  Password
                  <span>*</span>
                </label>

                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* =====================================
              PEMBAYARAN
          ====================================== */}

          <section className="form-section">
            <div className="section-heading">
              <div className="section-number">04</div>

              <div>
                <h2>Pembayaran</h2>

                <p>Upload bukti pembayaran program.</p>
              </div>
            </div>

            <div className="payment-layout">
              {/* NOMINAL */}

              <div className="payment-info">
                <div className="form-group">
                  <label>
                    Nominal Pembayaran
                    <span>*</span>
                  </label>

                  <div className="nominal-wrapper">
                    <input
                      type="text"
                      inputMode="numeric"
                      name="nominal_pembayaran"
                      placeholder="0"
                      value={
                        form.nominal_pembayaran
                          ? Number(form.nominal_pembayaran).toLocaleString(
                              "id-ID"
                            )
                          : ""
                      }
                      onChange={handleNominalChange}
                    />
                  </div>

                  {form.nominal_pembayaran && (
                    <div className="nominal-preview">
                      {formatRupiah(form.nominal_pembayaran)}
                    </div>
                  )}
                </div>

                <div className="payment-note">
                  <span>ⓘ</span>

                  <p>
                    Pastikan nominal pembayaran sesuai dengan biaya program yang
                    dipilih.
                  </p>
                </div>
              </div>

              {/* UPLOAD */}

              <div className="upload-area">
                <label className="upload-label">
                  Bukti Pembayaran
                  <span>*</span>
                </label>

                {!preview ? (
                  <label htmlFor="bukti-pembayaran" className="upload-dropzone">
                    <div className="upload-icon">↑</div>

                    <strong>Upload bukti pembayaran</strong>

                    <span>Klik untuk memilih gambar</span>

                    <small>JPG, JPEG, PNG • Maks. 5 MB</small>

                    <input
                      id="bukti-pembayaran"
                      type="file"
                      accept="image/*"
                      onChange={handleBuktiChange}
                    />
                  </label>
                ) : (
                  <div className="preview-wrapper">
                    <img
                      src={preview}
                      alt="Preview Bukti Pembayaran"
                      className="preview-image"
                    />

                    <div className="preview-info">
                      <div>
                        <strong>Bukti pembayaran siap</strong>

                        <span>{buktiPembayaran?.name}</span>
                      </div>

                      <button
                        type="button"
                        className="remove-file"
                        onClick={removeBukti}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =====================================
              FOOTER FORM
          ====================================== */}

          <div className="form-footer">
            <div className="required-info">
              <span>*</span>
              Semua field wajib diisi
            </div>

            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Memproses...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="login-link">
          Sudah memiliki akun?
          <a href="/"> Login di sini</a>
        </p>
      </main>

      <footer className="register-footer">
        © {new Date().getFullYear()} EduCenter. All rights reserved.
      </footer>
    </div>
  );
}
