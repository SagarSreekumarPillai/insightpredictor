from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import math
from io import StringIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import tempfile
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
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

def parse_csv(contents: bytes) -> pd.DataFrame:
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        decoded = contents.decode("latin1")

    df = pd.read_csv(StringIO(decoded), engine="python", on_bad_lines="skip", sep=None)
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(how="all", inplace=True)
    return df

@app.get("/")
def root():
    return {"message": "InsightPredictor API is live"}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = parse_csv(contents)
        safe_df = df.head(5).where(pd.notnull(df.head(5)), None)
        return {
            "columns": df.columns.tolist(),
            "rows": safe_df.to_dict(orient="records"),
            "shape": df.shape
        }
    except Exception as e:
        return {"error": f"Could not parse CSV: {str(e)}"}

@app.post("/predict")
async def predict(file: UploadFile = File(...), target_column: str = Form(...)):
    contents = await file.read()
    try:
        df = parse_csv(contents)
        if target_column not in df.columns:
            return {"error": f"Target column '{target_column}' not found."}

        df = df.dropna(subset=[target_column])
        y = df[target_column]
        X = df.drop(columns=[target_column]).select_dtypes(include=[np.number]).dropna()

        if X.shape[0] < 2 or X.shape[1] < 1:
            return {"error": "Not enough numeric data for prediction."}

        model = LinearRegression()
        model.fit(X, y)
        predictions = model.predict(X)

        return JSONResponse(content=clean_json_safe({
            "coefficients": dict(zip(X.columns, model.coef_)),
            "intercept": model.intercept_,
            "predictions": predictions[:5].tolist(),
            "actuals": y[:5].tolist(),
            "score": model.score(X, y),
            "features_used": X.columns.tolist(),
            "rows_used": len(X)
        }))
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

@app.post("/cluster")
async def cluster(file: UploadFile = File(...), n_clusters: int = Form(3)):
    contents = await file.read()
    try:
        df = parse_csv(contents)
        numeric_df = df.select_dtypes(include=[np.number]).dropna()

        if numeric_df.shape[0] < n_clusters:
            return {"error": f"Not enough rows to form {n_clusters} clusters."}

        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        kmeans.fit(numeric_df)
        df["cluster"] = kmeans.labels_

        return JSONResponse(content=clean_json_safe({
            "clustered_sample": df.head(10).to_dict(orient="records"),
            "centroids": kmeans.cluster_centers_.tolist(),
            "features_used": numeric_df.columns.tolist(),
            "num_clusters": n_clusters
        }))
    except Exception as e:
        return {"error": f"Clustering failed: {str(e)}"}

@app.post("/anomalies")
async def anomalies(file: UploadFile = File(...), z_thresh: float = Form(3.0)):
    contents = await file.read()
    try:
        df = parse_csv(contents)
        numeric_df = df.select_dtypes(include=[np.number]).dropna()

        if numeric_df.empty:
            return {"error": "No numeric columns for anomaly detection."}

        scaler = StandardScaler()
        scaled = scaler.fit_transform(numeric_df)
        z_scores = np.abs(scaled)
        anomaly_mask = (z_scores > z_thresh).any(axis=1)

        anomalies_df = df[anomaly_mask].copy()
        reasons = []
        for i, row in anomalies_df.iterrows():
            cols = numeric_df.columns[(z_scores[i] > z_thresh)]
            reasons.append(", ".join(cols.tolist()))

        return JSONResponse(content=clean_json_safe({
            "anomalies": anomalies_df.head(10).to_dict(orient="records"),
            "reasons": reasons[:10],
            "z_threshold": z_thresh,
            "num_anomalies": int(anomaly_mask.sum())
        }))
    except Exception as e:
        return {"error": f"Anomaly detection failed: {str(e)}"}

@app.post("/trend")
async def trend(file: UploadFile = File(...), date_column: str = Form(...), value_column: str = Form(...)):
    contents = await file.read()
    try:
        df = parse_csv(contents)
        if date_column not in df.columns or value_column not in df.columns:
            return {"error": "Date or value column not found."}

        df[date_column] = pd.to_datetime(df[date_column], errors='coerce')
        df = df.dropna(subset=[date_column, value_column])
        df["month"] = df[date_column].dt.to_period("M").astype(str)

        trend = df.groupby("month")[value_column].mean().reset_index()
        return JSONResponse(content=clean_json_safe({
            "trend": trend.to_dict(orient="records"),
            "date_column": date_column,
            "value_column": value_column,
            "points": len(trend)
        }))
    except Exception as e:
        return {"error": f"Trend analysis failed: {str(e)}"}

@app.post("/export")
async def export_pdf(
    file: UploadFile = File(...),
    target_column: str = Form(""),
    trend_column: str = Form(""),
    trend_direction: str = Form(""),
    summary: str = Form("")
):
    try:
        summary_data = json.loads(summary)
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        c = canvas.Canvas(tmp.name, pagesize=A4)
        width, height = A4
        line_height = 20
        y = height - 40

        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, y, "📊 InsightPredictor Analysis Report")
        y -= 40

        c.setFont("Helvetica", 12)
        if target_column:
            c.drawString(50, y, f"🎯 Prediction Target: {target_column}")
            y -= line_height
        if trend_column:
            c.drawString(50, y, f"📈 Trend Column: {trend_column} → {trend_direction}")
            y -= line_height

        pred = summary_data.get("prediction", {})
        if pred:
            c.drawString(50, y, f"✅ R² Score: {round(pred.get('score', 0), 3)}")
            y -= line_height
            c.drawString(50, y, "📉 Coefficients:")
            y -= line_height
            for k, v in pred.get("coefficients", {}).items():
                c.drawString(70, y, f"{k}: {round(v, 3)}")
                y -= line_height

        anomalies = summary_data.get("anomalies", [])
        if anomalies:
            y -= line_height
            c.drawString(50, y, "🚨 Anomalies Detected:")
            y -= line_height
            for row in anomalies[:5]:
                c.drawString(70, y, str(row))
                y -= line_height
                if y < 100:
                    c.showPage()
                    y = height - 40

        clusters = summary_data.get("clusters", [])
        if clusters:
            y -= line_height
            c.drawString(50, y, "🧬 Clustering Sample:")
            y -= line_height
            for row in clusters[:5]:
                c.drawString(70, y, str(row))
                y -= line_height
                if y < 100:
                    c.showPage()
                    y = height - 40

        c.save()
        return FileResponse(tmp.name, filename="insight_report.pdf", media_type="application/pdf")

    except Exception as e:
        return {"error": f"PDF export failed: {str(e)}"}
