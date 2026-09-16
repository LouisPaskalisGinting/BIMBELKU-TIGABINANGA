import { useEffect, useState } from "react";
import "./KelolaEvent.css";
import EventModal from "./EventModal";

export default function KelolaEvent() {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const res = await fetch("http://localhost:3000/event");
      const data = await res.json();

      if (!res.ok) {
        console.error("Gagal mengambil event:", data);
        setEvents([]);
        return;
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil data event:", error);
      setEvents([]);
    }
  };

  const handleTambah = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus event?")) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Sesi login tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/event/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal menghapus event");
        return;
      }

      alert(result.message || "Event berhasil dihapus");

      await fetchEvent();
    } catch (error) {
      console.error("Gagal menghapus event:", error);

      alert("Terjadi kesalahan. Pastikan server backend berjalan.");
    }
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) {
      return "-";
    }

    const date = new Date(tanggal);

    if (isNaN(date.getTime())) {
      return tanggal;
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="kelola-event">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <section className="event-page-header">
        <div className="event-heading">
          <div className="event-eyebrow">
            <span></span>
            MANAJEMEN EVENT
          </div>

          <h1>Kelola Event</h1>

          <p>
            Tambahkan, ubah, dan kelola event yang akan ditampilkan pada sistem
            BIMBELKU.
          </p>
        </div>

        <button className="btn-tambah-event" onClick={handleTambah}>
          <span className="plus-icon">＋</span>
          Tambah Event
        </button>
      </section>

      {/* =====================================================
          EVENT INFORMATION
          ===================================================== */}

      <section className="event-toolbar">
        <div className="event-toolbar-info">
          <div className="event-count-icon">📅</div>

          <div>
            <strong>Daftar Event</strong>

            <span>{events.length} event terdaftar</span>
          </div>
        </div>

        <div className="event-status">
          <span></span>
          Data terbaru
        </div>
      </section>

      {/* =====================================================
          TABLE
          ===================================================== */}

      <section className="event-table-card">
        <div className="event-table-wrapper">
          <table className="event-table">
            <thead>
              <tr>
                <th className="col-number">No</th>
                <th>Event</th>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Lokasi</th>
                <th className="col-action">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {events.length > 0 ? (
                events.map((item, index) => (
                  <tr key={item.id}>
                    <td className="event-number">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td>
                      <div className="event-title-cell">
                        <div className="event-row-icon">📌</div>

                        <div>
                          <strong>{item.judul}</strong>

                          <span>Event BIMBELKU</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="date-badge">
                        {formatTanggal(item.tanggal)}
                      </span>
                    </td>

                    <td>
                      <span className="time-badge">🕐 {item.waktu || "-"}</span>
                    </td>

                    <td>
                      <div className="location-cell">
                        <span>⌖</span>
                        {item.lokasi || "-"}
                      </div>
                    </td>

                    <td>
                      <div className="event-actions">
                        <button
                          className="btn-event-edit"
                          onClick={() => handleEdit(item)}
                          title="Edit event"
                        >
                          <span>✎</span>
                          Edit
                        </button>

                        <button
                          className="btn-event-delete"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus event"
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
                  <td colSpan="6" className="event-empty">
                    <div className="empty-event-icon">📅</div>

                    <strong>Belum ada event</strong>

                    <span>Event yang Anda tambahkan akan muncul di sini.</span>

                    <button className="empty-add-event" onClick={handleTambah}>
                      ＋ Tambah Event
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER TABLE */}

        {events.length > 0 && (
          <div className="event-table-footer">
            <span>
              Menampilkan <strong>{events.length}</strong> event
            </span>

            <span className="footer-system-status">
              <i></i>
              Sistem aktif
            </span>
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL
          ===================================================== */}

      {showEventModal && (
        <EventModal
          onClose={handleCloseModal}
          fetchEvent={fetchEvent}
          selectedEvent={selectedEvent}
        />
      )}
    </div>
  );
}
