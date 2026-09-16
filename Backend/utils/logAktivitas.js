const db = require("../db");

// =====================================================
// FUNCTION LOG AKTIVITAS
// =====================================================

const logAktivitas = ({ user_id, nama_user, role, aktivitas, keterangan }) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO log_aktivitas
      (
        user_id,
        nama_user,
        role,
        aktivitas,
        keterangan,
        tanggal
      )
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      user_id || null,
      nama_user || "-",
      role || "-",
      aktivitas || "-",
      keterangan || "-",
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("ERROR INSERT LOG AKTIVITAS:", err);

        return reject(err);
      }

      console.log("LOG AKTIVITAS BERHASIL, ID:", result.insertId);

      resolve(result);
    });
  });
};

module.exports = logAktivitas;
