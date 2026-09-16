import { useEffect, useState } from "react";
import "./Pembayaran.css";

export default function Pembayaran() {
  // =====================================================
  // STATE DATA PEMBAYARAN
  // =====================================================
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  // =====================================================
  // STATE DETAIL
  // =====================================================
  const [detail, setDetail] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // =====================================================
  // STATE PEMBAYARAN ADMIN
  // =====================================================
  const [jumlahAdmin, setJumlahAdmin] = useState("");
  const [buktiAdmin, setBuktiAdmin] = useState(null);

  // =====================================================
  // STATE LOADING
  // =====================================================
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // =====================================================
  // URL BACKEND
  // =====================================================
  const API_URL = "http://localhost:3000";

  // =====================================================
  // AMBIL TOKEN
  // =====================================================
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // CEK TOKEN
  // =====================================================
  const checkToken = () => {
    const token = getToken();

    if (!token) {
      alert("Token login tidak ditemukan. Silakan login kembali.");

      window.location.href = "/login";

      return null;
    }

    return token;
  };

  // =====================================================
  // LOAD DATA SAAT HALAMAN DIBUKA
  // =====================================================
  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // GET SEMUA PEMBAYARAN
  // =====================================================
  const fetchData = async () => {
    try {
      setLoadingData(true);

      // -------------------------------------------------
      // GENERATE TAGIHAN
      // -------------------------------------------------
      const generateRes = await fetch(`${API_URL}/pembayaran/generate`, {
        method: "POST",
      });

      const generateResult = await generateRes.json();

      console.log("GENERATE PEMBAYARAN:", generateResult);

      // -------------------------------------------------
      // AMBIL DATA PEMBAYARAN
      // -------------------------------------------------
      const res = await fetch(`${API_URL}/pembayaran`);

      const result = await res.json();

      console.log("DATA PEMBAYARAN:", result);

      if (!res.ok) {
        console.error("ERROR GET PEMBAYARAN:", result);

        setData([]);

        return;
      }

      if (Array.isArray(result)) {
        setData(result);
      } else {
        console.error("FORMAT DATA TIDAK VALID:", result);

        setData([]);
      }
    } catch (error) {
      console.error("GAGAL MENGAMBIL PEMBAYARAN:", error);

      setData([]);
    } finally {
      setLoadingData(false);
    }
  };

  // =====================================================
  // BUKA DETAIL PEMBAYARAN
  // =====================================================
  const openDetail = async (id) => {
    try {
      setSelectedId(id);

      console.log("MEMBUKA DETAIL PEMBAYARAN ID:", id);

      const res = await fetch(`${API_URL}/pembayaran/detail/${id}`);

      const result = await res.json();

      console.log("DETAIL PEMBAYARAN:", result);

      if (!res.ok) {
        alert(result.message || "Gagal mengambil detail pembayaran");

        return;
      }

      setDetail(Array.isArray(result) ? result : []);

      setShowDetail(true);
    } catch (error) {
      console.error("ERROR DETAIL:", error);

      alert("Gagal mengambil detail pembayaran");
    }
  };

  // =====================================================
  // TAMBAH PEMBAYARAN ADMIN
  // =====================================================
  const tambahPembayaranAdmin = async () => {
    // ---------------------------------------------------
    // TOKEN
    // ---------------------------------------------------
    const token = checkToken();

    if (!token) {
      return;
    }

    // ---------------------------------------------------
    // CEK PEMBAYARAN YANG DIPILIH
    // ---------------------------------------------------
    if (!selectedId) {
      alert("Data pembayaran belum dipilih.");

      return;
    }

    // ---------------------------------------------------
    // VALIDASI JUMLAH
    // ---------------------------------------------------
    if (!jumlahAdmin || Number(jumlahAdmin) <= 0) {
      alert("Masukkan jumlah pembayaran yang valid.");

      return;
    }

    // ---------------------------------------------------
    // VALIDASI BUKTI
    // ---------------------------------------------------
    if (!buktiAdmin) {
      alert("Bukti pembayaran wajib diupload.");

      return;
    }

    // ---------------------------------------------------
    // VALIDASI FILE
    // ---------------------------------------------------
    if (!buktiAdmin.type || !buktiAdmin.type.startsWith("image/")) {
      alert("Bukti pembayaran harus berupa gambar.");

      return;
    }

    // ---------------------------------------------------
    // FORMDATA
    // ---------------------------------------------------
    const formData = new FormData();

    formData.append("jumlah", Number(jumlahAdmin));

    formData.append("bukti_pembayaran", buktiAdmin);

    try {
      setLoading(true);

      console.log("=================================");

      console.log("TAMBAH PEMBAYARAN ADMIN");

      console.log("PEMBAYARAN ID:", selectedId);

      console.log("JUMLAH:", jumlahAdmin);

      console.log("FILE:", buktiAdmin.name);

      console.log("TOKEN:", token ? "ADA" : "TIDAK ADA");

      console.log("=================================");

      // ---------------------------------------------------
      // REQUEST
      // ---------------------------------------------------
      const res = await fetch(`${API_URL}/pembayaran/admin/${selectedId}`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      const result = await res.json();

      console.log("RESPONSE TAMBAH PEMBAYARAN:", result);

      // ---------------------------------------------------
      // TOKEN ERROR
      // ---------------------------------------------------
      if (res.status === 401) {
        alert(result.message || "Token tidak valid. Silakan login kembali.");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        window.location.href = "/login";

        return;
      }

      // ---------------------------------------------------
      // ERROR SERVER
      // ---------------------------------------------------
      if (!res.ok) {
        alert(result.message || "Gagal menambahkan pembayaran.");

        return;
      }

      // ---------------------------------------------------
      // BERHASIL
      // ---------------------------------------------------
      alert(result.message || "Pembayaran berhasil ditambahkan.");

      // ---------------------------------------------------
      // RESET FORM
      // ---------------------------------------------------
      setJumlahAdmin("");
      setBuktiAdmin(null);

      const fileInput = document.getElementById("bukti-admin");

      if (fileInput) {
        fileInput.value = "";
      }

      // ---------------------------------------------------
      // REFRESH DETAIL
      // ---------------------------------------------------
      await openDetail(selectedId);

      // ---------------------------------------------------
      // REFRESH DATA UTAMA
      // ---------------------------------------------------
      await fetchData();
    } catch (error) {
      console.error("ERROR TAMBAH PEMBAYARAN:", error);

      alert("Server tidak terhubung atau terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // APPROVE PEMBAYARAN
  // =====================================================
  const approvePembayaran = async (detailId) => {
    const token = checkToken();

    if (!token) {
      return;
    }

    const yakin = window.confirm(
      "Apakah Anda yakin ingin menyetujui pembayaran ini?"
    );

    if (!yakin) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/pembayaran/approve/${detailId}`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      console.log("RESPONSE APPROVE:", result);

      // ---------------------------------------------------
      // TOKEN ERROR
      // ---------------------------------------------------
      if (res.status === 401) {
        alert(result.message || "Sesi login sudah berakhir.");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        window.location.href = "/login";

        return;
      }

      // ---------------------------------------------------
      // ERROR
      // ---------------------------------------------------
      if (!res.ok) {
        alert(result.message || "Gagal menyetujui pembayaran.");

        return;
      }

      // ---------------------------------------------------
      // BERHASIL
      // ---------------------------------------------------
      alert(result.message || "Pembayaran berhasil disetujui.");

      // Refresh detail
      if (selectedId) {
        await openDetail(selectedId);
      }

      // Refresh tabel
      await fetchData();
    } catch (error) {
      console.error("ERROR APPROVE:", error);

      alert("Gagal menyetujui pembayaran.");
    }
  };

  // =====================================================
  // REJECT PEMBAYARAN
  // =====================================================
  const rejectPembayaran = async (detailId) => {
    const token = checkToken();

    if (!token) {
      return;
    }

    const catatan = window.prompt("Masukkan alasan penolakan:");

    if (catatan === null) {
      return;
    }

    if (!catatan.trim()) {
      alert("Alasan penolakan wajib diisi.");

      return;
    }

    try {
      const res = await fetch(`${API_URL}/pembayaran/reject/${detailId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          catatan: catatan.trim(),
        }),
      });

      const result = await res.json();

      console.log("RESPONSE REJECT:", result);

      // ---------------------------------------------------
      // TOKEN ERROR
      // ---------------------------------------------------
      if (res.status === 401) {
        alert(result.message || "Sesi login sudah berakhir.");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        window.location.href = "/login";

        return;
      }

      // ---------------------------------------------------
      // ERROR
      // ---------------------------------------------------
      if (!res.ok) {
        alert(result.message || "Gagal menolak pembayaran.");

        return;
      }

      // ---------------------------------------------------
      // BERHASIL
      // ---------------------------------------------------
      alert(result.message || "Pembayaran berhasil ditolak.");

      // Refresh detail
      if (selectedId) {
        await openDetail(selectedId);
      }

      // Refresh tabel
      await fetchData();
    } catch (error) {
      console.error("ERROR REJECT:", error);

      alert("Gagal menolak pembayaran.");
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================
  const filtered = data.filter((d) => {
    const namaSiswa = (d.nama_siswa || "").toLowerCase();

    const namaKelas = (d.nama_kelas || "").toLowerCase();

    const namaProgram = (d.nama_program || "").toLowerCase();

    const keyword = search.toLowerCase();

    return (
      namaSiswa.includes(keyword) ||
      namaKelas.includes(keyword) ||
      namaProgram.includes(keyword)
    );
  });

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="pmb-page">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <h1>Pembayaran Admin</h1>

      {/* ================================================= */}
      {/* SEARCH */}
      {/* ================================================= */}

      <input
        className="pmb-search-input"
        placeholder="Cari nama siswa..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ================================================= */}
      {/* LOADING */}
      {/* ================================================= */}

      {loadingData && <p>Memuat data pembayaran...</p>}

      {/* ================================================= */}
      {/* TABEL PEMBAYARAN */}
      {/* ================================================= */}

      <table className="pmb-table">
        <thead>
          <tr>
            <th>Nama Siswa</th>
            <th>Kelas</th>
            <th>Program</th>
            <th>Total Tagihan</th>
            <th>Sudah Dibayar</th>
            <th>Sisa Tagihan</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {!loadingData && filtered.length === 0 ? (
            <tr>
              <td
                colSpan="7"
                style={{
                  textAlign: "center",
                }}
              >
                Tidak ada data pembayaran
              </td>
            </tr>
          ) : (
            filtered.map((d) => (
              <tr key={d.id}>
                {/* NAMA SISWA */}
                <td>{d.nama_siswa || "-"}</td>

                {/* KELAS */}
                <td>{d.nama_kelas || "-"}</td>

                {/* PROGRAM */}
                <td>{d.nama_program || "-"}</td>

                {/* TOTAL TAGIHAN */}
                <td>
                  Rp {Number(d.total_tagihan || 0).toLocaleString("id-ID")}
                </td>

                {/* SUDAH DIBAYAR */}
                <td>
                  Rp {Number(d.sudah_dibayar || 0).toLocaleString("id-ID")}
                </td>

                {/* SISA TAGIHAN */}
                <td>
                  Rp {Number(d.sisa_tagihan || 0).toLocaleString("id-ID")}
                </td>

                {/* AKSI */}
                <td>
                  <button
                    className="pmb-btn-detail"
                    onClick={() => openDetail(d.id)}
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ================================================= */}
      {/* MODAL DETAIL */}
      {/* ================================================= */}

      {showDetail && (
        <div className="pmb-modal-overlay">
          <div className="pmb-modal">
            <h2>Detail Pembayaran</h2>

            {/* =========================================== */}
            {/* NAMA SISWA */}
            {/* =========================================== */}

            {detail.length > 0 && (
              <div className="pmb-detail-info">
                <strong>Siswa:</strong> {detail[0].nama_siswa || "-"}
              </div>
            )}

            {/* =========================================== */}
            {/* FORM PEMBAYARAN ADMIN */}
            {/* =========================================== */}

            <div className="pmb-admin-payment-form">
              <h3>Input Pembayaran Siswa</h3>

              {/* NOMINAL */}
              <div className="pmb-form-group">
                <label>Nominal Pembayaran</label>

                <input
                  type="number"
                  min="1"
                  placeholder="Masukkan nominal pembayaran"
                  value={jumlahAdmin}
                  onChange={(e) => setJumlahAdmin(e.target.value)}
                />
              </div>

              {/* BUKTI */}
              <div className="pmb-form-group">
                <label>Bukti Pembayaran</label>

                <input
                  id="bukti-admin"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    setBuktiAdmin(file || null);
                  }}
                />
              </div>

              {/* BUTTON */}
              <button
                className="pmb-btn-tambah-pembayaran"
                onClick={tambahPembayaranAdmin}
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Tambahkan Pembayaran"}
              </button>
            </div>

            {/* =========================================== */}
            {/* TABEL DETAIL */}
            {/* =========================================== */}

            <table className="pmb-detail-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jumlah</th>
                  <th>Bukti</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {detail.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                      }}
                    >
                      Belum ada pembayaran
                    </td>
                  </tr>
                ) : (
                  detail.map((d) => (
                    <tr key={d.id}>
                      {/* TANGGAL */}
                      <td>
                        {d.tanggal
                          ? new Date(d.tanggal).toLocaleString("id-ID")
                          : "-"}
                      </td>

                      {/* JUMLAH */}
                      <td>
                        Rp {Number(d.jumlah || 0).toLocaleString("id-ID")}
                      </td>

                      {/* BUKTI */}
                      <td>
                        {d.bukti_pembayaran ? (
                          <a
                            href={`${API_URL}/uploads/${d.bukti_pembayaran}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Lihat Bukti
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* STATUS */}
                      <td>{d.status || "-"}</td>

                      {/* CATATAN */}
                      <td>{d.catatan || "-"}</td>

                      {/* AKSI */}
                      <td>
                        {d.status === "pending" ? (
                          <>
                            <button onClick={() => approvePembayaran(d.id)}>
                              Setujui
                            </button>

                            <button onClick={() => rejectPembayaran(d.id)}>
                              Tolak
                            </button>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* =========================================== */}
            {/* TUTUP */}
            {/* =========================================== */}

            <button
              className="pmb-btn-close"
              onClick={() => {
                setShowDetail(false);
                setSelectedId(null);
                setJumlahAdmin("");
                setBuktiAdmin(null);

                const fileInput = document.getElementById("bukti-admin");

                if (fileInput) {
                  fileInput.value = "";
                }
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
