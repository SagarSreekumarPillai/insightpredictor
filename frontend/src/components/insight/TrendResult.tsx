import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface TrendResultProps {
  trendData: any[];
  valueColumn: string;
  cardClasses: string;
  headingClasses: string;
}

export const TrendResult: React.FC<TrendResultProps> = ({
  trendData,
  valueColumn,
  cardClasses,
  headingClasses,
}) => {
  return (
    <Card className={cardClasses}>
      <CardContent className="p-6">
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
            <Legend />
            <Area
              type="monotone"
              dataKey={valueColumn}
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#trendGradient)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
