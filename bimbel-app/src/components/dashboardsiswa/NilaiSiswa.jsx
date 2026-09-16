import { useCallback, useEffect, useState } from "react";
import "./NilaiSiswa.css";

export default function NilaiSiswa() {
  // =====================================================
  // KONFIGURASI
  // =====================================================

  const API_URL = "http://localhost:3000";

  // =====================================================
  // STATE
  // =====================================================

  const [event, setEvent] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const [nilai, setNilai] = useState([]);
  const [files, setFiles] = useState([]);

  const [siswa, setSiswa] = useState(null);
  const [siswaId, setSiswaId] = useState(null);

  const [loadingSiswa, setLoadingSiswa] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [loadingNilai, setLoadingNilai] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const [errorSiswa, setErrorSiswa] = useState("");
  const [errorNilai, setErrorNilai] = useState("");
  const [errorFile, setErrorFile] = useState("");

  // =====================================================
  // HEADER
  // =====================================================

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, []);

  // =====================================================
  // AMBIL USER LOGIN
  // =====================================================

  const getUserLogin = useCallback(() => {
    try {
      const userStorage = localStorage.getItem("user");

      if (!userStorage) {
        console.error("USER LOGIN TIDAK DITEMUKAN");
        return null;
      }

      const user = JSON.parse(userStorage);

      console.log("====================================");
      console.log("USER LOGIN");
      console.log(user);
      console.log("USER ID:", user.id);
      console.log("NAMA:", user.nama);
      console.log("ROLE:", user.role);
      console.log("====================================");

      return user;
    } catch (error) {
      console.error("ERROR MEMBACA USER:", error);
      return null;
    }
  }, []);

  // =====================================================
  // AMBIL DATA SISWA
  // =====================================================
  //
  // PRIORITAS:
  //
  // 1. localStorage.siswa
  // 2. localStorage.siswa_id
  // 3. Jika tidak ada, cari melalui user_id
  //
  // CONTOH:
  //
  // user.id   = 24
  // siswa.id  = 47
  // siswa.user_id = 24
  //
  // =====================================================

  const fetchSiswa = useCallback(async () => {
    try {
      setLoadingSiswa(true);
      setErrorSiswa("");

      console.log("====================================");
      console.log("MENGAMBIL DATA SISWA");
      console.log("====================================");

      // =================================================
      // 1. CEK TOKEN
      // =================================================

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token login tidak ditemukan.");
      }

      // =================================================
      // 2. CEK LOCAL STORAGE SISWA
      // =================================================

      const siswaStorage = localStorage.getItem("siswa");
      const siswaIdStorage = localStorage.getItem("siswa_id");

      console.log("SISWA STORAGE:", siswaStorage);
      console.log("SISWA ID STORAGE:", siswaIdStorage);

      // =================================================
      // 3. JIKA DATA SISWA ADA DI LOCAL STORAGE
      // =================================================

      if (siswaStorage) {
        try {
          const siswaLocal = JSON.parse(siswaStorage);

          // Ambil ID dari object siswa
          // atau dari localStorage.siswa_id
          const idSiswaLocal = Number(siswaLocal?.id || siswaIdStorage);

          console.log("DATA SISWA LOCAL:", siswaLocal);
          console.log("ID SISWA LOCAL:", idSiswaLocal);

          if (
            siswaLocal &&
            Number.isInteger(idSiswaLocal) &&
            idSiswaLocal > 0
          ) {
            const dataSiswa = {
              ...siswaLocal,
              id: idSiswaLocal,
            };

            setSiswa(dataSiswa);
            setSiswaId(idSiswaLocal);

            // Pastikan ID siswa tersimpan
            localStorage.setItem("siswa_id", String(idSiswaLocal));

            // Pastikan data siswa tersimpan
            localStorage.setItem("siswa", JSON.stringify(dataSiswa));

            console.log("====================================");
            console.log("DATA SISWA BERHASIL DIAMBIL");
            console.log("SUMBER: LOCAL STORAGE");
            console.log("SISWA ID:", idSiswaLocal);
            console.log("NAMA:", dataSiswa.nama);
            console.log("EMAIL:", dataSiswa.email);
            console.log("====================================");

            return dataSiswa;
          }
        } catch (localError) {
          console.error("DATA SISWA LOCAL STORAGE TIDAK VALID:", localError);
        }
      }

      // =================================================
      // 4. JIKA HANYA SISWA_ID YANG ADA
      // =================================================

      if (siswaIdStorage) {
        const idSiswaLocal = Number(siswaIdStorage);

        if (Number.isInteger(idSiswaLocal) && idSiswaLocal > 0) {
          console.log("====================================");
          console.log("SISWA ID DITEMUKAN DI LOCAL STORAGE");
          console.log("SISWA ID:", idSiswaLocal);
          console.log("DATA SISWA BELUM TERSEDIA SEBAGAI OBJECT");
          console.log("====================================");

          // Data minimal agar halaman dapat menggunakan ID
          const dataSiswaMinimal = {
            id: idSiswaLocal,
          };

          setSiswa(dataSiswaMinimal);
          setSiswaId(idSiswaLocal);

          return dataSiswaMinimal;
        }
      }

      // =================================================
      // 5. LOCAL STORAGE TIDAK ADA
      // CARI BERDASARKAN USER ID
      // =================================================

      const user = getUserLogin();

      if (!user) {
        throw new Error("Data user login tidak ditemukan.");
      }

      const userId = user.id || user.user_id || localStorage.getItem("user_id");

      if (!userId) {
        throw new Error("ID user tidak ditemukan.");
      }

      console.log("====================================");
      console.log("DATA SISWA TIDAK ADA DI LOCAL STORAGE");
      console.log("MENCARI DATA SISWA DARI BACKEND");
      console.log("USER ID:", userId);
      console.log("====================================");

      // =================================================
      // PENTING:
      //
      // Route backend nilai.js:
      //
      // router.get("/siswa/user/:user_id")
      //
      // Jika nilai.js dipasang:
      //
      // app.use("/nilai", nilaiRoutes)
      //
      // maka URL:
      //
      // /nilai/siswa/user/:user_id
      //
      // =================================================

      const url = `${API_URL}/nilai/siswa/user/${userId}`;

      console.log("REQUEST DATA SISWA:");
      console.log(url);

      const res = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      let result;

      try {
        result = await res.json();
      } catch {
        result = {};
      }

      console.log("====================================");
      console.log("HASIL REQUEST DATA SISWA");
      console.log("STATUS:", res.status);
      console.log(result);
      console.log("====================================");

      if (!res.ok) {
        throw new Error(
          result.message || "Data siswa berdasarkan user ID tidak ditemukan."
        );
      }

      // =================================================
      // VALIDASI ID SISWA
      // =================================================

      if (!result.id) {
        throw new Error("Data siswa ditemukan tetapi ID siswa tidak tersedia.");
      }

      const idSiswa = Number(result.id);

      if (!Number.isInteger(idSiswa) || idSiswa <= 0) {
        throw new Error("ID siswa tidak valid.");
      }

      // =================================================
      // SIMPAN DATA SISWA
      // =================================================

      setSiswa(result);
      setSiswaId(idSiswa);

      localStorage.setItem("siswa_id", String(idSiswa));

      localStorage.setItem("siswa", JSON.stringify(result));

      console.log("====================================");
      console.log("DATA SISWA BERHASIL DIAMBIL");
      console.log("SUMBER: BACKEND");
      console.log("USER ID:", userId);
      console.log("SISWA ID:", idSiswa);
      console.log("NAMA:", result.nama);
      console.log("EMAIL:", result.email);
      console.log("====================================");

      return result;
    } catch (error) {
      console.error("====================================");
      console.error("ERROR FETCH DATA SISWA");
      console.error(error);
      console.error("====================================");

      setSiswa(null);
      setSiswaId(null);

      setErrorSiswa(error.message || "Gagal mengambil data siswa.");

      return null;
    } finally {
      setLoadingSiswa(false);
    }
  }, [getHeaders, getUserLogin]);

  // =====================================================
  // AMBIL EVENT
  // =====================================================

  const fetchEvent = useCallback(async () => {
    try {
      setLoadingEvent(true);

      const res = await fetch(`${API_URL}/event`, {
        method: "GET",
        headers: getHeaders(),
      });

      let data;

      try {
        data = await res.json();
      } catch {
        data = [];
      }

      console.log("====================================");
      console.log("DATA EVENT");
      console.log(data);
      console.log("====================================");

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil event.");
      }

      const eventData = Array.isArray(data) ? data : [];

      setEvent(eventData);
    } catch (error) {
      console.error("GAGAL MENGAMBIL EVENT:", error);

      setEvent([]);
    } finally {
      setLoadingEvent(false);
    }
  }, [getHeaders]);

  // =====================================================
  // AMBIL SEMUA NILAI SISWA
  // =====================================================
  //
  // ENDPOINT:
  //
  // GET /nilai/siswa/:siswa_id
  //
  // Contoh:
  //
  // siswa_id = 47
  //
  // GET /nilai/siswa/47
  //
  // =====================================================

  const fetchNilai = useCallback(
    async (eventId) => {
      if (!eventId) {
        setNilai([]);
        return;
      }

      if (!siswaId) {
        console.error("SISWA ID BELUM TERSEDIA");

        setNilai([]);
        setErrorNilai("ID siswa belum tersedia.");

        return;
      }

      try {
        setLoadingNilai(true);
        setErrorNilai("");

        const idSiswa = Number(siswaId);
        const idEvent = Number(eventId);

        if (!Number.isInteger(idSiswa) || idSiswa <= 0) {
          throw new Error("ID siswa tidak valid.");
        }

        if (!Number.isInteger(idEvent) || idEvent <= 0) {
          throw new Error("ID event tidak valid.");
        }

        console.log("====================================");
        console.log("MENGAMBIL NILAI SISWA");
        console.log("SISWA ID:", idSiswa);
        console.log("EVENT ID:", idEvent);
        console.log("====================================");

        // =================================================
        // REQUEST NILAI
        // =================================================

        const url = `${API_URL}/nilai/siswa/${idSiswa}`;

        console.log("REQUEST NILAI:");
        console.log(url);

        const res = await fetch(url, {
          method: "GET",
          headers: getHeaders(),
        });

        let data;

        try {
          data = await res.json();
        } catch {
          data = [];
        }

        console.log("====================================");
        console.log("RESPONSE NILAI");
        console.log("STATUS:", res.status);
        console.log(data);
        console.log("====================================");

        if (!res.ok) {
          throw new Error(data.message || "Gagal mengambil nilai.");
        }

        const semuaNilai = Array.isArray(data) ? data : [];

        console.log("SEMUA NILAI SISWA:", semuaNilai);

        // =================================================
        // FILTER EVENT
        // =================================================

        const hasilFilter = semuaNilai.filter((item) => {
          return Number(item.event_id) === idEvent;
        });

        console.log("====================================");
        console.log("FILTER NILAI");
        console.log("EVENT ID:", idEvent);
        console.log("HASIL:", hasilFilter);
        console.log("JUMLAH:", hasilFilter.length);
        console.log("====================================");

        setNilai(hasilFilter);
      } catch (error) {
        console.error("GAGAL MENGAMBIL NILAI:", error);

        setNilai([]);

        setErrorNilai(error.message || "Gagal mengambil nilai.");
      } finally {
        setLoadingNilai(false);
      }
    },
    [getHeaders, siswaId]
  );

  // =====================================================
  // AMBIL FILE NILAI
  // =====================================================

  const fetchFiles = useCallback(
    async (eventId) => {
      if (!eventId) {
        setFiles([]);
        return;
      }

      try {
        setLoadingFile(true);
        setErrorFile("");

        console.log("====================================");
        console.log("MENGAMBIL FILE NILAI");
        console.log("EVENT ID:", eventId);
        console.log("====================================");

        const url = `${API_URL}/nilai/files/${eventId}`;

        console.log("REQUEST FILE:");
        console.log(url);

        const res = await fetch(url, {
          method: "GET",
          headers: getHeaders(),
        });

        let data;

        try {
          data = await res.json();
        } catch {
          data = [];
        }

        console.log("====================================");
        console.log("HASIL FILE NILAI");
        console.log("STATUS:", res.status);
        console.log(data);
        console.log("====================================");

        if (!res.ok) {
          throw new Error(data.message || "Gagal mengambil file nilai.");
        }

        setFiles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("GAGAL MENGAMBIL FILE NILAI:", error);

        setFiles([]);

        setErrorFile(error.message || "Gagal mengambil file nilai.");
      } finally {
        setLoadingFile(false);
      }
    },
    [getHeaders]
  );

  // =====================================================
  // LOAD AWAL
  // =====================================================

  useEffect(() => {
    fetchSiswa();
    fetchEvent();
  }, [fetchSiswa, fetchEvent]);

  // =====================================================
  // LOAD NILAI KETIKA SISWA + EVENT TERSEDIA
  // =====================================================

  useEffect(() => {
    if (!selectedEvent || !siswaId) {
      setNilai([]);
      setFiles([]);

      return;
    }

    fetchNilai(selectedEvent);
    fetchFiles(selectedEvent);
  }, [selectedEvent, siswaId, fetchNilai, fetchFiles]);

  // =====================================================
  // PILIH EVENT
  // =====================================================

  const handleEventChange = (e) => {
    const eventId = e.target.value;

    console.log("====================================");

    console.log("EVENT DIPILIH:", eventId);

    console.log("SISWA ID:", siswaId);

    console.log("====================================");

    setSelectedEvent(eventId);

    setNilai([]);
    setFiles([]);

    setErrorNilai("");
    setErrorFile("");
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    console.log("====================================");
    console.log("REFRESH DATA NILAI");
    console.log("====================================");

    // Ambil ulang siswa
    const siswaData = await fetchSiswa();

    // Ambil ulang event
    await fetchEvent();

    // Jika siswa dan event tersedia,
    // ambil ulang nilai dan file
    if (siswaData && selectedEvent) {
      await fetchNilai(selectedEvent);

      await fetchFiles(selectedEvent);
    }
  };

  // =====================================================
  // LOADING DATA SISWA
  // =====================================================

  if (loadingSiswa) {
    return (
      <div className="nilai-siswa-container">
        <div className="nilai-siswa-card">
          <div className="nilai-loading">
            <h2>Memuat Data Siswa...</h2>

            <p>Sedang mengambil data akun siswa.</p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // DATA SISWA TIDAK DITEMUKAN
  // =====================================================

  if (!siswa || !siswaId) {
    return (
      <div className="nilai-siswa-container">
        <div className="nilai-siswa-card">
          <div className="nilai-empty">
            <div className="empty-icon">⚠️</div>

            <h2>Data siswa tidak ditemukan</h2>

            <p>
              {errorSiswa || "Akun login belum terhubung dengan data siswa."}
            </p>

            <button type="button" className="retry-btn" onClick={handleRefresh}>
              🔄 Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RETURN UTAMA
  // =====================================================

  return (
    <div className="nilai-siswa-container">
      <div className="nilai-siswa-card">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="nilai-siswa-header">
          <div>
            <h1 className="nilai-siswa-title">📊 Nilai Saya</h1>

            <p>Lihat hasil nilai berdasarkan event yang telah diikuti.</p>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loadingSiswa}
          >
            🔄 Refresh
          </button>
        </div>

        {/* =================================================
            INFORMASI SISWA
        ================================================= */}

        <div className="nilai-siswa-info">
          <div className="info-item">
            <span>Nama Siswa</span>

            <strong>{siswa.nama || "-"}</strong>
          </div>

          <div className="info-item">
            <span>ID Siswa</span>

            <strong>{siswa.id || siswaId || "-"}</strong>
          </div>

          <div className="info-item">
            <span>Kelas</span>

            <strong>{siswa.nama_kelas || siswa.kelas || "-"}</strong>
          </div>
        </div>

        {/* =================================================
            FILTER EVENT
        ================================================= */}

        <div className="nilai-filter">
          <label htmlFor="event">Pilih Event</label>

          <select
            id="event"
            value={selectedEvent}
            onChange={handleEventChange}
            disabled={loadingEvent}
          >
            <option value="">
              {loadingEvent ? "Memuat event..." : "Pilih Event"}
            </option>

            {event.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.judul || ev.nama_event || `Event ${ev.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* =================================================
            HASIL NILAI
        ================================================= */}

        {selectedEvent && (
          <div className="nilai-section">
            <div className="section-header">
              <div>
                <h2>📋 Hasil Nilai</h2>

                <p>Nilai siswa pada event yang dipilih.</p>
              </div>
            </div>

            {loadingNilai ? (
              <div className="nilai-loading">
                <p>Memuat nilai...</p>
              </div>
            ) : errorNilai ? (
              <div className="nilai-error">{errorNilai}</div>
            ) : (
              <div className="nilai-table-wrapper">
                <table className="nilai-table">
                  <thead>
                    <tr>
                      <th>No</th>

                      <th>Nama</th>

                      <th>Nilai</th>
                    </tr>
                  </thead>

                  <tbody>
                    {nilai.length > 0 ? (
                      nilai.map((n, index) => (
                        <tr
                          key={n.id || `${n.event_id}-${n.siswa_id}-${index}`}
                        >
                          <td>{index + 1}</td>

                          <td>{n.nama || siswa.nama || "-"}</td>

                          <td>
                            <span className="nilai-angka">
                              {n.nilai ?? "-"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="nilai-empty">
                          Belum ada nilai untuk event ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            FILE SPREADSHEET
        ================================================= */}

        {selectedEvent && (
          <div className="nilai-section file-section">
            <div className="section-header">
              <div>
                <h2>📑 Spreadsheet Nilai</h2>

                <p>File nilai yang telah diunggah oleh admin.</p>
              </div>
            </div>

            {loadingFile ? (
              <div className="nilai-loading">
                <p>Memuat spreadsheet...</p>
              </div>
            ) : errorFile ? (
              <div className="nilai-error">{errorFile}</div>
            ) : files.length > 0 ? (
              <div className="file-list">
                {files.map((file, index) => {
                  // =================================================
                  // BENTUK PATH FILE
                  // =================================================

                  let fileUrl = "";

                  if (file.path_file) {
                    if (file.path_file.startsWith("http")) {
                      fileUrl = file.path_file;
                    } else if (file.path_file.startsWith("/")) {
                      fileUrl = `${API_URL}${file.path_file}`;
                    } else {
                      fileUrl = `${API_URL}/uploads/${file.path_file}`;
                    }
                  } else if (file.path) {
                    if (file.path.startsWith("http")) {
                      fileUrl = file.path;
                    } else if (file.path.startsWith("/")) {
                      fileUrl = `${API_URL}${file.path}`;
                    } else {
                      fileUrl = `${API_URL}/uploads/${file.path}`;
                    }
                  }

                  const namaFile =
                    file.nama_file || file.filename || "File Nilai.xlsx";

                  return (
                    <div className="file-card" key={file.id || index}>
                      <div className="file-icon">📊</div>

                      <div className="file-info">
                        <h3>{namaFile}</h3>

                        <p>Spreadsheet nilai dari admin</p>
                      </div>

                      <div className="file-actions">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-view-btn"
                        >
                          👁️ Lihat
                        </a>

                        <a
                          href={fileUrl}
                          download={namaFile}
                          className="file-download-btn"
                        >
                          ⬇️ Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="nilai-empty">
                <div className="empty-icon">📄</div>

                <h3>Belum ada spreadsheet</h3>

                <p>Admin belum mengunggah file nilai untuk event ini.</p>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            BELUM MEMILIH EVENT
        ================================================= */}

        {!selectedEvent && (
          <div className="nilai-empty">
            <div className="empty-icon">📊</div>

            <h3>Pilih Event</h3>

            <p>
              Silakan pilih event untuk melihat nilai dan spreadsheet yang
              tersedia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
