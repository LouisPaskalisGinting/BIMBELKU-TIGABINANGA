import { useEffect, useState } from "react";
import "./FaqManagement.css";
import FaqModal from "./FaqModal";

export default function FAQManagement() {
  const [faq, setFaq] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaq();
  }, []);

  const fetchFaq = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/faq");

      if (!res.ok) {
        throw new Error("Gagal mengambil data FAQ");
      }

      const data = await res.json();

      setFaq(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil FAQ:", err);
      setFaq([]);
    } finally {
      setLoading(false);
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

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus FAQ ini?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/faq/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus FAQ");
      }

      alert("FAQ berhasil dihapus");

      await fetchFaq();
    } catch (err) {
      console.error("Gagal menghapus FAQ:", err);
      alert("Gagal menghapus FAQ");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditData(null);
    fetchFaq();
  };

  return (
    <div className="faq-page">
      {/* ================= HEADER ================= */}
      <div className="faq-header">
        <div className="faq-header-content">
          <div className="faq-header-icon">
            <span>?</span>
          </div>

          <div>
            <h1>Kelola FAQ</h1>
            <p>
              Kelola pertanyaan dan jawaban yang ditampilkan pada landing page
              Bimbelku.
            </p>
          </div>
        </div>

        <button className="faq-btn-add" onClick={handleAdd}>
          <span className="faq-btn-add-icon">+</span>
          Tambah FAQ
        </button>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="faq-summary">
        <div className="faq-summary-card">
          <div className="faq-summary-icon">?</div>

          <div className="faq-summary-info">
            <span>Total FAQ</span>
            <strong>{faq.length}</strong>
          </div>
        </div>
      </div>

      {/* ================= TABLE CARD ================= */}
      <div className="faq-card">
        <div className="faq-card-header">
          <div>
            <h2>Daftar FAQ</h2>
            <p>Daftar pertanyaan yang tersedia pada sistem.</p>
          </div>
        </div>

        <div className="faq-table-wrapper">
          <table className="faq-table">
            <thead>
              <tr>
                <th className="faq-col-no">No</th>
                <th className="faq-col-question">Pertanyaan</th>
                <th className="faq-col-answer">Jawaban</th>
                <th className="faq-col-action">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">
                    <div className="faq-loading">
                      <div className="faq-spinner"></div>
                      <span>Memuat data FAQ...</span>
                    </div>
                  </td>
                </tr>
              ) : faq.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="faq-empty">
                      <div className="faq-empty-icon">?</div>

                      <strong>Belum ada data FAQ</strong>

                      <span>
                        Silakan tambahkan pertanyaan dan jawaban baru.
                      </span>

                      <button className="faq-empty-button" onClick={handleAdd}>
                        + Tambah FAQ
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                faq.map((item, index) => (
                  <tr key={item.id}>
                    {/* No */}
                    <td className="faq-number">{index + 1}</td>

                    {/* Pertanyaan */}
                    <td>
                      <div className="faq-question">
                        <span className="faq-question-icon">?</span>

                        <span
                          className="faq-question-text"
                          title={item.question}
                        >
                          {item.question || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Jawaban */}
                    <td>
                      <div className="faq-answer" title={item.answer}>
                        {item.answer || "-"}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td>
                      <div className="faq-actions">
                        <button
                          className="faq-btn-edit"
                          onClick={() => handleEdit(item)}
                          title="Edit FAQ"
                        >
                          <span>✎</span>
                          Edit
                        </button>

                        <button
                          className="faq-btn-delete"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus FAQ"
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

        {/* ================= FOOTER ================= */}
        {!loading && faq.length > 0 && (
          <div className="faq-card-footer">
            Menampilkan <strong>{faq.length}</strong> data FAQ
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && <FaqModal editData={editData} onClose={handleCloseModal} />}
    </div>
  );
}
