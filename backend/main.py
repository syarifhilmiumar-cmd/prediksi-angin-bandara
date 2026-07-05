from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

koordinat_bandara = {
     "Sultan Iskandar Muda - Banda Aceh": {"lat": 5.5239, "lon": 95.4197},

    "Kualanamu - Medan": {"lat": 3.6422, "lon": 98.8853},

    "Minangkabau - Padang": {"lat": -0.7866, "lon": 100.2813},

    "Sultan Syarif Kasim II - Pekanbaru": {"lat": 0.4611, "lon": 101.4480},

    "Hang Nadim - Batam": {"lat": 1.1213, "lon": 104.1190},

    "Sultan Thaha - Jambi": {"lat": -1.6366, "lon": 103.6375},

    "Fatmawati Soekarno - Bengkulu": {"lat": -3.8631, "lon": 102.3392},

    "Sultan Mahmud Badaruddin II - Palembang": {"lat": -2.8981, "lon": 104.7001},

    "Depati Amir - Pangkal Pinang": {"lat": -2.1633, "lon": 106.1388},

    "Radin Inten II - Bandar Lampung": {"lat": -5.2423, "lon": 105.1788},

    "Soekarno-Hatta - Tangerang": {"lat": -6.1256, "lon": 106.6558},

    "Halim Perdanakusuma - Jakarta": {"lat": -6.2655, "lon": 106.8855},

    "Kertajati - Majalengka": {"lat": -6.5815, "lon": 108.1764},

    "Ahmad Yani - Semarang": {"lat": -6.9691, "lon": 110.3758},

    "Yogyakarta International - Kulon Progo": {"lat": -7.9043, "lon": 110.0556},

    "Juanda - Surabaya": {"lat": -7.3796, "lon": 112.7869},

    "Ngurah Rai - Denpasar": {"lat": -8.7481, "lon": 115.1674},

    "Lombok - Praya": {"lat": -8.7578, "lon": 116.2758},

    "El Tari - Kupang": {"lat": -10.1704, "lon": 123.6669},

    "Supadio - Pontianak": {"lat": -0.1499, "lon": 109.4044},

    "Tjilik Riwut - Palangkaraya": {"lat": -2.2248, "lon": 113.9433},

    "Syamsudin Noor - Banjarmasin": {"lat": -3.4406, "lon": 114.7621},

    "Sultan Aji Muhammad Sulaiman - Balikpapan": {"lat": -1.2683, "lon": 116.8944},

    "Juwata - Tarakan": {"lat": 3.3300, "lon": 117.5900},

    "Sam Ratulangi - Manado": {"lat": 1.5365, "lon": 124.9262},

    "Djalaluddin - Gorontalo": {"lat": 0.6365, "lon": 122.8506},

    "Mutiara SIS Al-Jufrie - Palu": {"lat": -0.9181, "lon": 119.9096},

    "Tampa Padang - Mamuju": {"lat": -2.5867, "lon": 119.0292},

    "Sultan Hasanuddin - Makassar": {"lat": -5.0616, "lon": 119.5539},

    "Haluoleo - Kendari": {"lat": -4.0814, "lon": 122.4184},

    "Pattimura - Ambon": {"lat": -3.7049, "lon": 128.0894},

    "Sultan Babullah - Ternate": {"lat": 0.8281, "lon": 127.3800},

    "Rendani - Manokwari": {"lat": -0.8917, "lon": 134.0492},

    "Domine Eduard Osok - Sorong": {"lat": -0.8878, "lon": 131.2882},

    "Sentani - Jayapura": {"lat": -2.5721, "lon": 140.5161},

    "Mozes Kilangin - Timika": {"lat": -4.5296, "lon": 136.8860},

    "Wamena - Wamena": {"lat": -4.0975, "lon": 138.9519},

    "Mopah - Merauke": {"lat": -8.5204, "lon": 140.4168},

}

class RequestBandara(BaseModel):
    kota: str

# Cache untuk menyimpan model yang sudah di-training agar tidak perlu request data historis & re-train setiap kali API dipanggil
model_cache = {}

