import { useEffect, useState } from "react";
import "./TestimonialModal.css";

export default function TestimonialModal({ editData, onClose }) {
  const [form, setForm] = useState({
    nama: "",
    asal_sekolah: "",
    universitas: "",
    pesan: "",
    signature: "",
  });

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        nama: editData.nama || "",
        asal_sekolah: editData.asal_sekolah || "",
        universitas: editData.universitas || "",
        pesan: editData.pesan || "",
        signature: editData.signature || "",
      });

      if (editData.foto) {
        setPreview(`http://localhost:3000${editData.foto}`);
      }
    }
  }, [editData]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("nama", form.nama);
    formData.append("asal_sekolah", form.asal_sekolah);
    formData.append("universitas", form.universitas);
    formData.append("pesan", form.pesan);
    formData.append("signature", form.signature);

    if (foto) {
      formData.append("foto", foto);
    }

    try {
      let url = "http://localhost:3000/testimonial";
      let method = "POST";

      if (editData) {
        url = `http://localhost:3000/testimonial/${editData.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();

      alert(data.message);

      onClose();
    } catch (err) {
      console.log(err);
      alert("Terjadi kesalahan");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="testimonial-modal">
        <h2>{editData ? "Edit Testimoni" : "Tambah Testimoni"}</h2>

        <form onSubmit={handleSubmit}>
          <label>Nama</label>

          <input
            type="text"
            name="nama"
            value={form.nama}
            onChange={handleChange}
            required
          />

          <label>Asal Sekolah</label>

          <input
            type="text"
            name="asal_sekolah"
            value={form.asal_sekolah}
            onChange={handleChange}
            required
          />

          <label>Universitas</label>

          <input
            type="text"
            name="universitas"
            value={form.universitas}
            onChange={handleChange}
            required
          />

          <label>Pesan</label>

          <textarea
            rows="4"
            name="pesan"
            value={form.pesan}
            onChange={handleChange}
            required
          />

          <label>Signature</label>

          <input
            type="text"
            name="signature"
            value={form.signature}
            onChange={handleChange}
          />

          <label>Foto</label>

          <input type="file" accept="image/*" onChange={handleImage} />

          {preview && (
            <img src={preview} alt="Preview" className="preview-image" />
          )}

          <div className="modal-buttons">
            <button type="submit" className="btn-save">
              Simpan
            </button>

            <button type="button" className="btn-cancel" onClick={onClose}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
