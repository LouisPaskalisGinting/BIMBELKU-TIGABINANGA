require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS tersedia:", !!process.env.EMAIL_PASS);

// import routes
const authRoutes = require("./routes/auth");
const registerRoutes = require("./routes/Register");
const siswaRoutes = require("./routes/siswa");
const kelasRoutes = require("./routes/Kelas");
const jadwalRoutes = require("./routes/jadwal");
const tentorRoutes = require("./routes/tentor");
const pembayaranRoutes = require("./routes/pembayaran");
const absensiRoutes = require("./routes/absensi");
const pengumumanRoutes = require("./routes/pengumuman");
const programRoutes = require("./routes/program");
const eventRoutes = require("./routes/event");
const nilaiRoutes = require("./routes/nilai");
const notifikasiRoutes = require("./routes/notifikasi");
const dashboardRoutes = require("./routes/dashboard");
const aboutRoutes = require("./routes/about");
const testimonialRoutes = require("./routes/testimonial");
const faqRoutes = require("./routes/faq");
const galeriRoutes = require("./routes/galeri");
const kontakRoutes = require("./routes/kontak");
const adminRoutes = require("./routes/admin");
const logAktivitasRoutes = require("./routes/logAktivitas");

app.use("/auth", authRoutes);
app.use("/register", registerRoutes);
app.use("/siswa", siswaRoutes);
app.use("/kelas", kelasRoutes);
app.use("/jadwal", jadwalRoutes);
app.use("/tentor", tentorRoutes);
app.use("/pembayaran", pembayaranRoutes);
app.use("/absensi", absensiRoutes);
app.use("/pengumuman", pengumumanRoutes);
app.use("/program", programRoutes);
app.use("/event", eventRoutes);
app.use("/nilai", nilaiRoutes);
app.use("/notifikasi", notifikasiRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/about", aboutRoutes);
app.use("/testimonial", testimonialRoutes);
app.use("/faq", faqRoutes);
app.use("/galeri", galeriRoutes);
app.use("/kontak", kontakRoutes);
app.use("/admin", adminRoutes);
app.use("/log-aktivitas", logAktivitasRoutes);

app.use("/hero", require("./routes/hero"));
app.get("/", (req, res) => {
  res.send("Backend Bimbel Berjalan");
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

module.exports = app;
