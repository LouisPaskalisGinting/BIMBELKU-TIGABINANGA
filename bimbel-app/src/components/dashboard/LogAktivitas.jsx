import { useEffect, useState } from "react";
import "./LogAktivitas.css";

const API_URL = "http://localhost:3000";

export default function LogAktivitas() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // AMBIL LOG AKTIVITAS
  // =====================================================

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Token login tidak ditemukan. Silakan login kembali.");

        window.location.href = "/login";
        return;
      }

      const res = await fetch(`${API_URL}/log-aktivitas`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      // =================================================
      // TOKEN TIDAK VALID
      // =================================================

      if (res.status === 401) {
        alert(
          result.message ||
            "Token tidak valid atau sudah expired. Silakan login kembali."
        );

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        window.location.href = "/login";

        return;
      }

      // =================================================
      // ERROR
      // =================================================

      if (!res.ok) {
        alert(result.message || "Gagal mengambil log aktivitas.");

        return;
      }

      // =================================================
      // SIMPAN DATA
      // =================================================

      setLogs(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("ERROR GET LOG AKTIVITAS:", error);

      alert("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchLogs();
  }, []);

  // =====================================================
  // FORMAT TANGGAL
  // =====================================================

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // ROLE BADGE
  // =====================================================

  const getRoleClass = (role) => {
    const normalizedRole = String(role || "").toLowerCase();

    if (normalizedRole === "admin") {
      return "logx-role-admin";
    }

    if (normalizedRole === "tentor" || normalizedRole === "guru") {
      return "logx-role-tentor";
    }

    if (normalizedRole === "siswa" || normalizedRole === "student") {
      return "logx-role-siswa";
    }

    return "logx-role-default";
  };

  return (
    <main className="logx-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <section className="logx-header">
        <div className="logx-header-content">
          <div className="logx-eyebrow">
            <span className="logx-eyebrow-dot" />
            ADMINISTRATION
          </div>

          <h1 className="logx-title">Log Aktivitas</h1>

          <p className="logx-subtitle">
            Pantau riwayat aktivitas pengguna yang terjadi di dalam sistem.
          </p>
        </div>

        {/* TOTAL LOG */}

        <div className="logx-header-stat">
          <span className="logx-header-stat-number">{logs.length}</span>

          <span className="logx-header-stat-label">Total Aktivitas</span>
        </div>
      </section>

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <section className="logx-table-card">
        {/* TABLE HEADER */}

        <div className="logx-table-header">
          <div className="logx-heading-wrapper">
            <div className="logx-heading-icon">↻</div>

            <div>
              <span className="logx-section-label">RIWAYAT SISTEM</span>

              <h2 className="logx-table-title">Aktivitas Pengguna</h2>

              <p className="logx-table-description">
                Daftar aktivitas yang tercatat pada sistem.
              </p>
            </div>
          </div>

          {/* REFRESH */}

          <button
            type="button"
            className="logx-refresh-button"
            onClick={fetchLogs}
            disabled={loading}
          >
            <span className="logx-refresh-icon">↻</span>
            Refresh
          </button>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="logx-loading">
            <span className="logx-loading-spinner" />

            <div>
              <strong>Memuat log aktivitas</strong>

              <span>Mohon tunggu sebentar...</span>
            </div>
          </div>
        ) : (
          /* =================================================
             TABLE
          ================================================= */

          <div className="logx-table-scroll">
            <table className="logx-table">
              <thead>
                <tr>
                  <th className="logx-col-number">No</th>

                  <th className="logx-col-user">Nama User</th>

                  <th className="logx-col-role">Role</th>

                  <th className="logx-col-activity">Aktivitas</th>

                  <th className="logx-col-description">Keterangan</th>

                  <th className="logx-col-date">Tanggal</th>
                </tr>
              </thead>

              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="logx-empty-cell">
                      <div className="logx-empty">
                        <div className="logx-empty-icon">↻</div>

                        <h3>Belum Ada Aktivitas</h3>

                        <p>Belum terdapat log aktivitas pengguna.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr
                      key={log.id || `${index}-${log.tanggal}`}
                      className="logx-row"
                    >
                      {/* NO */}

                      <td>
                        <span className="logx-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>

                      {/* USER */}

                      <td>
                        <div className="logx-user">
                          <div className="logx-avatar">
                            {String(log.nama_user || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="logx-user-info">
                            <strong>{log.nama_user || "-"}</strong>

                            <span>User</span>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}

                      <td>
                        <span className={`logx-role ${getRoleClass(log.role)}`}>
                          <span className="logx-role-dot" />

                          {log.role || "-"}
                        </span>
                      </td>

                      {/* AKTIVITAS */}

                      <td>
                        <span className="logx-activity">
                          {log.aktivitas || "-"}
                        </span>
                      </td>

                      {/* KETERANGAN */}

                      <td>
                        <span className="logx-description">
                          {log.keterangan || "-"}
                        </span>
                      </td>

                      {/* TANGGAL */}

                      <td>
                        <div className="logx-date">
                          <span className="logx-date-icon">◷</span>

                          <span>{formatTanggal(log.tanggal)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
