"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ArrowDownCircle, Moon, Sun, FileDown } from "lucide-react";
import { motion } from "framer-motion";

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
  const [darkMode, setDarkMode] = useState(true);

  const resultRef = useRef<HTMLDivElement>(null);
  const scrollToResults = () => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const themeClasses = darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900";
  const cardClasses = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const selectClasses = darkMode ? "bg-gray-800 text-white" : "bg-white text-black";
  const headingClasses = darkMode ? "text-lg font-semibold text-white" : "text-lg font-semibold text-black";
  const buttonClasses = darkMode ? "bg-orange-600 text-white hover:bg-orange-500" : "bg-orange-500 text-white hover:bg-orange-400";

  const toggleTheme = () => setDarkMode((prev) => !prev);

  const handleUpload = async () => {
    if (!file) return toast.error("Please upload a file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/upload", formData);
      if (res.data.columns) {
        setColumns(res.data.columns);
        setShape(res.data.shape);
        toast.success("CSV uploaded successfully!");
      }
    } catch {
      toast.error("Failed to upload CSV");
    }
  };

  const handlePredict = async () => {
    if (!file || !target) return toast.error("Please select a target column");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", target);
    try {
      const res = await axios.post("http://localhost:8000/predict", formData);
      setResults(res.data);
      toast.success("Prediction complete!");
    } catch {
      toast.error("Prediction failed");
    }
  };

  const handleTrendDetection = async () => {
    if (!file || !dateColumn || !valueColumn) return toast.error("Select date/value columns");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("date_column", dateColumn);
    formData.append("value_column", valueColumn);
    try {
      const res = await axios.post("http://localhost:8000/trend", formData);
      setTrendData(res.data.trend);
      toast.success("Trend analysis complete");
    } catch {
      toast.error("Trend analysis failed");
    }
  };

  const handleAnomalyDetection = async () => {
    if (!file) return toast.error("Upload a CSV first");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("z_thresh", zThreshold.toString());
    try {
      const res = await axios.post("http://localhost:8000/anomalies", formData);
      setAnomalies(res.data.anomalies);
      toast.success("Anomaly detection complete");
    } catch {
      toast.error("Anomaly detection failed");
    }
  };

  const handleCluster = async () => {
    if (!file) return toast.error("Upload a CSV first");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("n_clusters", numClusters.toString());
    try {
      const res = await axios.post("http://localhost:8000/cluster", formData);
      setClusters(res.data.clustered_sample);
      toast.success("Clustering complete");
    } catch {
      toast.error("Clustering failed");
    }
  };

  const handleExport = async () => {
    if (!file) return toast.error("Upload a CSV first");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", target);
    formData.append("trend_column", valueColumn);
    formData.append("trend_direction", (trendData?.[0]?.[valueColumn] < trendData?.at(-1)?.[valueColumn] ? "Increasing" : "Decreasing"));
    formData.append("summary", JSON.stringify({ prediction: results, anomalies, clusters }));
    try {
      const res = await axios.post("http://localhost:8000/export", formData, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "insight_report.pdf");
      document.body.appendChild(link);
      link.click();
      toast.success("PDF exported");
    } catch {
      toast.error("PDF export failed");
    }
  };

  return (
    <div className={`min-h-screen px-6 py-10 space-y-10 transition-colors duration-300 ${themeClasses}`}>
      <Toaster />
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button onClick={toggleTheme} className={`p-2 rounded-full shadow-md ${buttonClasses}`}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className={`p-3 rounded-full shadow-lg ${buttonClasses}`} onClick={scrollToResults}>
          <ArrowDownCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={handleUpload} className={buttonClasses}>Upload CSV</Button>
        {columns.length > 0 && (
          <>
            <div className="text-sm">🔢 Shape: {shape?.[0]} rows × {shape?.[1]} columns</div>
            <Label className="block">🎯 Target Column</Label>
            <select className={`p-2 rounded w-full ${selectClasses}`} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
            <Button onClick={handlePredict} className={buttonClasses}>Predict</Button>

            <Label className="block mt-4">📅 Date Column</Label>
            <select className={`p-2 rounded w-full ${selectClasses}`} value={dateColumn} onChange={(e) => setDateColumn(e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
            <Label className="block mt-2">📊 Value Column</Label>
            <select className={`p-2 rounded w-full ${selectClasses}`} value={valueColumn} onChange={(e) => setValueColumn(e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
            <Button onClick={handleTrendDetection} className={buttonClasses}>Detect Trend</Button>

            <Label className="block mt-4">🚨 Anomaly Z-Threshold</Label>
            <Input type="number" step={0.1} value={zThreshold} onChange={(e) => setZThreshold(parseFloat(e.target.value))} />
            <Button onClick={handleAnomalyDetection} className={buttonClasses}>Detect Anomalies</Button>

            <Label className="block mt-4">🧬 Number of Clusters</Label>
            <Input type="number" value={numClusters} onChange={(e) => setNumClusters(parseInt(e.target.value))} />
            <Button onClick={handleCluster} className={buttonClasses}>Run Clustering</Button>

            <Button onClick={handleExport} className={buttonClasses}>📄 Export as PDF</Button>
          </>
        )}
      </div>

      <div ref={resultRef} className="space-y-10">
        {trendData && trendData.length > 0 && (
          <Card className={cardClasses}>
            <CardContent className="p-4">
              <h2 className={headingClasses}>📊 Trend Analysis</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey={valueColumn} stroke="#f97316" fillOpacity={1} fill="url(#trendGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {results && results.predictions && results.actuals && (
          <Card className={cardClasses}>
            <CardContent className="p-4">
              <h2 className={headingClasses}>📈 Prediction vs Actual</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={results.predictions.map((p: number, i: number) => ({ index: i + 1, Prediction: p, Actual: results.actuals[i] }))}>
                  <XAxis dataKey="index" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Prediction" stroke="#34d399" strokeWidth={2} />
                  <Line type="monotone" dataKey="Actual" stroke="#60a5fa" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {anomalies && anomalies.length > 0 && (
          <Card className={cardClasses}>
            <CardContent className="p-4">
              <h2 className={headingClasses}>🚨 Anomalies</h2>
              <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-60">
                {JSON.stringify(anomalies, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {clusters && (
          <Card className={cardClasses}>
            <CardContent className="p-4">
              <h2 className={headingClasses}>🧬 Clustering</h2>
              <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-60">
                {JSON.stringify(clusters, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
