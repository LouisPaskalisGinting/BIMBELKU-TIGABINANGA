import { useEffect, useState } from "react";
import "./TestimonialManagement.css";
import TestimonialModal from "./TestimonialModal";

export default function TestimonialManagement() {
  const [testimonial, setTestimonial] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonial();
  }, []);

  const fetchTestimonial = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/testimonial");

      if (!res.ok) {
        throw new Error("Gagal mengambil data testimoni");
      }

      const data = await res.json();
      setTestimonial(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil testimonial:", err);
      setTestimonial([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const konfirmasi = window.confirm("Yakin ingin menghapus testimoni ini?");

    if (!konfirmasi) return;

    try {
      const res = await fetch(`http://localhost:3000/testimonial/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus testimoni");
      }

      alert("Testimoni berhasil dihapus");
      fetchTestimonial();
    } catch (err) {
      console.error("Gagal menghapus testimonial:", err);
      alert("Gagal menghapus testimoni");
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditData(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditData(null);
    fetchTestimonial();
  };

  return (
    <div className="tst-page">
      {/* ================= HEADER ================= */}
      <div className="tst-header">
        <div className="tst-header-content">
          <div className="tst-header-icon">
            <span>★</span>
          </div>

          <div>
            <h1>Kelola Testimoni</h1>
            <p>
              Kelola testimoni siswa yang ditampilkan pada landing page
              Bimbelku.
            </p>
          </div>
        </div>

        <button className="tst-btn-add" onClick={handleAdd}>
          <span className="tst-btn-icon">+</span>
          Tambah Testimoni
        </button>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="tst-summary">
        <div className="tst-summary-card">
          <div className="tst-summary-icon">★</div>

          <div className="tst-summary-info">
            <span className="tst-summary-label">Total Testimoni</span>

            <strong>{testimonial.length}</strong>
          </div>
        </div>
      </div>

      {/* ================= TABLE CARD ================= */}
      <div className="tst-card">
        <div className="tst-card-header">
          <div>
            <h2>Daftar Testimoni</h2>
            <p>Data testimoni siswa yang tersedia pada sistem.</p>
          </div>
        </div>

        <div className="tst-table-wrapper">
          <table className="tst-table">
            <thead>
              <tr>
                <th className="tst-col-no">No</th>
                <th className="tst-col-foto">Foto</th>
                <th>Nama</th>
                <th>Asal Sekolah</th>
                <th>Universitas</th>
                <th>Pesan</th>
                <th className="tst-col-action">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="tst-loading">
                      <div className="tst-spinner"></div>
                      <span>Memuat data testimoni...</span>
                    </div>
                  </td>
                </tr>
              ) : testimonial.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="tst-empty">
                      <div className="tst-empty-icon">★</div>

                      <strong>Belum ada data testimoni</strong>

                      <span>Silakan tambahkan testimoni baru.</span>

                      <button className="tst-empty-button" onClick={handleAdd}>
                        + Tambah Testimoni
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                testimonial.map((item, index) => (
                  <tr key={item.id}>
                    {/* No */}
                    <td className="tst-number">{index + 1}</td>

                    {/* Foto */}
                    <td>
                      {item.foto ? (
                        <div className="tst-photo-wrapper">
                          <img
                            src={`http://localhost:3000${item.foto}`}
                            alt={item.nama || "Testimoni"}
                            className="tst-photo"
                          />
                        </div>
                      ) : (
                        <div className="tst-no-photo">
                          <span>👤</span>
                        </div>
                      )}
                    </td>

                    {/* Nama */}
                    <td>
                      <div className="tst-name">{item.nama || "-"}</div>
                    </td>

                    {/* Asal Sekolah */}
                    <td>
                      <span className="tst-text">
                        {item.asal_sekolah || "-"}
                      </span>
                    </td>

                    {/* Universitas */}
                    <td>
                      <span className="tst-text">
                        {item.universitas || "-"}
                      </span>
                    </td>

                    {/* Pesan */}
                    <td className="tst-message-cell">
                      {item.pesan ? (
                        <span className="tst-message" title={item.pesan}>
                          {item.pesan}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Aksi */}
                    <td>
                      <div className="tst-actions">
                        <button
                          className="tst-btn-edit"
                          onClick={() => handleEdit(item)}
                          title="Edit testimoni"
                        >
                          <span>✎</span>
                          Edit
                        </button>

                        <button
                          className="tst-btn-delete"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus testimoni"
                        >
                          <span>🗑</span>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && testimonial.length > 0 && (
          <div className="tst-card-footer">
            <span>
              Menampilkan <strong>{testimonial.length}</strong> data testimoni
            </span>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <TestimonialModal editData={editData} onClose={handleCloseModal} />
      )}
    </div>
  );
}
