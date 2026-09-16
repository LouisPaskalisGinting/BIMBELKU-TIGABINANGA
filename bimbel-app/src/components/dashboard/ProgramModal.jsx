import { useEffect, useState } from "react";
import "./ProgramModal.css";

export default function ProgramModal({ onClose, editData }) {
  const [form, setForm] = useState({
    nama_program: "",
    deskripsi: "",
    harga: "",
    durasi: "",
    jumlah_pertemuan: "",
    status: "aktif",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        nama_program: editData.nama_program || "",
        deskripsi: editData.deskripsi || "",
        harga: editData.harga || "",
        durasi: editData.durasi || "",
        jumlah_pertemuan: editData.jumlah_pertemuan || "",
        status: editData.status || "aktif",
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!form.nama_program || !form.harga || !form.durasi) {
      alert("Nama program, harga, dan durasi wajib diisi!");
      return;
    }

    try {
      let res;

      if (editData) {
        res = await fetch(`http://localhost:3000/program/${editData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch("http://localhost:3000/program", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
      }

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal menyimpan program");
        return;
      }

      alert(
        editData
          ? "Program berhasil diperbarui!"
          : "Program berhasil ditambahkan!"
      );

      onClose();
    } catch (err) {
      console.error("ERROR SIMPAN PROGRAM:", err);
      alert("Terjadi kesalahan saat menyimpan program");
    }
  };

  return (
    <div className="prg-modal-overlay">
      <div className="prg-modal">
        {/* HEADER */}
        <div className="prg-modal-header">
          <div>
            <span className="prg-modal-label">PROGRAM BIMBEL</span>

            <h2>{editData ? "Edit Program" : "Tambah Program"}</h2>

            <p>
              {editData
                ? "Perbarui informasi program bimbingan belajar."
                : "Tambahkan program bimbingan belajar baru."}
            </p>
          </div>

          <button type="button" className="prg-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* FORM */}
        <div className="prg-form">
          {/* NAMA PROGRAM */}
          <div className="prg-form-group">
            <label>
              Nama Program <span>*</span>
            </label>

            <input
              type="text"
              name="nama_program"
              placeholder="Contoh: Program Intensif UTBK"
              value={form.nama_program}
              onChange={handleChange}
            />
          </div>

          {/* DESKRIPSI */}
          <div className="prg-form-group">
            <label>Deskripsi</label>

            <textarea
              name="deskripsi"
              placeholder="Masukkan deskripsi program..."
              value={form.deskripsi}
              onChange={handleChange}
              rows="4"
            />
          </div>

          {/* HARGA + DURASI */}
          <div className="prg-form-row">
            <div className="prg-form-group">
              <label>
                Harga <span>*</span>
              </label>

              <div className="prg-input-prefix">
                <span>Rp</span>

                <input
                  type="number"
                  name="harga"
                  placeholder="Contoh: 500000"
                  value={form.harga}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="prg-form-group">
              <label>
                Durasi <span>*</span>
              </label>

              <input
                type="text"
                name="durasi"
                placeholder="Contoh: 3 Bulan"
                value={form.durasi}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* JUMLAH PERTEMUAN + STATUS */}
          <div className="prg-form-row">
            <div className="prg-form-group">
              <label>Jumlah Pertemuan</label>

              <input
                type="number"
                name="jumlah_pertemuan"
                placeholder="Contoh: 24"
                value={form.jumlah_pertemuan}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="prg-form-group">
              <label>Status</label>

              <select name="status" value={form.status} onChange={handleChange}>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="prg-modal-footer">
          <button type="button" className="prg-btn-cancel" onClick={onClose}>
            Batal
          </button>

          <button type="button" className="prg-btn-save" onClick={handleSubmit}>
            {editData ? "Update Program" : "Simpan Program"}
          </button>
        </div>
      </div>
    </div>
  );
}
