import { useEffect, useState } from "react";
import "./PembayaranSiswa.css";

export default function PembayaranSiswa() {
  const API_URL = "http://localhost:3000";

  const [data, setData] = useState([]);
  const [detail, setDetail] = useState([]);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [jumlah, setJumlah] = useState("");
  const [bukti, setBukti] = useState(null);

  const [siswaId, setSiswaId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingBayar, setLoadingBayar] = useState(false);

  // =====================================================
  // MENCARI ID SISWA YANG BENAR
  // =====================================================

  useEffect(() => {
    const loadSiswa = async () => {
      try {
        const siswaStorage = localStorage.getItem("siswa");
        const userStorage = localStorage.getItem("user");

        console.log("=================================");
        console.log("DATA SISWA STORAGE:", siswaStorage);
        console.log("DATA USER STORAGE:", userStorage);
        console.log("=================================");

        // =================================================
        // 1. CEK LOCAL STORAGE SISWA
        // =================================================

        if (siswaStorage) {
          const siswa = JSON.parse(siswaStorage);

          console.log("SISWA DARI LOCAL STORAGE:", siswa);

          /*
           * PENTING:
           *
           * Pastikan id yang ada di sini benar-benar
           * merupakan id dari tabel siswa.
           *
           * Contoh:
           *
           * siswa.id = 47
           *
           */

          if (siswa?.id) {
            console.log("ID SISWA DITEMUKAN:", siswa.id);

            setSiswaId(siswa.id);

            return;
          }
        }

        // =================================================
        // 2. JIKA SISWA TIDAK ADA
        // =================================================

        if (!userStorage) {
          console.error("DATA USER TIDAK DITEMUKAN");

          setLoading(false);

          return;
        }

        const user = JSON.parse(userStorage);

        console.log("USER LOGIN:", user);

        if (!user?.id) {
          console.error("USER ID TIDAK DITEMUKAN");

          setLoading(false);

          return;
        }

        // =================================================
        // 3. CARI SISWA BERDASARKAN USER_ID
        // =================================================

        console.log("MENCARI SISWA BERDASARKAN USER ID:", user.id);

        const res = await fetch(`${API_URL}/siswa/user/${user.id}`);

        const result = await res.json();

        console.log("HASIL SISWA BERDASARKAN USER ID:", result);

        if (!res.ok) {
          console.error("GAGAL MENCARI DATA SISWA:", result);

          setLoading(false);

          return;
        }

        if (!result?.id) {
          console.error("ID SISWA TIDAK DITEMUKAN DARI SERVER");

          setLoading(false);

          return;
        }

        // =================================================
        // 4. SIMPAN DATA SISWA YANG BENAR
        // =================================================

        localStorage.setItem("siswa", JSON.stringify(result));

        console.log("ID SISWA YANG BENAR:", result.id);

        setSiswaId(result.id);
      } catch (err) {
        console.error("ERROR MEMUAT DATA SISWA:", err);

        setLoading(false);
      }
    };

    loadSiswa();
  }, []);

  // =====================================================
  // AMBIL DATA PEMBAYARAN
  // =====================================================

  const fetchData = async () => {
    if (!siswaId) {
      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      console.log("=================================");

      console.log("MENGAMBIL PEMBAYARAN SISWA");

      console.log("SISWA ID:", siswaId);

      console.log("URL:", `${API_URL}/pembayaran/siswa/${siswaId}`);

      console.log("=================================");

      const res = await fetch(`${API_URL}/pembayaran/siswa/${siswaId}`);

      const result = await res.json();

      console.log("STATUS PEMBAYARAN:", res.status);

      console.log("HASIL PEMBAYARAN SISWA:", result);

      if (!res.ok) {
        console.error("ERROR API PEMBAYARAN:", result);

        setData([]);

        return;
      }

      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("ERROR FETCH PEMBAYARAN:", err);

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD PEMBAYARAN SETELAH SISWA ID DITEMUKAN
  // =====================================================

  useEffect(() => {
    if (siswaId) {
      fetchData();
    }
  }, [siswaId]);

  // =====================================================
  // BUKA DETAIL PEMBAYARAN
  // =====================================================

  const openDetail = async (id) => {
    setSelectedId(id);

    setShowDetail(true);

    setLoadingDetail(true);

    try {
      const res = await fetch(`${API_URL}/pembayaran/detail/${id}`);

      const result = await res.json();

      console.log("DETAIL PEMBAYARAN:", result);

      if (!res.ok) {
        throw new Error(result.message || "Gagal mengambil detail pembayaran");
      }

      setDetail(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("ERROR DETAIL PEMBAYARAN:", err);

      setDetail([]);

      alert("Gagal mengambil detail pembayaran");
    } finally {
      setLoadingDetail(false);
    }
  };

  // =====================================================
  // AJUKAN PEMBAYARAN
  // =====================================================

  const bayar = async () => {
    if (!selectedId) {
      alert("Data pembayaran belum dipilih");

      return;
    }

    if (!jumlah || Number(jumlah) <= 0) {
      alert("Masukkan jumlah pembayaran");

      return;
    }

    if (!bukti) {
      alert("Upload bukti pembayaran terlebih dahulu");

      return;
    }

    // =================================================
    // VALIDASI FILE
    // =================================================

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(bukti.type)) {
      alert("Format bukti pembayaran harus JPG, JPEG, PNG, atau WEBP");

      return;
    }

    // =================================================
    // FORM DATA
    // =================================================

    const formData = new FormData();

    formData.append("jumlah", jumlah);

    formData.append("bukti_pembayaran", bukti);

    try {
      setLoadingBayar(true);

      const res = await fetch(`${API_URL}/pembayaran/${selectedId}`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      console.log("HASIL PENGAJUAN PEMBAYARAN:", result);

      if (!res.ok) {
        alert(result.message || "Pembayaran gagal");

        return;
      }

      alert(result.message || "Pembayaran berhasil diajukan");

      // =================================================
      // RESET FORM
      // =================================================

      setJumlah("");

      setBukti(null);

      const fileInput = document.getElementById("bukti-pembayaran");

      if (fileInput) {
        fileInput.value = "";
      }

      // =================================================
      // REFRESH DETAIL
      // =================================================

      await openDetail(selectedId);

      // =================================================
      // REFRESH TAGIHAN
      // =================================================

      await fetchData();
    } catch (err) {
      console.error("ERROR AJUKAN PEMBAYARAN:", err);

      alert("Terjadi kesalahan saat mengajukan pembayaran");
    } finally {
      setLoadingBayar(false);
    }
  };

  // =====================================================
  // TUTUP DETAIL
  // =====================================================

  const closeDetail = () => {
    setShowDetail(false);

    setSelectedId(null);

    setDetail([]);

    setJumlah("");

    setBukti(null);

    const fileInput = document.getElementById("bukti-pembayaran");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // =====================================================
  // FORMAT RUPIAH
  // =====================================================

  const formatRupiah = (nominal) => {
    return Number(nominal || 0).toLocaleString("id-ID");
  };

  // =====================================================
  // FORMAT TANGGAL
  // =====================================================

  const formatTanggal = (tanggal) => {
    if (!tanggal) {
      return "-";
    }

    return new Date(tanggal).toLocaleString("id-ID");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="pembayaran-page">
        <h1>Pembayaran Saya</h1>

        <p>Memuat data pembayaran...</p>
      </div>
    );
  }

  // =====================================================
  // SISWA TIDAK DITEMUKAN
  // =====================================================

  if (!siswaId) {
    return (
      <div className="pembayaran-page">
        <h1>Pembayaran Saya</h1>

        <div className="empty-payment">
          <p>Data siswa tidak ditemukan. Silakan login kembali.</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="pembayaran-page">
      <h1>Pembayaran Saya</h1>

      {/* =================================================
          DATA TAGIHAN
      ================================================= */}

      {data.length === 0 ? (
        <div className="empty-payment">
          <p>Belum ada tagihan pembayaran.</p>
        </div>
      ) : (
        <div className="card-container">
          {data.map((item) => (
            <div className="card" key={item.id}>
              <h3>{item.nama_siswa || "-"}</h3>

              <p>
                <strong>Kelas:</strong> {item.nama_kelas || "-"}
              </p>

              <p>
                <strong>Program:</strong> {item.nama_program || "-"}
              </p>

              <p>
                <strong>Total Tagihan:</strong> Rp{" "}
                {formatRupiah(item.total_tagihan)}
              </p>

              <p>
                <strong>Sudah Dibayar:</strong> Rp{" "}
                {formatRupiah(item.sudah_dibayar)}
              </p>

              <p className="sisa">
                <strong>Sisa Tagihan:</strong> Rp{" "}
                {formatRupiah(item.sisa_tagihan)}
              </p>

              <button
                onClick={() => openDetail(item.id)}
                className="btn-detail"
              >
                {Number(item.sisa_tagihan) === 0
                  ? "Lihat Riwayat"
                  : "Bayar / Detail"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* =================================================
          MODAL DETAIL
      ================================================= */}

      {showDetail && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Detail Pembayaran</h2>

              <button className="btn-close" onClick={closeDetail}>
                ×
              </button>
            </div>

            {/* =================================================
                FORM PEMBAYARAN
            ================================================= */}

            {selectedId &&
              data.find((item) => item.id === selectedId) &&
              Number(
                data.find((item) => item.id === selectedId)?.sisa_tagihan
              ) > 0 && (
                <div className="bayar-form">
                  <h3>Ajukan Pembayaran</h3>

                  <label>Jumlah Pembayaran</label>

                  <input
                    type="number"
                    min="1"
                    placeholder="Masukkan jumlah pembayaran"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                  />

                  <label>Bukti Pembayaran</label>

                  <input
                    id="bukti-pembayaran"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => setBukti(e.target.files?.[0] || null)}
                  />

                  {bukti && <p className="file-name">File: {bukti.name}</p>}

                  <button
                    onClick={bayar}
                    disabled={loadingBayar}
                    className="btn-bayar"
                  >
                    {loadingBayar ? "Mengirim..." : "Ajukan Pembayaran"}
                  </button>
                </div>
              )}

            {/* =================================================
                RIWAYAT PEMBAYARAN
            ================================================= */}

            <div className="riwayat-pembayaran">
              <h3>Riwayat Pembayaran</h3>

              {loadingDetail ? (
                <p>Memuat riwayat pembayaran...</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Tanggal</th>

                        <th>Jumlah</th>

                        <th>Bukti</th>

                        <th>Status</th>

                        <th>Catatan</th>
                      </tr>
                    </thead>

                    <tbody>
                      {detail.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-detail">
                            Belum ada riwayat pembayaran
                          </td>
                        </tr>
                      ) : (
                        detail.map((d) => (
                          <tr key={d.id}>
                            <td>{formatTanggal(d.tanggal)}</td>

                            <td>Rp {formatRupiah(d.jumlah)}</td>

                            <td>
                              {d.bukti_pembayaran ? (
                                <a
                                  href={`${API_URL}/uploads/${d.bukti_pembayaran}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-bukti"
                                >
                                  Lihat Bukti
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td>
                              <span className={`status ${d.status}`}>
                                {d.status === "pending"
                                  ? "Menunggu"
                                  : d.status === "approved"
                                  ? "Disetujui"
                                  : d.status === "rejected"
                                  ? "Ditolak"
                                  : d.status || "-"}
                              </span>
                            </td>

                            <td>{d.catatan || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* =================================================
                TUTUP
            ================================================= */}

            <button className="btn-tutup" onClick={closeDetail}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
