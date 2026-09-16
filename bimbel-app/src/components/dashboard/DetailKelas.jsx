import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./DetailKelas.css";

export default function DetailKelas() {
  const { id } = useParams();

  const [kelas, setKelas] = useState({});
  const [siswaKelas, setSiswaKelas] = useState([]);
  const [search, setSearch] = useState("");
  const [hasilCari, setHasilCari] = useState([]);

  useEffect(() => {
    fetchKelas();
    fetchSiswaKelas();
  }, [id]);

  // =====================================================
  // AMBIL TOKEN
  // =====================================================

  const getToken = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Token tidak ditemukan. Silakan login kembali.");
      return null;
    }

    return token;
  };

  // =====================================================
  // FETCH DETAIL KELAS
  // =====================================================

  const fetchKelas = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const res = await fetch(`http://localhost:3000/kelas/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal mengambil data kelas");
        return;
      }

      setKelas(Array.isArray(data) ? data[0] || {} : data || {});
    } catch (err) {
      console.error("ERROR FETCH KELAS:", err);
    }
  };

  // =====================================================
  // FETCH SISWA DALAM KELAS
  // =====================================================

  const fetchSiswaKelas = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const res = await fetch(`http://localhost:3000/siswa/kelas/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("SISWA DALAM KELAS:", data);

      if (!res.ok) {
        alert(data.message || "Gagal mengambil data siswa");
        return;
      }

      setSiswaKelas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR FETCH SISWA KELAS:", err);
      setSiswaKelas([]);
    }
  };

  // =====================================================
  // CARI SISWA
  // =====================================================

  const cariSiswa = async (value) => {
    setSearch(value);

    if (value.length < 2) {
      setHasilCari([]);
      return;
    }

    try {
      const token = getToken();

      if (!token) return;

      const res = await fetch(`http://localhost:3000/siswa/search/${value}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Gagal mencari siswa:", data);
        setHasilCari([]);
        return;
      }

      setHasilCari(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ERROR SEARCH SISWA:", err);
      setHasilCari([]);
    }
  };

  // =====================================================
  // TAMBAH SISWA KE KELAS
  // =====================================================

  const pilihSiswa = async (idSiswa) => {
    try {
      const token = getToken();

      if (!token) return;

      const res = await fetch(
        `http://localhost:3000/siswa/masuk-kelas/${idSiswa}/${id}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await res.json();

      console.log("RESP TAMBAH SISWA:", result);

      if (!res.ok) {
        alert(result.message || "Gagal menambahkan siswa");
        return;
      }

      alert("Siswa berhasil ditambahkan ke kelas");

      setSearch("");
      setHasilCari([]);

      fetchSiswaKelas();
    } catch (err) {
      console.error("ERROR TAMBAH SISWA:", err);
      alert("Terjadi kesalahan saat menambahkan siswa");
    }
  };

  // =====================================================
  // KELUARKAN SISWA DARI KELAS
  // =====================================================

  const hapusSiswa = async (idSiswa) => {
    const yakin = window.confirm("Keluarkan siswa dari kelas ini?");

    if (!yakin) return;

    try {
      const token = getToken();

      if (!token) return;

      const res = await fetch(
        `http://localhost:3000/siswa/keluar-kelas/${idSiswa}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await res.json();

      console.log("RESP KELUAR SISWA:", result);

      if (!res.ok) {
        alert(result.message || "Gagal mengeluarkan siswa");
        return;
      }

      alert("Siswa berhasil dikeluarkan dari kelas");

      fetchSiswaKelas();
    } catch (err) {
      console.error("ERROR HAPUS SISWA:", err);
      alert("Terjadi kesalahan saat mengeluarkan siswa");
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="detail-kelas-container">
      <h1>Detail Kelas</h1>

      {/* =====================================================
          INFORMASI KELAS + TAMBAH SISWA
      ===================================================== */}

      <div className="kelas-top-row">
        {/* DETAIL KELAS */}

        <div className="detail-kelas-card">
          <h3>Kelas: {kelas?.nama_kelas || "-"}</h3>

          <p>Program: {kelas?.nama_program || kelas?.program || "-"}</p>
        </div>

        {/* TAMBAH SISWA */}

        <div className="tambah-siswa-card">
          <h2>Tambah Siswa</h2>

          <div className="search-box">
            <input
              type="text"
              placeholder="Ketik nama siswa..."
              value={search}
              onChange={(e) => cariSiswa(e.target.value)}
            />

            {hasilCari.length > 0 && (
              <div className="search-result">
                {hasilCari.map((s) => (
                  <div
                    key={s.id}
                    className="search-item"
                    onClick={() => pilihSiswa(s.id)}
                  >
                    <strong>{s.nama}</strong>

                    <span>
                      {s.nama_program || "-"} •{" "}
                      {s.nama_kelas || "Belum ada kelas"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          DAFTAR SISWA
      ===================================================== */}

      <div className="siswa-table-card">
        <h2>Daftar Siswa</h2>

        <table className="siswa-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Sekolah</th>
              <th>No HP</th>
              <th>Program</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {siswaKelas.length > 0 ? (
              siswaKelas.map((s) => (
                <tr key={s.id}>
                  <td>{s.nama || "-"}</td>

                  <td>{s.asal_sekolah || "-"}</td>

                  <td>{s.no_hp || "-"}</td>

                  <td>{s.nama_program || "-"}</td>

                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => hapusSiswa(s.id)}
                    >
                      Keluarkan
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-data">
                  Belum ada siswa di kelas ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
