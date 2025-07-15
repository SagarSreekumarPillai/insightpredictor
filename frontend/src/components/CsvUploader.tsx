"use client";

import { useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ArrowDownCircle, Sun } from "lucide-react";

import { FileUploader } from "@/components/insight/FileUploader";
import { ColumnSelector } from "@/components/insight/ColumnSelector";
import { ClusteringResult } from "@/components/insight/ClusteringResult";
import { AnomalyResult } from "@/components/insight/AnomalyResult";
import { PredictionResult } from "@/components/insight/PredictionResult";
import { TrendResult } from "@/components/insight/TrendResult";

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

  const resultRef = useRef<HTMLDivElement>(null);
  const scrollToResults = () => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
  };

  const themeClasses = "bg-white text-gray-900";
  const cardClasses = "bg-white border border-gray-200 rounded-2xl shadow-sm";
  const headingClasses = "text-lg font-semibold text-gray-800";
  const buttonClasses = "bg-orange-500 text-white hover:bg-orange-400 transition px-4 py-2 rounded-lg";

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

  return (
    <div className={`min-h-screen px-4 py-6 md:px-12 md:py-10 transition-colors duration-300 ${themeClasses}`}>
      <Toaster />

      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button className={`p-2 rounded-full shadow-md ${buttonClasses}`}>
          <Sun className="w-5 h-5" />
        </button>
        <button
          className={`p-3 rounded-full shadow-lg ${buttonClasses}`}
          onClick={scrollToResults}
        >
          <ArrowDownCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-6">
        <div className="xl:col-span-1 space-y-6 sticky top-24 self-start">
          <FileUploader
            file={file}
            setFile={setFile}
            onUpload={handleUpload}
            buttonClasses={buttonClasses}
          />

          {columns.length > 0 && (
            <ColumnSelector
              columns={columns}
              shape={shape}
              target={target}
              setTarget={setTarget}
              dateColumn={dateColumn}
              setDateColumn={setDateColumn}
              valueColumn={valueColumn}
              setValueColumn={setValueColumn}
              numClusters={numClusters}
              setNumClusters={setNumClusters}
              zThreshold={zThreshold}
              setZThreshold={setZThreshold}
              file={file}
              setResults={setResults}
              setClusters={setClusters}
              setAnomalies={setAnomalies}
              setTrendData={setTrendData}
              buttonClasses={buttonClasses}
            />
          )}
        </div>

        <div ref={resultRef} className="xl:col-span-4 space-y-10">
        {results?.predictions && results?.actuals && (
          <PredictionResult
            results={results}
            cardClasses={cardClasses}
            headingClasses={headingClasses}
          />
        )}

        {anomalies && anomalies.length > 0 && (
          <AnomalyResult
            anomalies={anomalies}
            cardClasses={cardClasses}
            headingClasses={headingClasses}
          />
        )}
        {trendData && trendData.length > 0 && (
          <TrendResult trendData={trendData} valueColumn={valueColumn} cardClasses={cardClasses} headingClasses={headingClasses} />
        )}
        {clusters && (
          <ClusteringResult clusters={clusters} cardClasses={cardClasses} headingClasses={headingClasses} />
        )}
        </div>
      </div>
    </div>
  );
}
