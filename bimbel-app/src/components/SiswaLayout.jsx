import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./SiswaLayout.css";

export default function SiswaLayout() {
  const siswa = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard-siswa",
    },
    {
      label: "Data Diri",
      path: "/siswa/data-diri",
    },
    {
      label: "Jadwal",
      path: "/siswa/jadwal",
    },
    {
      label: "Nilai",
      path: "/siswa/nilai",
    },
    {
      label: "Absensi",
      path: "/siswa/absensi",
    },
    {
      label: "Pembayaran",
      path: "/siswa/pembayaran",
    },
    {
      label: "Pengumuman",
      path: "/siswa/pengumuman",
    },
  ];

  return (
    <div className="siswa-layout">
      <aside className="siswa-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">B</div>
          <div>
            <h2>BIMBELKU</h2>
            <p>Portal Siswa</p>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {siswa.nama ? siswa.nama.charAt(0).toUpperCase() : "S"}
          </div>

          <div>
            <h3>{siswa.nama || "Siswa"}</h3>
            <p>{siswa.email || "siswa@bimbelku.com"}</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={location.pathname === item.path ? "active" : ""}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className="logout-btn" onClick={logout}>
          <span>🚪</span>
          Logout
        </button>
      </aside>

      <main className="siswa-main">
        <Outlet />
      </main>
    </div>
  );
}
