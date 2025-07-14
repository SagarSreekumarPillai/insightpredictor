"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [shape, setShape] = useState<number[] | null>(null);
  const [target, setTarget] = useState<string>("");
  const [dateColumn, setDateColumn] = useState<string>("");
  const [valueColumn, setValueColumn] = useState<string>("");
  const [results, setResults] = useState<any | null>(null);
  const [numClusters, setNumClusters] = useState(3);
  const [clusters, setClusters] = useState<any[] | null>(null);
  const [zThreshold, setZThreshold] = useState(3.0);
  const [anomalies, setAnomalies] = useState<any[] | null>(null);
  const [trendData, setTrendData] = useState<any[] | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("http://localhost:8000/upload", formData);
    if (res.data.columns) {
      setColumns(res.data.columns);
      setShape(res.data.shape);
    }
  };

  const handlePredict = async () => {
    if (!file || !target) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", target);

    const res = await axios.post("http://localhost:8000/predict", formData);
    setResults(res.data);
  };

  const handleCluster = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("n_clusters", numClusters.toString());

    const res = await axios.post("http://localhost:8000/cluster", formData);
    setClusters(res.data.clustered_sample);
  };

  const handleAnomalyDetection = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("z_thresh", zThreshold.toString());

    const res = await axios.post("http://localhost:8000/anomalies", formData);
    setAnomalies(res.data.anomalies || []);
  };

  const handleTrendDetection = async () => {
    if (!file || !dateColumn || !valueColumn) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("date_column", dateColumn);
    formData.append("value_column", valueColumn);

    const res = await axios.post("http://localhost:8000/trend", formData);
    setTrendData(res.data.trend || []);
  };

  const getTrendDirection = () => {
    if (!trendData || trendData.length < 2) return "⏸ Flat";
    const first = trendData[0][valueColumn];
    const last = trendData[trendData.length - 1][valueColumn];
    return last > first ? "📈 Increasing" : last < first ? "📉 Decreasing" : "⏸ Flat";
  };

  return (
    <div className="space-y-6">
      <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Button onClick={handleUpload}>Upload CSV</Button>

      {columns.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground">
            🔢 Shape: {shape?.[0]} rows × {shape?.[1]} columns
          </div>
          <div className="text-sm font-medium">🧩 Columns: {columns.join(", ")}</div>

          <Label className="mt-4 block">🎯 Target Column (for prediction)</Label>
          <select
            className="border p-2 rounded w-full"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">-- Select --</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          <div className="mt-4 space-y-2">
            <Label>🧬 Number of Clusters</Label>
            <Input
              type="number"
              min={2}
              max={10}
              value={numClusters}
              onChange={(e) => setNumClusters(parseInt(e.target.value))}
            />
            <Button onClick={handleCluster}>Run Clustering</Button>
          </div>

          <div className="mt-4 space-y-2">
            <Label>🚨 Anomaly Z-Threshold</Label>
            <Input
              type="number"
              step={0.1}
              min={0.5}
              value={zThreshold}
              onChange={(e) => setZThreshold(parseFloat(e.target.value))}
            />
            <Button onClick={handleAnomalyDetection}>Detect Anomalies</Button>
          </div>

          <div className="mt-4 space-y-2">
            <Label>📅 Date Column (for trend)</Label>
            <select
              className="border p-2 rounded w-full"
              value={dateColumn}
              onChange={(e) => setDateColumn(e.target.value)}
            >
              <option value="">-- Select --</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>

            <Label className="mt-2">📊 Value Column (for trend)</Label>
            <select
              className="border p-2 rounded w-full"
              value={valueColumn}
              onChange={(e) => setValueColumn(e.target.value)}
            >
              <option value="">-- Select --</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>

            <Button onClick={handleTrendDetection}>Detect Trend</Button>
          </div>

          <Button onClick={handlePredict} className="mt-2">Predict</Button>
        </>
      )}

      {results && (
        <Card className="mt-6">
          <CardContent className="space-y-2 p-4">
            <div>✅ R² Score: <b>{results.score?.toFixed(3)}</b></div>
            <div>📈 Coefficients:</div>
            <ul className="list-disc list-inside text-sm">
              {Object.entries(results.coefficients || {}).map(([k, v]) => (
                <li key={k}>{k}: {Number(v).toFixed(3)}</li>
              ))}
            </ul>
            <div>🔮 Predictions (sample): {results.predictions?.map((p: number) => p.toFixed(2)).join(", ")}</div>

            {results.actuals && results.predictions && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">📉 Predictions vs Actual</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results.predictions.map((pred: number, idx: number) => ({
                    index: idx + 1,
                    Prediction: pred,
                    Actual: results.actuals[idx]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Actual" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="Prediction" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {clusters && (
        <Card className="mt-6">
          <CardContent className="space-y-2 p-4">
            <div className="font-medium">🧬 Clustered Sample:</div>
            <table className="text-sm w-full">
              <thead>
                <tr>
                  {Object.keys(clusters[0]).map((key) => (
                    <th key={key} className="text-left pr-4">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clusters.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="pr-4">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {anomalies && anomalies.length > 0 && (
        <Card className="mt-6">
          <CardContent className="space-y-2 p-4">
            <div className="font-medium text-red-600">🚨 Detected Anomalies:</div>
            <table className="text-sm w-full">
              <thead>
                <tr>
                  {Object.keys(anomalies[0]).map((key) => (
                    <th key={key} className="text-left pr-4">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalies.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="pr-4">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {trendData && trendData.length > 0 && (
        <Card className="mt-6">
          <CardContent className="space-y-4 p-4">
            <div className="text-lg font-medium">📊 Monthly Trend: {getTrendDirection()}</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={valueColumn} stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
