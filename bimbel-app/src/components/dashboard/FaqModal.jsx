import { useEffect, useState } from "react";
import "./FaqModal.css";

export default function FAQModal({ editData, onClose }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setQuestion(editData.question || "");
      setAnswer(editData.answer || "");
    } else {
      setQuestion("");
      setAnswer("");
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      alert("Pertanyaan wajib diisi.");
      return;
    }

    if (!answer.trim()) {
      alert("Jawaban wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const data = {
        question: question.trim(),
        answer: answer.trim(),
      };

      let url = "http://localhost:3000/faq";
      let method = "POST";

      if (editData) {
        url = `http://localhost:3000/faq/${editData.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal menyimpan FAQ");
      }

      alert(result.message || "FAQ berhasil disimpan");

      onClose();
    } catch (err) {
      console.error("Gagal menyimpan FAQ:", err);
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !saving) {
      onClose();
    }
  };

  return (
    <div className="faqm-overlay" onMouseDown={handleOverlayClick}>
      <div className="faqm-modal">
        {/* ================= HEADER ================= */}
        <div className="faqm-header">
          <div className="faqm-header-icon">
            <span>?</span>
          </div>

          <div className="faqm-header-content">
            <h2>{editData ? "Edit FAQ" : "Tambah FAQ"}</h2>

            <p>
              {editData
                ? "Perbarui pertanyaan dan jawaban FAQ."
                : "Tambahkan pertanyaan dan jawaban baru."}
            </p>
          </div>

          <button
            type="button"
            className="faqm-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* ================= FORM ================= */}
        <form className="faqm-form" onSubmit={handleSubmit}>
          {/* Pertanyaan */}
          <div className="faqm-form-group">
            <label htmlFor="faqm-question">
              Pertanyaan <span>*</span>
            </label>

            <textarea
              id="faqm-question"
              rows="3"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Contoh: Bagaimana cara melakukan pendaftaran?"
              maxLength={300}
              disabled={saving}
              required
            />

            <div className="faqm-counter">{question.length}/300 karakter</div>
          </div>

          {/* Jawaban */}
          <div className="faqm-form-group">
            <label htmlFor="faqm-answer">
              Jawaban <span>*</span>
            </label>

            <textarea
              id="faqm-answer"
              rows="7"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Masukkan jawaban untuk pertanyaan tersebut..."
              maxLength={1500}
              disabled={saving}
              required
            />

            <div className="faqm-counter">{answer.length}/1500 karakter</div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="faqm-footer">
            <button
              type="button"
              className="faqm-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>

            <button type="submit" className="faqm-btn-save" disabled={saving}>
              {saving ? (
                <>
                  <span className="faqm-spinner"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span>✓</span>
                  {editData ? "Simpan Perubahan" : "Simpan FAQ"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