def latih_model_bandara(lat: float, lon: float, nama_bandara: str):
    """Fungsi untuk mengambil data historis HOURLY dan melatih model"""
    url_hist = "https://archive-api.open-meteo.com/v1/archive"
    
    # Mengambil data 3 tahun terakhir agar proses training lebih cepat namun tetap representatif
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=365*3)).strftime('%Y-%m-%d')

    params_hist = {
        "latitude": lat, 
        "longitude": lon,
        "start_date": start_date, 
        "end_date": end_date,
        "hourly": "wind_speed_10m,precipitation,temperature_2m,relative_humidity_2m,surface_pressure",
        "timezone": "Asia/Jakarta"
    }
    
    res = requests.get(url_hist, params=params_hist)
    if res.status_code != 200:
        raise Exception("Gagal mengambil data historis dari Open-Meteo")
        
    data = res.json()
    df = pd.DataFrame(data["hourly"]).dropna()

    # Menggunakan fitur HOURLY untuk training
    X = df[['precipitation', 'temperature_2m', 'relative_humidity_2m', 'surface_pressure']]
    y = df['wind_speed_10m'] # Target juga harus HOURLY

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Optimasi Hyperparameter sederhana pada Random Forest dan Decision Tree
    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42),
        "SVM (SVR)": SVR(kernel='rbf', C=1.0)
    }

    metrics = []
    trained_models = {}

    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        pred = model.predict(X_test_scaled)
        rmse = np.sqrt(mean_squared_error(y_test, pred))
        mae = mean_absolute_error(y_test, pred)
        r2 = r2_score(y_test, pred)
        
        metrics.append({"Model": name, "RMSE": round(rmse, 3), "MAE": round(mae, 3), "R2": round(r2, 3)})
        trained_models[name] = model

    df_eval = pd.DataFrame(metrics)
    best_algo = df_eval.loc[df_eval['RMSE'].idxmin(), 'Model']
    best_model = trained_models[best_algo]

    # Simpan ke cache memory
    model_cache[nama_bandara] = {
        "model": best_model,
        "scaler": scaler,
        "algo": best_algo,
        "metrics": df_eval.to_dict('records')
    }

@app.post("/api/prediksi")
def proses_prediksi(req: RequestBandara):
    try:
        kota = req.kota
        if kota not in koordinat_bandara:
            raise HTTPException(status_code=404, detail="Bandara tidak ditemukan di database.")

        lat = koordinat_bandara[kota]["lat"]
        lon = koordinat_bandara[kota]["lon"]

        # 1. CEK CACHE ATAU TRAINING MODEL
        if kota not in model_cache:
            latih_model_bandara(lat, lon, kota)
            
        cached_data = model_cache[kota]
        best_model = cached_data["model"]
        scaler = cached_data["scaler"]
        best_algo = cached_data["algo"]
        metrics = cached_data["metrics"]

        # 2. FORECAST 24 JAM KE DEPAN DARI JAM SEKARANG
        tz_jakarta = timezone(timedelta(hours=7))
        now = datetime.now(tz_jakarta)
        jam_sekarang = now.hour

        url_fore = "https://api.open-meteo.com/v1/forecast"
        params_fore = {
            "latitude": lat, "longitude": lon,
            "hourly": "precipitation,temperature_2m,relative_humidity_2m,surface_pressure",
            "timezone": "Asia/Jakarta",
            "forecast_days": 3
        }
        res_fore = requests.get(url_fore, params=params_fore).json()

        # Ekstraksi data 24 jam ke depan
        index_mulai = jam_sekarang + 1
        index_selesai = index_mulai + 24

        all_precip = res_fore['hourly']['precipitation'][index_mulai:index_selesai]
        all_temp   = res_fore['hourly']['temperature_2m'][index_mulai:index_selesai]
        all_humid  = res_fore['hourly']['relative_humidity_2m'][index_mulai:index_selesai]
        all_press  = res_fore['hourly']['surface_pressure'][index_mulai:index_selesai]

        df_fore = pd.DataFrame({
            "precipitation":        all_precip,
            "temperature_2m":       all_temp,
            "relative_humidity_2m": all_humid,
            "surface_pressure":     all_press,
        })

        # Prediksi Kecepatan Angin
        X_fore_scaled = scaler.transform(df_fore)
        pred_kmh = best_model.predict(X_fore_scaled)
        
        # Konversi km/h ke knot (1 km/h = 0.539957 knot)
        pred_knot = [round(v * 0.539957, 2) for v in pred_kmh]

        # 3. FORMATTING OUTPUT TERMASUK CURAH HUJAN
        prediksi_perjam = []
        for i in range(24):
            total = jam_sekarang + 1 + i
            jam   = total % 24
            hari  = total // 24
            label = "Hari ini" if hari == 0 else "Besok" if hari == 1 else "Lusa"
            
            prediksi_perjam.append({
                "waktu": f"{str(jam).zfill(2)}:00 ({label})",
                "curah_hujan_mm": all_precip[i], # Menambahkan intensitas curah hujan di jam tersebut
                "kecepatan_angin_knot": pred_knot[i]
            })

        return {
            "status": "sukses",
            "bandara": kota,
            "algoritma_terbaik": best_algo,
            "metrik_evaluasi": metrics,
            "jam_mulai_prediksi": f"{str(jam_sekarang + 1).zfill(2)}:00 WIB",
            "prediksi_24_jam": prediksi_perjam
        }

    except Exception as e:
        return {"error": str(e)}