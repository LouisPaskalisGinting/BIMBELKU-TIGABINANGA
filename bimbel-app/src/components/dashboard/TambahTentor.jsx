import { useState, useEffect } from "react";
import "./TambahTentor.css";

export default function TentorModal({ onClose, editData }) {
  const [form, setForm] = useState({
    nama: "",
    mapel: "",
    no_hp: "",
    email: "",
    password: "", // 🔥 TAMBAHAN
  });

  useEffect(() => {
    if (editData) setForm({ ...editData, password: "" });
  }, [editData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.mapel) {
      alert("Nama & mapel wajib");
      return;
    }

    if (!editData && !form.password) {
      alert("Password wajib diisi!");
      return;
    }

    try {
      if (editData) {
        await fetch(`http://localhost:3000/tentor/${editData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("http://localhost:3000/tentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
      alert("Terjadi error");
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal-card">
        <h2>{editData ? "Edit Tentor" : "Tambah Tentor"}</h2>

        <input
          name="nama"
          placeholder="Nama"
          value={form.nama}
          onChange={handleChange}
        />
        <input
          name="mapel"
          placeholder="Mapel"
          value={form.mapel}
          onChange={handleChange}
        />
        <input
          name="no_hp"
          placeholder="No HP"
          value={form.no_hp}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        {/* 🔥 INPUT PASSWORD */}
        {!editData && (
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
        )}

        <div className="modal-action">
          <button onClick={handleSubmit}>Simpan</button>
          <button onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
