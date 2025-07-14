from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from io import StringIO
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import math

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_json_safe(obj):
    if isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            return None
        return obj
    elif isinstance(obj, list):
        return [clean_json_safe(v) for v in obj]
    elif isinstance(obj, dict):
        return {k: clean_json_safe(v) for k, v in obj.items()}
    return obj

@app.get("/")
def read_root():
    return {"message": "InsightPredictor API is live"}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        decoded = contents.decode("latin1")

    try:
        df = pd.read_csv(StringIO(decoded), on_bad_lines="skip")
        safe_df = df.head(5).replace([np.inf, -np.inf], np.nan).where(pd.notnull(df.head(5)), None)
        return {
            "columns": df.columns.tolist(),
            "rows": safe_df.to_dict(orient="records"),
            "shape": df.shape
        }
    except Exception as e:
        return {"error": f"Could not parse CSV: {str(e)}"}

@app.post("/predict")
async def predict_csv(
    file: UploadFile = File(...),
    target_column: str = Form(...)
):
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
        df = pd.read_csv(StringIO(decoded), on_bad_lines="skip")
    except Exception as e:
        return {"error": f"Could not read CSV: {str(e)}"}

    if target_column not in df.columns:
        return {"error": f"Target column '{target_column}' not found in CSV."}

    try:
        df = df.dropna(subset=[target_column])
        features_df = df.drop(columns=[target_column])
        y = df[target_column]
        X = features_df.select_dtypes(include=[np.number])
        if X.empty:
            return {"error": "No numeric features found for training."}

        model = LinearRegression()
        model.fit(X, y)
        predictions = model.predict(X)

        result = {
            "coefficients": dict(zip(X.columns, model.coef_.tolist())),
            "intercept": float(model.intercept_),
            "predictions": predictions[:5].tolist(),
            "actuals": y[:5].tolist(),
            "score": float(model.score(X, y)),
            "features_used": X.columns.tolist(),
            "rows_used": len(X)
        }

        return JSONResponse(content=clean_json_safe(result))

    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

@app.post("/cluster")
async def cluster_csv(
    file: UploadFile = File(...),
    n_clusters: int = Form(3)
):
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
        df = pd.read_csv(StringIO(decoded), on_bad_lines="skip")
    except Exception as e:
        return {"error": f"Could not read CSV: {str(e)}"}

    try:
        numeric_df = df.select_dtypes(include=[np.number]).dropna()
        if numeric_df.shape[0] < n_clusters:
            return {"error": f"Not enough rows to form {n_clusters} clusters."}

        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        kmeans.fit(numeric_df)
        df["cluster"] = kmeans.labels_

        result = {
            "clustered_sample": df.head(10).to_dict(orient="records"),
            "centroids": kmeans.cluster_centers_.tolist(),
            "features_used": numeric_df.columns.tolist(),
            "num_clusters": n_clusters
        }

        return JSONResponse(content=clean_json_safe(result))

    except Exception as e:
        return {"error": f"Clustering failed: {str(e)}"}

@app.post("/anomalies")
async def detect_anomalies(file: UploadFile = File(...), z_thresh: float = Form(3.0)):
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
        df = pd.read_csv(StringIO(decoded), on_bad_lines="skip")
    except Exception as e:
        return {"error": f"Could not read CSV: {str(e)}"}

    try:
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            return {"error": "No numeric columns found."}

        scaler = StandardScaler()
        scaled = scaler.fit_transform(numeric_df)
        z_scores = np.abs(scaled)
        anomaly_mask = (z_scores > z_thresh).any(axis=1)

        anomalies = df[anomaly_mask].copy()
        reasons = []

        for i, row in anomalies.iterrows():
            cols = numeric_df.columns[(z_scores[i] > z_thresh)]
            reasons.append(", ".join(cols.tolist()))

        result = {
            "anomalies": anomalies.head(10).to_dict(orient="records"),
            "reasons": reasons[:10],
            "z_threshold": z_thresh,
            "num_anomalies": int(anomaly_mask.sum())
        }

        return JSONResponse(content=clean_json_safe(result))

    except Exception as e:
        return {"error": f"Anomaly detection failed: {str(e)}"}

@app.post("/trend")
async def trend_analysis(
    file: UploadFile = File(...),
    date_column: str = Form(...),
    value_column: str = Form(...)
):
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
        df = pd.read_csv(StringIO(decoded), on_bad_lines="skip")
    except Exception as e:
        return {"error": f"Could not read CSV: {str(e)}"}

    if date_column not in df.columns or value_column not in df.columns:
        return {"error": "Date or value column not found."}

    try:
        df[date_column] = pd.to_datetime(df[date_column], errors='coerce')
        df = df.dropna(subset=[date_column, value_column])
        df["month"] = df[date_column].dt.to_period("M").astype(str)

        trend = df.groupby("month")[value_column].mean().reset_index()
        trend_data = trend.to_dict(orient="records")

        result = {
            "trend": trend_data,
            "date_column": date_column,
            "value_column": value_column,
            "points": len(trend_data)
        }

        return JSONResponse(content=clean_json_safe(result))

    except Exception as e:
        return {"error": f"Trend analysis failed: {str(e)}"}
