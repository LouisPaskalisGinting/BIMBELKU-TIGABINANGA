import { useEffect, useState } from "react";
import "./Pengumumansiswa.css";

export default function PengumumanSiswa() {
  const [pengumuman, setPengumuman] = useState([]);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await fetch("http://localhost:3000/pengumuman");
    const data = await res.json();

    setPengumuman(data);

    // ambil pengumuman terbaru
    if (data.length > 0) {
      const lastSeen = localStorage.getItem("lastSeenPengumuman");

      if (lastSeen != data[0].id.toString()) {
        setLatest(data[0].id);
      }

      localStorage.setItem("lastSeenPengumuman", data[0].id);
    }
  };

  return (
    <div className="pengumuman-page">
      <h1>Pengumuman</h1>

      {latest && <div className="notif">🔔 Ada pengumuman baru!</div>}

      <div className="pengumuman-list">
        {pengumuman.map((p) => (
          <div
            className={`pengumuman-card ${p.id === latest ? "highlight" : ""}`}
            key={p.id}
          >
            <h3>{p.judul}</h3>
            <p>{p.isi}</p>
            <small>{new Date(p.tanggal).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
