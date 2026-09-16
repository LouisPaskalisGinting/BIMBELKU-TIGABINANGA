import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

import AdminLayout from "./components/AdminLayout";
import DashboardAdmin from "./components/dashboard/DashboardAdmin";
import DataSiswa from "./components/dashboard/DataSiswa";
import DataTentor from "./components/dashboard/DataTentor";
import Kelas from "./components/dashboard/Kelas";
import Pembayaran from "./components/dashboard/Pembayaran";
import Absensi from "./components/dashboard/Absensi";
import Nilai from "./components/dashboard/Nilai";
import Jadwal from "./components/dashboard/Jadwal";
import Pengumuman from "./components/dashboard/Pengumuman";
import TambahTentor from "./components/dashboard/TambahTentor";
import DetailKelas from "./components/dashboard/DetailKelas";
import Program from "./components/dashboard/Program";
import LogAktivitas from "./components/dashboard/LogAktivitas";

import KelolaLandingPage from "./components/dashboard/KelolaLandingPage";
import HeroManagement from "./components/dashboard/HeroManagement";
import AboutManagement from "./components/dashboard/AboutManagement";
import TestimonialManagement from "./components/dashboard/TestimonialManagement";
import GaleriManagement from "./components/dashboard/GaleriManagement";
import KontakManagement from "./components/dashboard/KontakManagement";
import FaqManagement from "./components/dashboard/FaqManagement";

import KelolaAdmin from "./components/dashboard/KelolaAdmin";
import KelolaEvent from "./components/dashboard/KelolaEvent";

import SiswaLayout from "./components/SiswaLayout";
import DashboardSiswa from "./components/dashboardsiswa/DashboardSiswa";
import DataDiri from "./components/dashboardsiswa/DataDiri";
import JadwalSiswa from "./components/dashboardsiswa/JadwalSiswa";
import NilaiSiswa from "./components/dashboardsiswa/NilaiSiswa";
import AbsensiSiswa from "./components/dashboardsiswa/AbsensiSiswa";
import PembayaranSiswa from "./components/dashboardsiswa/PembayaranSiswa";
import PengumumanSiswa from "./components/dashboardsiswa/PengumumanSiswa";

import TentorLayout from "./components/dashboardtentor/LayoutTentor";
import DashboardTentor from "./components/dashboardtentor/DashboardTentor";
import JadwalTentor from "./components/dashboardtentor/JadwalTentor";
import AbsensiTentor from "./components/dashboardtentor/AbsensiTentor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route element={<AdminLayout />}>
          <Route path="/dashboard-admin" element={<DashboardAdmin />} />
          <Route path="/data-siswa" element={<DataSiswa />} />
          <Route path="/data-tentor" element={<DataTentor />} />
          <Route path="/kelas" element={<Kelas />} />
          <Route path="/kelas/:id" element={<DetailKelas />} />
          <Route path="/pembayaran" element={<Pembayaran />} />
          <Route path="/absensi" element={<Absensi />} />
          <Route path="/nilai" element={<Nilai />} />
          <Route path="/jadwal" element={<Jadwal />} />
          <Route path="/pengumuman" element={<Pengumuman />} />
          <Route path="/tambahtentor" element={<TambahTentor />} />
          <Route path="/program" element={<Program />} />
          <Route path="/log-aktivitas" element={<LogAktivitas />} />
          <Route path="/Kelola-Landingpage" element={<KelolaLandingPage />} />
          <Route path="/landing/hero" element={<HeroManagement />} />
          <Route path="/landing/about" element={<AboutManagement />} />
          <Route
            path="/landing/testimoni"
            element={<TestimonialManagement />}
          />
          <Route path="/landing/galeri" element={<GaleriManagement />} />
          <Route path="/landing/faq" element={<FaqManagement />} />
          <Route path="/landing/kontak" element={<KontakManagement />} />
          <Route path="/KelolaAdmin" element={<KelolaAdmin />} />
          <Route path="/KelolaEvent" element={<KelolaEvent />} />
        </Route>
        <Route element={<SiswaLayout />}>
          <Route path="/dashboard-siswa" element={<DashboardSiswa />} />
          <Route path="/siswa/data-diri" element={<DataDiri />} />
          <Route path="/siswa/jadwal" element={<JadwalSiswa />} />
          <Route path="/siswa/nilai" element={<NilaiSiswa />} />
          <Route path="/siswa/absensi" element={<AbsensiSiswa />} />
          <Route path="/siswa/pembayaran" element={<PembayaranSiswa />} />
          <Route path="/siswa/pengumuman" element={<PengumumanSiswa />} />
        </Route>
        <Route element={<TentorLayout />}>
          <Route path="/dashboard-tentor" element={<DashboardTentor />} />
          <Route path="/jadwal-tentor" element={<JadwalTentor />} />
          <Route path="/absensi-tentor" element={<AbsensiTentor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
