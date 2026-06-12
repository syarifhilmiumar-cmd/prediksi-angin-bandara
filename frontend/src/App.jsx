import { useState } from "react";
import axios from "axios";

const daftarBandara = [
  "Sultan Iskandar Muda - Banda Aceh",
  "Kualanamu - Medan",
  "Minangkabau - Padang",
  "Sultan Syarif Kasim II - Pekanbaru",
  "Hang Nadim - Batam",
  "Sultan Thaha - Jambi",
  "Fatmawati Soekarno - Bengkulu",
  "Sultan Mahmud Badaruddin II - Palembang",
  "Depati Amir - Pangkal Pinang",
  "Radin Inten II - Bandar Lampung",
  "Soekarno-Hatta - Tangerang",
  "Halim Perdanakusuma - Jakarta",
  "Kertajati - Majalengka",
  "Ahmad Yani - Semarang",
  "Yogyakarta International - Kulon Progo",
  "Juanda - Surabaya",
  "Ngurah Rai - Denpasar",
  "Lombok - Praya",
  "El Tari - Kupang",
  "Supadio - Pontianak",
  "Tjilik Riwut - Palangkaraya",
  "Syamsudin Noor - Banjarmasin",
  "Sultan Aji Muhammad Sulaiman - Balikpapan",
  "Juwata - Tarakan",
  "Sam Ratulangi - Manado",
  "Djalaluddin - Gorontalo",
  "Mutiara SIS Al-Jufrie - Palu",
  "Tampa Padang - Mamuju",
  "Sultan Hasanuddin - Makassar",
  "Haluoleo - Kendari",
  "Pattimura - Ambon",
  "Sultan Babullah - Ternate",
  "Rendani - Manokwari",
  "Domine Eduard Osok - Sorong",
  "Sentani - Jayapura",
  "Mozes Kilangin - Timika",
  "Wamena - Wamena",
  "Mopah - Merauke",
];

export default function App() {
  const [kota, setKota] = useState("");
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrediksi = async () => {
    if (!kota) { setError("Pilih bandara terlebih dahulu!"); return; }
    setLoading(true);
    setError("");
    setHasil(null);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/prediksi", { kota });
      if (res.data.error) { setError(res.data.error); }
      else { setHasil(res.data); }
    } catch {
      setError("Gagal terhubung ke server. Pastikan backend berjalan.");
    }
    setLoading(false);
  };

  const getWarnaBadge = (knot) => {
    if (knot < 7) return { bg: "#064e3b", color: "#6ee7b7", label: "Tenang" };
    if (knot < 15) return { bg: "#1e3a5f", color: "#93c5fd", label: "Sedang" };
    if (knot < 25) return { bg: "#713f12", color: "#fcd34d", label: "Kencang" };
    return { bg: "#450a0a", color: "#fca5a5", label: "Berbahaya" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "sans-serif", padding: "2rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#38bdf8", fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          ✈️ Prediksi Kecepatan Angin Bandara
        </h1>
        <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: "2rem" }}>
          38 Bandara Provinsi di Indonesia — Per Jam (00:00–23:00)
        </p>

        <div style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8" }}>Pilih Bandara:</label>
          <select
            value={kota}
            onChange={(e) => setKota(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: "1rem", marginBottom: "1rem" }}
          >
            <option value="">-- Pilih Bandara --</option>
            {daftarBandara.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button
            onClick={handlePrediksi}
            disabled={loading}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: loading ? "#334155" : "#0284c7", color: "white", border: "none", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}
          >
            {loading ? "⏳ Memproses... (30-60 detik)" : "🔍 Prediksi Sekarang"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "#fca5a5" }}>
            ❌ {error}
          </div>
        )}

        {hasil && (
          <div>
            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "1rem 1.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94a3b8" }}>Algoritma Terbaik:</span>
              <strong style={{ color: "#a78bfa", fontSize: "1.1rem" }}>{hasil.algoritma_terbaik}</strong>
            </div>

            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
              <h3 style={{ color: "#38bdf8", marginTop: 0, marginBottom: "1rem" }}>🕐 Prediksi Per Jam — Besok</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {hasil.prediksi_perjam.map((item) => {
                  const warna = getWarnaBadge(item.knot);
                  return (
                    <div key={item.jam} style={{ background: warna.bg, border: `1px solid ${warna.color}33`, borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.25rem" }}>{item.jam}</div>
                      <div style={{ color: warna.color, fontWeight: "bold", fontSize: "1.1rem" }}>{item.knot}</div>
                      <div style={{ color: warna.color, fontSize: "0.7rem" }}>knot · {warna.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ color: "#94a3b8", marginTop: 0 }}>📊 Perbandingan Model</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    {["Model", "RMSE", "MAE", "R²"].map(h => (
                      <th key={h} style={{ padding: "0.75rem", textAlign: "left", color: "#94a3b8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hasil.metrik.map((m) => (
                    <tr key={m.Model} style={{ borderBottom: "1px solid #0f172a", background: m.Model === hasil.algoritma_terbaik ? "#0c2a3e" : "transparent" }}>
                      <td style={{ padding: "0.75rem", color: m.Model === hasil.algoritma_terbaik ? "#38bdf8" : "#e2e8f0" }}>{m.Model === hasil.algoritma_terbaik ? "⭐ " : ""}{m.Model}</td>
                      <td style={{ padding: "0.75rem" }}>{m.RMSE.toFixed(4)}</td>
                      <td style={{ padding: "0.75rem" }}>{m.MAE.toFixed(4)}</td>
                      <td style={{ padding: "0.75rem" }}>{m.R2.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}