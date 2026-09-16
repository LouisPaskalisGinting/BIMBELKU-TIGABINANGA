import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./DashboardTentor.css";

export default function TentorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  // =====================================================
  // AMBIL USER LOGIN
  // =====================================================

  useEffect(() => {
    try {
      const userStorage = localStorage.getItem("user");

      if (!userStorage) {
        navigate("/login");
        return;
      }

      const userLogin = JSON.parse(userStorage);

      if (!userLogin || userLogin.role !== "tentor") {
        navigate("/login");
        return;
      }

      setUser(userLogin);
    } catch (error) {
      console.error("ERROR USER LOGIN:", error);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/login");
    }
  }, [navigate]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("tentor");
    localStorage.removeItem("tentor_id");

    navigate("/login");
  };

  // =====================================================
  // CEK MENU AKTIF
  // =====================================================

  const isDashboard =
    location.pathname === "/dashboard-tentor" ||
    location.pathname === "/dashboard-tentor/";

  const isJadwal = location.pathname === "/jadwal-tentor";

  const isAbsensi = location.pathname === "/absensi-tentor";

  // =====================================================
  // JIKA USER BELUM DIBACA
  // =====================================================

  if (!user) {
    return (
      <div className="tentor-loading">
        <h2>Memuat Dashboard...</h2>
        <p>Silakan tunggu sebentar.</p>
      </div>
    );
  }

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="tentor-layout">
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="tentor-sidebar">
        {/* LOGO */}
        <div className="sidebar-logo">
          <h2>BimbelKu</h2>
          <p>Panel Tentor</p>
        </div>

        {/* USER */}
        <div className="sidebar-user">
          <div className="avatar">
            {(user.nama || user.name || "T").charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <h4>{user.nama || user.name || "Tentor"}</h4>

            <span>{user.email || "tentor"}</span>
          </div>
        </div>

        {/* =================================================
            MENU
        ================================================= */}

        <nav className="sidebar-menu">
          {/* DASHBOARD */}
          <button
            className={isDashboard ? "active" : ""}
            onClick={() => navigate("/dashboard-tentor")}
          >
            <span>🏠</span>
            Dashboard
          </button>

          {/* JADWAL */}
          <button
            className={isJadwal ? "active" : ""}
            onClick={() => navigate("/jadwal-tentor")}
          >
            <span>📅</span>
            Jadwal Mengajar
          </button>

          {/* ABSENSI */}
          <button
            className={isAbsensi ? "active" : ""}
            onClick={() => navigate("/absensi-tentor")}
          >
            <span>📝</span>
            Absensi Siswa
          </button>
        </nav>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="tentor-main">
        {/* TOPBAR */}

        <div className="topbar">
          <div>
            <h3>
              {isDashboard && "Dashboard"}

              {isJadwal && "Jadwal Mengajar"}

              {isAbsensi && "Absensi Siswa"}
            </h3>

            <p>Sistem Informasi Bimbingan Belajar</p>
          </div>
        </div>

        {/* =================================================
            HALAMAN AKAN MASUK KE SINI
        ================================================= */}

        <Outlet />
      </main>
    </div>
  );
}
