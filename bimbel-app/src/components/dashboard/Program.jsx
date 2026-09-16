import { useEffect, useState } from "react";
import "./Program.css";
import ProgramModal from "./ProgramModal";

export default function Program() {
  const [program, setProgram] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    try {
      const res = await fetch("http://localhost:3000/program");
      const data = await res.json();

      setProgram(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil program:", error);
      setProgram([]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus program ini?")) return;

    try {
      const res = await fetch(`http://localhost:3000/program/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus program");
      }

      await fetchProgram();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus program.");
    }
  };

  const formatHarga = (harga) => {
    if (!harga) return "Rp 0";

    return `Rp ${Number(harga).toLocaleString("id-ID")}`;
  };

  return (
    <div className="program-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="program-page-header">
        <div className="program-heading">
          <div className="program-eyebrow">
            <span></span>
            MANAJEMEN PROGRAM
          </div>

          <h1>Program Bimbel</h1>

          <p>
            Kelola daftar program bimbingan belajar, harga, dan durasi
            pembelajaran BIMBELKU.
          </p>
        </div>

        <button
          className="btn-add"
          onClick={() => {
            setEditData(null);
            setShowModal(true);
          }}
        >
          <span className="program-plus">＋</span>
          Tambah Program
        </button>
      </section>

      {/* =====================================================
          TOOLBAR
          ===================================================== */}

      <section className="program-toolbar">
        <div className="program-toolbar-info">
          <div className="program-count-icon">📚</div>

          <div>
            <strong>Daftar Program</strong>

            <span>{program.length} program terdaftar</span>
          </div>
        </div>

        <div className="program-status">
          <span></span>
          Data program aktif
        </div>
      </section>

      {/* =====================================================
          TABLE
          ===================================================== */}

      <section className="program-table-card">
        <div className="program-table-wrapper">
          <table className="program-table">
            <thead>
              <tr>
                <th className="program-no">No</th>
                <th>Program</th>
                <th>Harga</th>
                <th>Durasi</th>
                <th className="program-action-head">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {program.length > 0 ? (
                program.map((p, index) => (
                  <tr key={p.id}>
                    {/* NOMOR */}

                    <td className="program-number">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* PROGRAM */}

                    <td>
                      <div className="program-name-cell">
                        <div className="program-icon">📘</div>

                        <div>
                          <strong>{p.nama_program}</strong>

                          <span>Program BIMBELKU</span>
                        </div>
                      </div>
                    </td>

                    {/* HARGA */}

                    <td>
                      <div className="program-price">
                        {formatHarga(p.harga)}
                      </div>
                    </td>

                    {/* DURASI */}

                    <td>
                      <span className="duration-badge">
                        ⏱ {p.durasi || "-"}
                      </span>
                    </td>

                    {/* AKSI */}

                    <td>
                      <div className="program-actions">
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setEditData(p);
                            setShowModal(true);
                          }}
                        >
                          <span>✎</span>
                          Edit
                        </button>

                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(p.id)}
                        >
                          <span>⌫</span>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="program-empty">
                    <div className="empty-program-icon">📚</div>

                    <strong>Belum ada program</strong>

                    <span>
                      Program bimbel yang ditambahkan akan muncul di sini.
                    </span>

                    <button
                      className="empty-add-program"
                      onClick={() => {
                        setEditData(null);
                        setShowModal(true);
                      }}
                    >
                      ＋ Tambah Program
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            FOOTER
            ===================================================== */}

        {program.length > 0 && (
          <div className="program-table-footer">
            <span>
              Menampilkan <strong>{program.length}</strong> program
            </span>

            <span className="program-system-status">
              <i></i>
              Sistem aktif
            </span>
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL
          ===================================================== */}

      {showModal && (
        <ProgramModal
          editData={editData}
          onClose={() => {
            setShowModal(false);
            fetchProgram();
          }}
        />
      )}
    </div>
  );
}
