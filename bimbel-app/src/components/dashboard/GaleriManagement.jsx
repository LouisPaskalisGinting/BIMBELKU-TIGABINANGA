import { useEffect, useState } from "react";
import "./GaleriManagement.css";
import GaleriModal from "./GaleriModal";

export default function GaleriManagement() {
  const [galeri, setGaleri] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchGaleri();
  }, []);

  // =========================================
  // GET DATA GALERI
  // =========================================

  const fetchGaleri = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/galeri");

      if (!res.ok) {
        throw new Error("Gagal mengambil data galeri");
      }

      const data = await res.json();

      setGaleri(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data galeri:", err);
      alert("Gagal mengambil data galeri.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // TAMBAH DATA
  // =========================================

  const handleAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  // =========================================
  // EDIT DATA
  // =========================================

  const handleEdit = (item) => {
    setEditData(item);
    setShowModal(true);
  };

  // =========================================
  // HAPUS DATA
  // =========================================

  const handleDelete = async (id) => {
    const konfirmasi = window.confirm("Yakin ingin menghapus data galeri ini?");

    if (!konfirmasi) return;

    try {
      setDeleting(id);

      const res = await fetch(`http://localhost:3000/galeri/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus data galeri.");
      }

      alert(data.message || "Data galeri berhasil dihapus.");

      await fetchGaleri();
    } catch (err) {
      console.error("Gagal menghapus galeri:", err);
      alert(err.message || "Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeleting(null);
    }
  };

  // =========================================
  // CLOSE MODAL
  // =========================================

  const handleCloseModal = () => {
    setShowModal(false);
    setEditData(null);
    fetchGaleri();
  };

  return (
    <div className="gal-page">
      {/* =====================================
          HEADER
          ===================================== */}

      <div className="gal-header">
        <div className="gal-header-content">
          <div className="gal-header-icon">
            <span>▧</span>
          </div>

          <div>
            <h1>Kelola Galeri</h1>

            <p>
              Kelola foto dan dokumentasi yang ditampilkan pada landing page
              Bimbelku.
            </p>
          </div>
        </div>

        <button className="gal-btn-add" onClick={handleAdd} type="button">
          <span>+</span>
          Tambah Foto
        </button>
      </div>

      {/* =====================================
          SUMMARY
          ===================================== */}

      <div className="gal-summary">
        <div className="gal-summary-card">
          <div className="gal-summary-icon">▧</div>

          <div className="gal-summary-info">
            <span>Total Foto</span>
            <strong>{galeri.length}</strong>
          </div>
        </div>

        <div className="gal-summary-card">
          <div className="gal-summary-icon">✓</div>

          <div className="gal-summary-info">
            <span>Status</span>
            <strong>Aktif</strong>
          </div>
        </div>
      </div>

      {/* =====================================
          TABLE CARD
          ===================================== */}

      <div className="gal-card">
        <div className="gal-card-header">
          <div>
            <h2>Daftar Galeri</h2>

            <p>Daftar foto yang tersimpan pada sistem.</p>
          </div>

          <button
            type="button"
            className="gal-refresh-btn"
            onClick={fetchGaleri}
            disabled={loading}
          >
            ↻ Muat Ulang
          </button>
        </div>

        {/* ===================================
            LOADING
            =================================== */}

        {loading ? (
          <div className="gal-loading">
            <div className="gal-spinner"></div>

            <p>Memuat data galeri...</p>
          </div>
        ) : galeri.length === 0 ? (
          /* =================================
             EMPTY STATE
             ================================= */

          <div className="gal-empty">
            <div className="gal-empty-icon">▧</div>

            <h3>Belum Ada Foto</h3>

            <p>
              Belum terdapat foto pada galeri. Tambahkan foto untuk ditampilkan
              pada landing page.
            </p>

            <button type="button" className="gal-empty-btn" onClick={handleAdd}>
              + Tambah Foto
            </button>
          </div>
        ) : (
          /* =================================
             TABLE
             ================================= */

          <div className="gal-table-wrapper">
            <table className="gal-table">
              <thead>
                <tr>
                  <th className="gal-col-no">No</th>
                  <th className="gal-col-image">Foto</th>
                  <th>Judul</th>
                  <th>Deskripsi</th>
                  <th className="gal-col-action">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {galeri.map((item, index) => (
                  <tr key={item.id}>
                    {/* No */}
                    <td className="gal-number">{index + 1}</td>

                    {/* Foto */}
                    <td>
                      <div className="gal-image-wrapper">
                        {item.gambar ? (
                          <img
                            src={`http://localhost:3000${item.gambar}`}
                            alt={item.judul || "Foto galeri"}
                            className="gal-image"
                          />
                        ) : (
                          <div className="gal-no-image">
                            <span>▧</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Judul */}
                    <td>
                      <div className="gal-title">{item.judul || "-"}</div>
                    </td>

                    {/* Deskripsi */}
                    <td>
                      <div className="gal-description">
                        {item.deskripsi ? item.deskripsi : "-"}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td>
                      <div className="gal-actions">
                        <button
                          type="button"
                          className="gal-btn-edit"
                          onClick={() => handleEdit(item)}
                          disabled={deleting === item.id}
                        >
                          ✎ Edit
                        </button>

                        <button
                          type="button"
                          className="gal-btn-delete"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                        >
                          {deleting === item.id ? (
                            <>
                              <span className="gal-delete-spinner"></span>
                              Menghapus...
                            </>
                          ) : (
                            <>⌫ Hapus</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================
          MODAL
          ===================================== */}

      {showModal && (
        <GaleriModal editData={editData} onClose={handleCloseModal} />
      )}
    </div>
  );
}
