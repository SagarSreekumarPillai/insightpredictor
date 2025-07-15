import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface PredictionResultProps {
  results: any;
  cardClasses: string;
  headingClasses: string;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  results,
  cardClasses,
  headingClasses,
}) => {
  if (!results?.predictions || !results?.actuals) return null;

  const chartData = results.predictions.map((p: number, i: number) => ({
    index: i + 1,
    Prediction: p,
    Actual: results.actuals[i],
  }));

  return (
    <Card className={cardClasses}>
      <CardContent className="p-6">
        <h2 className={headingClasses}>📈 Prediction vs Actual</h2>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="index" hide />
              <YAxis hide />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Prediction" stroke="#34d399" strokeWidth={2} />
              <Line type="monotone" dataKey="Actual" stroke="#60a5fa" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};