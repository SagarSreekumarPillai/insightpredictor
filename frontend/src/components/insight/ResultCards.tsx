"use client";

import { Card, CardContent } from "@/components/ui/card";
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

interface ResultCardsProps {
  trendData: any[] | null;
  results: any | null;
  anomalies: any[] | null;
  clusters: any[] | null;
  valueColumn: string;
  cardClasses: string;
  headingClasses: string;
  buttonClasses?: string; // Added
}

export const ResultCards = ({
  trendData,
  results,
  anomalies,
  clusters,
  valueColumn,
  cardClasses,
  headingClasses,
  buttonClasses, // Added
}: ResultCardsProps) => {
  return (
    <>
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
                <XAxis dataKey="month" />
                <YAxis />
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
              <LineChart data={results.predictions.map((p: number, i: number) => ({
                index: i + 1,
                Prediction: p,
                Actual: results.actuals[i]
              }))}>
                <XAxis dataKey="index" />
                <YAxis />
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
    </>
  );
};
