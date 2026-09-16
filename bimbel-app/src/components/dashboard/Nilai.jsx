import { useState, useEffect } from "react";
import "./Nilai.css";

export default function UploadNilai() {
  const [event, setEvent] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, []);

  // =========================================
  // GET EVENT
  // =========================================
  const fetchEvent = async () => {
    try {
      const res = await fetch("http://localhost:3000/event");
      const data = await res.json();

      setEvent(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data event:", err);
      setEvent([]);
    }
  };

  // =========================================
  // GET FILE NILAI
  // =========================================
  const fetchFiles = async (eventId) => {
    if (!eventId) {
      setFiles([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/nilai/files/${eventId}`);

      const data = await res.json();

      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil file nilai:", err);
      setFiles([]);
    }
  };

  // =========================================
  // UPLOAD NILAI
  // =========================================
  const uploadFile = async () => {
    if (!file || !selectedEvent) {
      alert("Pilih event dan file terlebih dahulu");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/nilai/upload/${selectedEvent}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal upload nilai");
        return;
      }

      alert(data.message || "Nilai berhasil diupload");

      setFile(null);

      // Reset input file
      const fileInput = document.querySelector('input[type="file"]');

      if (fileInput) {
        fileInput.value = "";
      }

      fetchFiles(selectedEvent);
    } catch (err) {
      console.error("Gagal upload nilai:", err);
      alert("Server tidak terhubung");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-nilai-page">
      <h1>Upload Nilai</h1>

      {/* ========================================= */}
      {/* FORM UPLOAD */}
      {/* ========================================= */}

      <div className="upload-card">
        <h2>Form Upload Nilai</h2>

        <div className="upload-form">
          {/* EVENT */}
          <div className="form-group">
            <label>Pilih Event</label>

            <select
              value={selectedEvent}
              onChange={(e) => {
                const eventId = e.target.value;

                setSelectedEvent(eventId);
                fetchFiles(eventId);
              }}
            >
              <option value="">Pilih Event</option>

              {event.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.judul}
                </option>
              ))}
            </select>
          </div>

          {/* FILE */}
          <div className="form-group">
            <label>Upload File Excel</label>

            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                setFile(e.target.files[0] || null);
              }}
            />

            {file && <p className="file-name">File dipilih: {file.name}</p>}
          </div>

          {/* BUTTON */}
          <button
            className="btn-upload"
            onClick={uploadFile}
            disabled={loading}
          >
            {loading ? "Mengupload..." : "Upload Excel"}
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* FILE NILAI */}
      {/* ========================================= */}

      <div className="file-card">
        <h2>File Nilai</h2>

        {files.length > 0 ? (
          <div className="file-list">
            {files.map((f) => (
              <div className="file-item" key={f.id}>
                <div>
                  <h3>{f.nama_file}</h3>

                  <p>File nilai siswa</p>
                </div>

                <a
                  href={`http://localhost:3000/uploads/${f.path_file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-open"
                >
                  Buka
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-file">Belum ada file nilai untuk event ini</div>
        )}
      </div>
    </div>
  );
}
