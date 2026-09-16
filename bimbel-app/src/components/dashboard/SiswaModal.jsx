import { useState, useEffect } from "react";
import "./SiswaModal.css";

export default function SiswaModal({ editData, onClose }) {
  const [form, setForm] = useState({
    nama: "",
    kelas: "",
    asal_sekolah: "",
    no_hp: "",
    nama_orangtua: "",
    no_hp_orangtua: "",
    program: "",
    email: "",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        nama: editData.nama || "",
        kelas: editData.kelas || "",
        asal_sekolah: editData.asal_sekolah || "",
        no_hp: editData.no_hp || "",
        nama_orangtua: editData.nama_orangtua || "",
        no_hp_orangtua: editData.no_hp_orangtua || "",
        program: editData.program || "",
        email: editData.email || "",
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
    if (!form.nama || !form.kelas || !form.program) {
      alert("Nama, kelas, dan program wajib diisi");
      return;
    }

    try {
      if (editData) {
        await fetch(`http://localhost:3000/siswa/${editData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("http://localhost:3000/siswa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
      }

      onClose();
    } catch (err) {
      console.log(err);
      alert("Gagal menyimpan data");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{editData ? "Edit Siswa" : "Tambah Siswa"}</h2>

        <input
          name="nama"
          placeholder="Nama Siswa"
          value={form.nama}
          onChange={handleChange}
        />

        <input
          name="kelas"
          placeholder="Kelas"
          value={form.kelas}
          onChange={handleChange}
        />

        <input
          name="asal_sekolah"
          placeholder="Asal Sekolah"
          value={form.asal_sekolah}
          onChange={handleChange}
        />

        <input
          name="no_hp"
          placeholder="No HP"
          value={form.no_hp}
          onChange={handleChange}
        />

        <input
          name="nama_orangtua"
          placeholder="Nama Orang Tua"
          value={form.nama_orangtua}
          onChange={handleChange}
        />

        <input
          name="no_hp_orangtua"
          placeholder="No HP Orang Tua"
          value={form.no_hp_orangtua}
          onChange={handleChange}
        />

        <select name="program" value={form.program} onChange={handleChange}>
          <option value="">Pilih Program</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <div className="modal-buttons">
          <button onClick={handleSubmit}>
            {editData ? "Update" : "Simpan"}
          </button>

          <button onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
