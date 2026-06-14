import { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const daftarBandara = [
  { nama: "Sultan Iskandar Muda - Banda Aceh", lat: 5.5239, lon: 95.4197 },
  { nama: "Kualanamu - Medan", lat: 3.6422, lon: 98.8853 },
  { nama: "Minangkabau - Padang", lat: -0.7866, lon: 100.2813 },
  { nama: "Sultan Syarif Kasim II - Pekanbaru", lat: 0.4611, lon: 101.4480 },
  { nama: "Hang Nadim - Batam", lat: 1.1213, lon: 104.1190 },
  { nama: "Sultan Thaha - Jambi", lat: -1.6366, lon: 103.6375 },
  { nama: "Fatmawati Soekarno - Bengkulu", lat: -3.8631, lon: 102.3392 },
  { nama: "Sultan Mahmud Badaruddin II - Palembang", lat: -2.8981, lon: 104.7001 },
  { nama: "Depati Amir - Pangkal Pinang", lat: -2.1633, lon: 106.1388 },
  { nama: "Radin Inten II - Bandar Lampung", lat: -5.2423, lon: 105.1788 },
  { nama: "Soekarno-Hatta - Tangerang", lat: -6.1256, lon: 106.6558 },
  { nama: "Halim Perdanakusuma - Jakarta", lat: -6.2655, lon: 106.8855 },
  { nama: "Kertajati - Majalengka", lat: -6.5815, lon: 108.1764 },
  { nama: "Ahmad Yani - Semarang", lat: -6.9691, lon: 110.3758 },
  { nama: "Yogyakarta International - Kulon Progo", lat: -7.9043, lon: 110.0556 },
  { nama: "Juanda - Surabaya", lat: -7.3796, lon: 112.7869 },
  { nama: "Ngurah Rai - Denpasar", lat: -8.7481, lon: 115.1674 },
  { nama: "Lombok - Praya", lat: -8.7578, lon: 116.2758 },
  { nama: "El Tari - Kupang", lat: -10.1704, lon: 123.6669 },
  { nama: "Supadio - Pontianak", lat: -0.1499, lon: 109.4044 },
  { nama: "Tjilik Riwut - Palangkaraya", lat: -2.2248, lon: 113.9433 },
  { nama: "Syamsudin Noor - Banjarmasin", lat: -3.4406, lon: 114.7621 },
  { nama: "Sultan Aji Muhammad Sulaiman - Balikpapan", lat: -1.2683, lon: 116.8944 },
  { nama: "Juwata - Tarakan", lat: 3.3300, lon: 117.5900 },
  { nama: "Sam Ratulangi - Manado", lat: 1.5365, lon: 124.9262 },
  { nama: "Djalaluddin - Gorontalo", lat: 0.6365, lon: 122.8506 },
  { nama: "Mutiara SIS Al-Jufrie - Palu", lat: -0.9181, lon: 119.9096 },
  { nama: "Tampa Padang - Mamuju", lat: -2.5867, lon: 119.0292 },
  { nama: "Sultan Hasanuddin - Makassar", lat: -5.0616, lon: 119.5539 },
  { nama: "Haluoleo - Kendari", lat: -4.0814, lon: 122.4184 },
  { nama: "Pattimura - Ambon", lat: -3.7049, lon: 128.0894 },
  { nama: "Sultan Babullah - Ternate", lat: 0.8281, lon: 127.3800 },
  { nama: "Rendani - Manokwari", lat: -0.8917, lon: 134.0492 },
  { nama: "Domine Eduard Osok - Sorong", lat: -0.8878, lon: 131.2882 },
  { nama: "Sentani - Jayapura", lat: -2.5721, lon: 140.5161 },
  { nama: "Mozes Kilangin - Timika", lat: -4.5296, lon: 136.8860 },
  { nama: "Wamena - Wamena", lat: -4.0975, lon: 138.9519 },
  { nama: "Mopah - Merauke", lat: -8.5204, lon: 140.4168 },
];

function FlyToLocation({ lat, lon }) {
  const map = useMap();
  map.flyTo([lat, lon], 13, { duration: 1.5 });
  return null;
}

function getKategori(knot) {
  if (knot < 7) return { label: "AMAN", color: "#10b981", bg: "#064e3b", icon: "✅", tips: "Kondisi angin sangat baik. Penerbangan aman dan nyaman." };
  if (knot < 15) return { label: "NORMAL", color: "#3b82f6", bg: "#1e3a5f", icon: "🔵", tips: "Angin sedang. Penerbangan berlangsung normal, mungkin sedikit turbulensi ringan." };
  if (knot < 25) return { label: "WASPADA", color: "#f59e0b", bg: "#713f12", icon: "⚠️", tips: "Angin cukup kencang. Pilot waspada, kemungkinan turbulensi sedang." };
  if (knot < 35) return { label: "BERBAHAYA", color: "#ef4444", bg: "#450a0a", icon: "🔴", tips: "Angin kencang. Penerbangan berisiko, kemungkinan delay atau pembatalan." };
  return { label: "EKSTREM", color: "#7c3aed", bg: "#2e1065", icon: "🚨", tips: "Angin ekstrem! Penerbangan sangat berbahaya. Kemungkinan besar ditunda/dibatalkan." };
}

function getKategoriHarian(prediksiPerjam) {
  const avg = prediksiPerjam.reduce((a, b) => a + b.knot, 0) / prediksiPerjam.length;
  const max = Math.max(...prediksiPerjam.map(p => p.knot));
  return { avg: avg.toFixed(2), max: max.toFixed(2), kategori: getKategori(max) };
}

export default function App() {
  const [kota, setKota] = useState("");
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapPos, setMapPos] = useState(null);

  const handlePrediksi = async () => {
    if (!kota) { setError("Pilih bandara terlebih dahulu!"); return; }
    setLoading(true);
    setError("");
    setHasil(null);
    try {
      const res = await axios.post("https://prediksi-angin-bandara-production.up.railway.app/api/prediksi", { kota });
      if (res.data.error) { setError(res.data.error); }
      else {
        setHasil(res.data);
        const bandara = daftarBandara.find(b => b.nama === kota);
        if (bandara) setMapPos({ lat: bandara.lat, lon: bandara.lon, nama: bandara.nama });
      }
    } catch {
      setError("Gagal terhubung ke server. Pastikan backend berjalan.");
    }
    setLoading(false);
  };

  const ringkasan = hasil ? getKategoriHarian(hasil.prediksi_perjam) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #0c1a3a, #1a3a6e)", padding: "1.5rem 2rem", borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <img src="/bmkg.png" alt="Logo BMKG" style={{ height: "70px", objectFit: "contain" }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Sistem Prediksi Angin Bandara Terpadu
            </div>
            <h1 style={{ color: "#38bdf8", fontSize: "2.8rem", margin: "0", fontWeight: "900", letterSpacing: "2px", textShadow: "0 0 30px #38bdf855" }}>
              SIPANDU
            </h1>
            <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            
            </div>
          </div>
          <img src="/stmkg.png" alt="Logo STMKG" style={{ height: "70px", objectFit: "contain" }} />
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>

        {/* FORM */}
        <div style={{ background: "#0f1f3d", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #1e3a5f" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontWeight: "600" }}>Pilih Bandara:</label>
          <select
            value={kota}
            onChange={(e) => setKota(e.target.value)}
            style={{ width: "100%", padding: "0.85rem", borderRadius: "10px", background: "#0a0f1e", color: "#e2e8f0", border: "1px solid #1e3a5f", fontSize: "1rem", marginBottom: "1rem" }}
          >
            <option value="">-- Pilih Bandara --</option>
            {daftarBandara.map((b) => (
              <option key={b.nama} value={b.nama}>{b.nama}</option>
            ))}
          </select>
          <button
            onClick={handlePrediksi}
            disabled={loading}
            style={{ width: "100%", padding: "0.9rem", borderRadius: "10px", background: loading ? "#334155" : "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "white", border: "none", fontSize: "1.1rem", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}
          >
            {loading ? "⏳ Memproses Data... (30-60 detik)" : "🔍 Prediksi Sekarang"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", color: "#fca5a5" }}>
            ❌ {error}
          </div>
        )}

        {/* PETA */}
        <div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "1.5rem", border: "1px solid #1e3a5f", height: "380px" }}>
          <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapPos && (
              <>
                <FlyToLocation lat={mapPos.lat} lon={mapPos.lon} />
                <Marker position={[mapPos.lat, mapPos.lon]}>
                  <Popup><strong>{mapPos.nama}</strong></Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>

        {hasil && ringkasan && (
          <div>
            {/* RINGKASAN */}
            <div style={{ background: ringkasan.kategori.bg, border: `2px solid ${ringkasan.kategori.color}`, borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem" }}>{ringkasan.kategori.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: ringkasan.kategori.color }}>{ringkasan.kategori.label}</div>
              <div style={{ color: "#e2e8f0", margin: "0.5rem 0" }}>{ringkasan.kategori.tips}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem" }}>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Rata-rata</div>
                  <div style={{ color: ringkasan.kategori.color, fontWeight: "bold", fontSize: "1.5rem" }}>{ringkasan.avg} knot</div>
                </div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Maksimum</div>
                  <div style={{ color: ringkasan.kategori.color, fontWeight: "bold", fontSize: "1.5rem" }}>{ringkasan.max} knot</div>
                </div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Algoritma</div>
                  <div style={{ color: "#a78bfa", fontWeight: "bold", fontSize: "1rem", marginTop: "0.3rem" }}>{hasil.algoritma_terbaik}</div>
                </div>
              </div>
            </div>

            {/* GRID PER JAM */}
            <div style={{ background: "#0f1f3d", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #1e3a5f" }}>
              <h3 style={{ color: "#38bdf8", marginTop: 0 }}>🕐 Prediksi Per Jam — Besok</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {hasil.prediksi_perjam.map((item) => {
                  const kat = getKategori(item.knot);
                  return (
                    <div key={item.jam} style={{ background: kat.bg, border: `1px solid ${kat.color}44`, borderRadius: "10px", padding: "0.6rem", textAlign: "center" }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{item.jam}</div>
                      <div style={{ color: kat.color, fontWeight: "bold", fontSize: "1.2rem" }}>{item.knot}</div>
                      <div style={{ color: kat.color, fontSize: "0.65rem" }}>{kat.icon} {kat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LEGENDA */}
            <div style={{ background: "#0f1f3d", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #1e3a5f" }}>
              <h3 style={{ color: "#94a3b8", marginTop: 0 }}>📖 Panduan Kategori Angin</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                {[
                  { range: "< 7 knot", ...getKategori(3) },
                  { range: "7–14 knot", ...getKategori(10) },
                  { range: "15–24 knot", ...getKategori(20) },
                  { range: "25–34 knot", ...getKategori(30) },
                  { range: "≥ 35 knot", ...getKategori(40) },
                ].map((k) => (
                  <div key={k.label} style={{ background: k.bg, borderRadius: "8px", padding: "0.75rem", border: `1px solid ${k.color}44` }}>
                    <div style={{ color: k.color, fontWeight: "bold" }}>{k.icon} {k.label} <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>({k.range})</span></div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem" }}>{k.tips}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* TABEL METRIK */}
            <div style={{ background: "#0f1f3d", borderRadius: "16px", padding: "1.5rem", border: "1px solid #1e3a5f" }}>
              <h3 style={{ color: "#94a3b8", marginTop: 0 }}>📊 Perbandingan Model Machine Learning</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                    {["Model", "RMSE", "MAE", "R²"].map(h => (
                      <th key={h} style={{ padding: "0.75rem", textAlign: "left", color: "#64748b" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hasil.metrik.map((m) => (
                    <tr key={m.Model} style={{ borderBottom: "1px solid #0a0f1e", background: m.Model === hasil.algoritma_terbaik ? "#0c2a3e" : "transparent" }}>
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

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid #1e3a5f", color: "#334155", marginTop: "2rem", fontSize: "0.85rem" }}>
        © 2026 SIPANDU · STMKG · Didukung oleh Data BMKG & Open-Meteo
      </div>
    </div>
  );
}