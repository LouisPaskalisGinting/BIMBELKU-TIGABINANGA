import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // MENU ADMIN
  // =========================================================

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard-admin",
    },
    {
      label: "Data Siswa",
      path: "/data-siswa",
    },
    {
      label: "Data Tentor",
      path: "/data-tentor",
    },
    {
      label: "Kelas",
      path: "/kelas",
    },
    {
      label: "Pembayaran",
      path: "/pembayaran",
    },
    {
      label: "Absensi",
      path: "/absensi",
    },
    {
      label: "Nilai",
      path: "/nilai",
    },
    {
      label: "Jadwal",
      path: "/jadwal",
    },
    {
      label: "Pengumuman",
      path: "/pengumuman",
    },
    {
      label: "Kelola Admin",
      path: "/KelolaAdmin",
    },
    {
      label: "Log Aktivitas",
      path: "/log-aktivitas",
    },
  ];

  // =========================================================
  // CEK MENU AKTIF
  // =========================================================

  const isActive = (path) => {
    return location.pathname === path;
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    const yakin = window.confirm("Apakah Anda yakin ingin keluar?");

    if (!yakin) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-layout">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">
        {/* ===================================================
            LOGO
        =================================================== */}

        <div className="sidebar-logos">
          <span>BIMBELKU</span>
          <small>TIGABINANGA</small>
        </div>

        {/* ===================================================
            MENU
        =================================================== */}

        <nav className="admin-navigation">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.path}
                className={isActive(item.path) ? "active" : ""}
                onClick={() => navigate(item.path)}
              >
                <span className="menu-dot"></span>

                <span className="menu-label">{item.label}</span>
              </li>
            ))}

            {/* =================================================
                LOGOUT
            ================================================= */}

            <li className="logout-menu" onClick={handleLogout}>
              <span className="menu-dot"></span>

              <span className="menu-label">Log Out</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
