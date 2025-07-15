"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import toast from "react-hot-toast";

interface ColumnSelectorProps {
  columns: string[];
  shape: number[] | null;
  target: string;
  setTarget: (v: string) => void;
  dateColumn: string;
  setDateColumn: (v: string) => void;
  valueColumn: string;
  setValueColumn: (v: string) => void;
  numClusters: number;
  setNumClusters: (v: number) => void;
  zThreshold: number;
  setZThreshold: (v: number) => void;
  file: File | null;
  setResults: (val: any) => void;
  setClusters: (val: any[]) => void;
  setAnomalies: (val: any[]) => void;
  setTrendData: (val: any[]) => void;
  buttonClasses: string;
}

export const ColumnSelector = ({
  columns,
  shape,
  target,
  setTarget,
  dateColumn,
  setDateColumn,
  valueColumn,
  setValueColumn,
  numClusters,
  setNumClusters,
  zThreshold,
  setZThreshold,
  file,
  setResults,
  setClusters,
  setAnomalies,
  setTrendData,
  buttonClasses,
}: ColumnSelectorProps) => {
  const formBase = () => {
    const formData = new FormData();
    if (file) formData.append("file", file);
    return formData;
  };

  const handlePredict = async () => {
    if (!file || !target) return toast.error("Please select a target column");
    const formData = formBase();
    formData.append("target_column", target);
    try {
      const res = await axios.post("http://localhost:8000/predict", formData);
      setResults(res.data);
      toast.success("Prediction complete!");
    } catch {
      toast.error("Prediction failed");
    }
  };

  const handleTrend = async () => {
    if (!file || !dateColumn || !valueColumn) return toast.error("Select date/value columns");
    const formData = formBase();
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

  const handleAnomalies = async () => {
    if (!file) return toast.error("Upload a CSV first");
    const formData = formBase();
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
    const formData = formBase();
    formData.append("n_clusters", numClusters.toString());
    try {
      const res = await axios.post("http://localhost:8000/cluster", formData);
      setClusters(res.data.clustered_sample);
      toast.success("Clustering complete");
    } catch {
      toast.error("Clustering failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm">🔢 Shape: {shape?.[0]} rows × {shape?.[1]} columns</div>

      <div className="space-y-2">
        <Label>🎯 Target Column</Label>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="p-2 rounded w-full bg-white text-black">
          <option value="">-- Select --</option>
          {columns.map((col) => <option key={col} value={col}>{col}</option>)}
        </select>
        <Button onClick={handlePredict} className={buttonClasses}>Predict</Button>
      </div>

      <div className="space-y-2">
        <Label>📅 Date Column</Label>
        <select value={dateColumn} onChange={(e) => setDateColumn(e.target.value)} className="p-2 rounded w-full bg-white text-black">
          <option value="">-- Select --</option>
          {columns.map((col) => <option key={col} value={col}>{col}</option>)}
        </select>

        <Label>📊 Value Column</Label>
        <select value={valueColumn} onChange={(e) => setValueColumn(e.target.value)} className="p-2 rounded w-full bg-white text-black">
          <option value="">-- Select --</option>
          {columns.map((col) => <option key={col} value={col}>{col}</option>)}
        </select>

        <Button onClick={handleTrend} className={buttonClasses}>Detect Trend</Button>
      </div>

      <div className="space-y-2">
        <Label>🚨 Anomaly Z-Threshold</Label>
        <Input type="number" step={0.1} value={zThreshold} onChange={(e) => setZThreshold(parseFloat(e.target.value))} />
        <Button onClick={handleAnomalies} className={buttonClasses}>Detect Anomalies</Button>
      </div>

      <div className="space-y-2">
        <Label>🧬 Number of Clusters</Label>
        <Input type="number" value={numClusters} onChange={(e) => setNumClusters(parseInt(e.target.value))} />
        <Button onClick={handleCluster} className={buttonClasses}>Run Clustering</Button>
      </div>
    </div>
  );
};
