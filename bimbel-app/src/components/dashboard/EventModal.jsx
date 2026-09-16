import { useState } from "react";
import "./EventModal.css";
export default function EventModal({ onClose, fetchEvent, selectedEvent }) {
  const [form, setForm] = useState({
    judul: selectedEvent?.judul || "",
    deskripsi: selectedEvent?.deskripsi || "",
    tanggal: selectedEvent?.tanggal ? selectedEvent.tanggal.split("T")[0] : "",
    waktu: selectedEvent?.waktu || "",
    lokasi: selectedEvent?.lokasi || "",
  });

  const [loading, setLoading] = useState(false);

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =====================================================
  // HANDLE SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    // Validasi
    if (
      !form.judul.trim() ||
      !form.tanggal ||
      !form.waktu.trim() ||
      !form.lokasi.trim()
    ) {
      alert("Judul, tanggal, waktu, dan lokasi wajib diisi.");
      return;
    }

    // =====================================================
    // AMBIL TOKEN LOGIN
    // =====================================================

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Sesi login tidak ditemukan. Silakan login kembali.");
      return;
    }

    setLoading(true);

    try {
      let res;

      // =====================================================
      // EDIT EVENT
      // =====================================================

      if (selectedEvent) {
        res = await fetch(`http://localhost:3000/event/${selectedEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            judul: form.judul.trim(),
            deskripsi: form.deskripsi.trim(),
            tanggal: form.tanggal,
            waktu: form.waktu.trim(),
            lokasi: form.lokasi.trim(),
          }),
        });
      }

      // =====================================================
      // TAMBAH EVENT
      // =====================================================
      else {
        res = await fetch("http://localhost:3000/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            judul: form.judul.trim(),
            deskripsi: form.deskripsi.trim(),
            tanggal: form.tanggal,
            waktu: form.waktu.trim(),
            lokasi: form.lokasi.trim(),
          }),
        });
      }

      // =====================================================
      // AMBIL RESPONSE
      // =====================================================

      const result = await res.json();

      console.log("RESPONSE EVENT:", result);

      // =====================================================
      // JIKA GAGAL
      // =====================================================

      if (!res.ok) {
        alert(result.message || "Gagal menyimpan event");

        return;
      }

      // =====================================================
      // JIKA BERHASIL
      // =====================================================

      alert(
        result.message ||
          (selectedEvent
            ? "Event berhasil diperbarui"
            : "Event berhasil ditambahkan")
      );

      // Refresh data event
      await fetchEvent();

      // Tutup modal
      onClose();
    } catch (error) {
      console.error("ERROR SIMPAN EVENT:", error);

      alert("Terjadi kesalahan. Pastikan server backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{selectedEvent ? "Edit Event" : "Tambah Event"}</h2>

        {/* JUDUL */}
        <input
          type="text"
          name="judul"
          placeholder="Judul Event"
          value={form.judul}
          onChange={handleChange}
          disabled={loading}
        />

        {/* DESKRIPSI */}
        <textarea
          name="deskripsi"
          placeholder="Deskripsi"
          value={form.deskripsi}
          onChange={handleChange}
          disabled={loading}
        />

        {/* TANGGAL */}
        <input
          type="date"
          name="tanggal"
          value={form.tanggal}
          onChange={handleChange}
          disabled={loading}
        />

        {/* WAKTU */}
        <input
          type="text"
          name="waktu"
          placeholder="Contoh: 08.00 WIB"
          value={form.waktu}
          onChange={handleChange}
          disabled={loading}
        />

        {/* LOKASI */}
        <input
          type="text"
          name="lokasi"
          placeholder="Lokasi"
          value={form.lokasi}
          onChange={handleChange}
          disabled={loading}
        />

        {/* BUTTON */}
        <div className="modal-buttons">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Menyimpan..." : selectedEvent ? "Update" : "Simpan"}
          </button>

          <button onClick={onClose} disabled={loading}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
