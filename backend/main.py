from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO
import numpy as np
from sklearn.linear_model import LinearRegression

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "InsightPredictor API is live"}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()

    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded = contents.decode("latin1")  # fallback
        except Exception as e:
            return {"error": f"Could not decode file: {str(e)}"}

    try:
        df = pd.read_csv(StringIO(decoded), on_bad_lines='skip')
        return {
            "columns": df.columns.tolist(),
            "rows": df.head(5).to_dict(orient="records"),
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
        # Drop rows with nulls in target or features
        df = df.dropna(subset=[target_column])
        features_df = df.drop(columns=[target_column])
        y = df[target_column]

        # Use only numeric columns for prediction
        X = features_df.select_dtypes(include=[np.number])

        if X.empty:
            return {"error": "No numeric features found for training."}

        model = LinearRegression()
        model.fit(X, y)

        predictions = model.predict(X)

        return {
            "coefficients": dict(zip(X.columns, model.coef_.tolist())),
            "intercept": float(model.intercept_),
            "predictions": predictions[:5].tolist(),  # return first 5 preds
            "score": float(model.score(X, y)),
            "features_used": X.columns.tolist(),
            "rows_used": len(X)
        }

    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}
