import { useEffect, useState } from "react";
import "./DataDiri.css";

export default function DataDiri() {
  const API_URL = "http://localhost:3000";

  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);

  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // AMBIL TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // HELPER HEADER
  // =====================================================

  const getHeaders = () => {
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  // =====================================================
  // AMBIL USER YANG SEDANG LOGIN
  // =====================================================

  const fetchUserLogin = async () => {
    const token = getToken();

    if (!token) {
      throw new Error("Token login tidak ditemukan.");
    }

    console.log("=================================");
    console.log("MENGAMBIL USER LOGIN");
    console.log("=================================");

    const res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: getHeaders(),
    });

    const result = await res.json();

    console.log("STATUS AUTH/ME:", res.status);
    console.log("HASIL AUTH/ME:", result);

    if (!res.ok) {
      throw new Error(
        result.message || "Gagal mengambil informasi akun login."
      );
    }

    if (!result.user) {
      throw new Error("Data user login tidak ditemukan.");
    }

    return result.user;
  };

  // =====================================================
  // AMBIL DATA SISWA BERDASARKAN USER ID
  // =====================================================

  const fetchSiswaByUser = async (userId) => {
    if (!userId) {
      throw new Error("ID user tidak ditemukan.");
    }

    console.log("=================================");
    console.log("MENGAMBIL DATA SISWA");
    console.log("USER ID:", userId);
    console.log("=================================");

    const url = `${API_URL}/siswa/user/${userId}`;

    console.log("REQUEST:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    const result = await res.json();

    console.log("STATUS DATA SISWA:", res.status);
    console.log("HASIL DATA SISWA:", result);

    if (!res.ok) {
      throw new Error(
        result.message || "Data siswa belum terhubung dengan akun."
      );
    }

    if (!result.id) {
      throw new Error("Data siswa tidak valid.");
    }

    return result;
  };

  // =====================================================
  // FETCH DATA UTAMA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      // -----------------------------------------------
      // 1. AMBIL USER LOGIN
      // -----------------------------------------------

      const userLogin = await fetchUserLogin();

      console.log("=================================");
      console.log("USER LOGIN");
      console.log("=================================");
      console.log(userLogin);

      setUser(userLogin);

      // -----------------------------------------------
      // 2. AMBIL SISWA BERDASARKAN USER.ID
      // -----------------------------------------------

      const siswaData = await fetchSiswaByUser(userLogin.id);

      console.log("=================================");
      console.log("DATA SISWA BERHASIL");
      console.log("=================================");
      console.log(siswaData);

      // -----------------------------------------------
      // 3. SIMPAN DATA KE LOCAL STORAGE
      // -----------------------------------------------

      localStorage.setItem("siswa", JSON.stringify(siswaData));

      localStorage.setItem("siswa_id", String(siswaData.id));

      localStorage.setItem("user_id", String(userLogin.id));

      // -----------------------------------------------
      // 4. SIMPAN KE STATE
      // -----------------------------------------------

      setData(siswaData);
    } catch (error) {
      console.error("GAGAL MENGAMBIL DATA SISWA:", error.message);

      setData(null);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD SAAT HALAMAN DIBUKA
  // =====================================================

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // HANDLE SAVE
  // =====================================================

  const handleSave = async () => {
    if (!data?.id) {
      alert("ID siswa tidak ditemukan.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nama: data.nama || "",
        email: data.email || "",
        asal_sekolah: data.asal_sekolah || "",
        no_hp: data.no_hp || "",
        nama_orangtua: data.nama_orangtua || "",
        no_hp_orangtua: data.no_hp_orangtua || "",
        program_id: data.program_id || null,
        kelas_id: data.kelas_id || null,
      };

      console.log("=================================");
      console.log("UPDATE DATA SISWA");
      console.log("ID SISWA:", data.id);
      console.log("PAYLOAD:", payload);
      console.log("=================================");

      const res = await fetch(`${API_URL}/siswa/${data.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      console.log("STATUS UPDATE:", res.status);
      console.log("HASIL UPDATE:", result);

      if (!res.ok) {
        alert(result.message || "Gagal memperbarui data siswa.");
        return;
      }

      alert(result.message || "Data siswa berhasil diperbarui.");

      setEdit(false);

      // Ambil data terbaru
      await fetchData();
    } catch (error) {
      console.error("ERROR UPDATE DATA SISWA:", error);

      alert("Terjadi kesalahan saat memperbarui data siswa.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // BATAL EDIT
  // =====================================================

  const handleCancel = async () => {
    setEdit(false);

    await fetchData();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="datadiri-container">
        <div className="datadiri-loading">
          <h2>Memuat Data Siswa...</h2>
          <p>Sedang mengambil data akun dan data siswa.</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // DATA TIDAK DITEMUKAN
  // =====================================================

  if (!data) {
    return (
      <div className="datadiri-container">
        <div className="datadiri-empty">
          <h2>Data siswa tidak ditemukan</h2>

          <p>
            {errorMessage || "Akun login belum terhubung dengan data siswa."}
          </p>

          {user && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#f5f5f5",
                borderRadius: "8px",
                textAlign: "left",
              }}
            >
              <strong>Informasi akun login:</strong>

              <p>
                <b>ID User:</b> {user.id}
              </p>

              <p>
                <b>Nama:</b> {user.nama}
              </p>

              <p>
                <b>Email:</b> {user.email}
              </p>

              <p>
                <b>Role:</b> {user.role}
              </p>
            </div>
          )}

          <button className="retry-btn" onClick={fetchData}>
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // HALAMAN DATA DIRI
  // =====================================================

  return (
    <div className="datadiri-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="datadiri-header">
        <div>
          <h2>👤 Data Diri</h2>

          <p>Informasi data pribadi siswa</p>
        </div>
      </div>

      {/* =================================================
          CARD DATA
      ================================================= */}

      <div className="datadiri-card">
        {/* =================================================
            INFORMASI ID
        ================================================= */}

        <div className="info-id">
          <div>
            <span>ID User</span>

            <strong>{data.user_id || user?.id || "-"}</strong>
          </div>

          <div>
            <span>ID Siswa</span>

            <strong>{data.id || "-"}</strong>
          </div>
        </div>

        {/* =================================================
            NAMA
        ================================================= */}

        <label>Nama</label>

        <input
          type="text"
          name="nama"
          value={data.nama || ""}
          disabled={!edit}
          onChange={handleChange}
        />

        {/* =================================================
            EMAIL
        ================================================= */}

        <label>Email</label>

        <input
          type="email"
          name="email"
          value={data.email || ""}
          disabled={!edit}
          onChange={handleChange}
        />

        {/* =================================================
            KELAS
        ================================================= */}

        <label>Kelas</label>

        <input type="text" value={data.nama_kelas || "-"} disabled />

        {/* =================================================
            PROGRAM
        ================================================= */}

        <label>Program</label>

        <input type="text" value={data.nama_program || "-"} disabled />

        {/* =================================================
            ASAL SEKOLAH
        ================================================= */}

        <label>Asal Sekolah</label>

        <input
          type="text"
          name="asal_sekolah"
          value={data.asal_sekolah || ""}
          disabled={!edit}
          onChange={handleChange}
        />

        {/* =================================================
            NO HP
        ================================================= */}

        <label>No HP</label>

        <input
          type="text"
          name="no_hp"
          value={data.no_hp || ""}
          disabled={!edit}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");

            setData((prev) => ({
              ...prev,
              no_hp: value,
            }));
          }}
        />

        {/* =================================================
            NAMA ORANG TUA
        ================================================= */}

        <label>Nama Orang Tua</label>

        <input
          type="text"
          name="nama_orangtua"
          value={data.nama_orangtua || ""}
          disabled={!edit}
          onChange={handleChange}
        />

        {/* =================================================
            NO HP ORANG TUA
        ================================================= */}

        <label>No HP Orang Tua</label>

        <input
          type="text"
          name="no_hp_orangtua"
          value={data.no_hp_orangtua || ""}
          disabled={!edit}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");

            setData((prev) => ({
              ...prev,
              no_hp_orangtua: value,
            }));
          }}
        />

        {/* =================================================
            BUTTON
        ================================================= */}

        <div className="button-group">
          {!edit ? (
            <button className="edit-btn" onClick={() => setEdit(true)}>
              ✏️ Edit Data
            </button>
          ) : (
            <>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "⏳ Menyimpan..." : "💾 Simpan"}
              </button>

              <button
                className="cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                ❌ Batal
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
