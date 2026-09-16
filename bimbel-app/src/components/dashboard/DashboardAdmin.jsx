import React, { useEffect, useState } from "react";
import "./DashboardAdmin.css";
import { useNavigate } from "react-router-dom";

export default function DashboardAdmin() {
  const navigate = useNavigate();

  // ============================================================
  // USER LOGIN
  // ============================================================

  const [adminName, setAdminName] = useState("Admin");

  // ============================================================
  // NOTIFICATION
  // ============================================================

  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(true);

  // ============================================================
  // STATISTIK
  // ============================================================

  const [stats, setStats] = useState({
    total_siswa: 0,
    total_tentor: 0,
    kelas_hari_ini: 0,
    pendaftar_bulan_ini: 0,
  });

  // ============================================================
  // AMBIL DATA ADMIN YANG LOGIN
  // ============================================================

  useEffect(() => {
    try {
      const userStorage = localStorage.getItem("user");

      console.log("====================================");
      console.log("DATA USER DASHBOARD");
      console.log("====================================");
      console.log("USER STORAGE:", userStorage);

      if (!userStorage) {
        console.warn("Data user tidak ditemukan di localStorage.");
        setAdminName("Admin");
        return;
      }

      const user = JSON.parse(userStorage);

      console.log("USER:", user);
      console.log("NAMA ADMIN:", user.nama);
      console.log("ROLE:", user.role);

      // Ambil nama dari user.nama
      if (user.nama && String(user.nama).trim() !== "") {
        setAdminName(String(user.nama).trim());
      } else {
        setAdminName("Admin");
      }
    } catch (error) {
      console.error("Gagal membaca data user:", error);
      setAdminName("Admin");
    }
  }, []);

  // ============================================================
  // FETCH DATA DASHBOARD
  // ============================================================

  useEffect(() => {
    fetchStats();
    fetchNotifikasi();

    const interval = setInterval(() => {
      fetchStats();
      fetchNotifikasi();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // FETCH STATISTIK
  // ============================================================

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("http://localhost:3000/dashboard/stats", {
        method: "GET",
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil statistik dashboard.");
      }

      setStats({
        total_siswa: data.total_siswa || 0,
        total_tentor: data.total_tentor || 0,
        kelas_hari_ini: data.kelas_hari_ini || 0,
        pendaftar_bulan_ini: data.pendaftar_bulan_ini || 0,
      });
    } catch (error) {
      console.error("Gagal mengambil statistik dashboard:", error);
    }
  };

  // ============================================================
  // FETCH NOTIFIKASI
  // ============================================================

  const fetchNotifikasi = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("http://localhost:3000/notifikasi", {
        method: "GET",
        headers,
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
      setNotifications([]);
    } finally {
      setLoadingNotif(false);
    }
  };

  // ============================================================
  // HELPER WAKTU NOTIFIKASI
  // ============================================================

  const getNotificationTime = (waktu) => {
    if (!waktu) {
      return "Baru saja";
    }

    const date = new Date(waktu);

    if (Number.isNaN(date.getTime())) {
      return "Baru saja";
    }

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // ICON NOTIFIKASI
  // ============================================================

  const getNotificationIcon = (tipe) => {
    if (tipe === "pendaftaran") return "📝";
    if (tipe === "pembayaran") return "💳";
    if (tipe === "absensi") return "✅";
    if (tipe === "jadwal") return "📚";

    return "🔔";
  };

  // ============================================================
  // CLASS NOTIFIKASI
  // ============================================================

  const getNotificationClass = (tipe) => {
    if (tipe === "pendaftaran") return "notification-registration";
    if (tipe === "pembayaran") return "notification-payment";
    if (tipe === "absensi") return "notification-attendance";
    if (tipe === "jadwal") return "notification-schedule";

    return "notification-default";
  };

  // ============================================================
  // KPI
  // ============================================================

  const kpiData = [
    {
      title: "Total Siswa",
      value: stats.total_siswa,
      icon: "🎓",
      description: "Siswa terdaftar",
    },
    {
      title: "Total Tentor",
      value: stats.total_tentor,
      icon: "👨‍🏫",
      description: "Tentor aktif",
    },
    {
      title: "Kelas Hari Ini",
      value: stats.kelas_hari_ini,
      icon: "📚",
      description: "Jadwal pembelajaran",
    },
    {
      title: "Pendaftaran Bulan Ini",
      value: stats.pendaftar_bulan_ini,
      icon: "📝",
      description: "Pendaftar baru",
    },
  ];

  // ============================================================
  // SUMMARY
  // ============================================================

  const summaryData = [
    {
      label: "Pendaftaran Pending",
      value: notifications.filter((item) => item.tipe === "pendaftaran").length,
      type: "warning",
    },
    {
      label: "Pembayaran Pending",
      value: notifications.filter((item) => item.tipe === "pembayaran").length,
      type: "warning",
    },
    {
      label: "Notifikasi Aktif",
      value: notifications.length,
      type: "info",
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="dashboard-page">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <section className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-heading">
            <div className="dashboard-label">
              <span></span>
              Dashboard Admin
            </div>

            {/* ==================================================
                NAMA ADMIN
            ================================================== */}

            <h1>
              Selamat Datang, <span className="admin-name">{adminName}</span>{" "}
              <span className="wave">👋</span>
            </h1>

            <p>
              Pantau aktivitas siswa, tentor, program, pembayaran, dan jadwal
              bimbel dalam satu tempat.
            </p>
          </div>

          {/* ==================================================
              ACTION BUTTON
          ================================================== */}

          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/KelolaEvent")}
            >
              <span>＋</span>
              Kelola Event
            </button>

            <button
              className="btn btn-outline"
              onClick={() => navigate("/program")}
            >
              Kelola Program
            </button>

            <button
              className="btn btn-outline"
              onClick={() => navigate("/Kelola-Landingpage")}
            >
              Landing Page
            </button>
          </div>
        </div>

        <div className="header-decoration"></div>
      </section>

      {/* ========================================================
          KPI
      ======================================================== */}

      <section className="kpi-container">
        {kpiData.map((item, index) => (
          <div className="kpi-card" key={index}>
            <div className="kpi-accent"></div>

            <div className="kpi-icon">{item.icon}</div>

            <div className="kpi-information">
              <span className="kpi-title">{item.title}</span>

              <strong className="kpi-value">{item.value}</strong>

              <span className="kpi-description">{item.description}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ========================================================
          MAIN DASHBOARD CONTENT
      ======================================================== */}

      <section className="dashboard-grid">
        {/* ======================================================
            NOTIFICATION
        ====================================================== */}

        <div className="panel notification-panel">
          <div className="panel-header">
            <div>
              <div className="section-eyebrow">AKTIVITAS SISTEM</div>

              <h2>Notifikasi Terbaru</h2>

              <p>Aktivitas terbaru yang terjadi pada sistem bimbel.</p>
            </div>

            <span className="status-badge">
              <span className="status-dot"></span>
              Realtime
            </span>
          </div>

          <div className="notification-list">
            {loadingNotif ? (
              <div className="empty-notification">
                <div className="loading-spinner"></div>

                <span>Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-notification">
                <div className="empty-icon">🔔</div>

                <strong>Belum ada aktivitas</strong>

                <span>Notifikasi terbaru akan muncul di sini.</span>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div
                  className={`notification-item ${getNotificationClass(
                    notif.tipe
                  )}`}
                  key={`${notif.tipe}-${notif.id}-${index}`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.tipe)}
                  </div>

                  <div className="notification-info">
                    <h4>{notif.title}</h4>

                    <p>{notif.description}</p>

                    <span className="notification-time mobile-time">
                      {getNotificationTime(notif.waktu)}
                    </span>
                  </div>

                  <span className="notification-time">
                    {getNotificationTime(notif.waktu)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <div className="panel summary-panel">
          <div className="panel-header">
            <div>
              <div className="section-eyebrow">RINGKASAN</div>

              <h2>Status Hari Ini</h2>

              <p>Informasi penting yang perlu diperhatikan.</p>
            </div>
          </div>

          <div className="summary-list">
            {summaryData.map((item, index) => (
              <div className={`summary-item summary-${item.type}`} key={index}>
                <div className="summary-label">
                  <span className="summary-indicator"></span>

                  <span>{item.label}</span>
                </div>

                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
