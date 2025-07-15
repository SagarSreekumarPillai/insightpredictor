import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AnomalyResultProps {
  anomalies: any[];
  cardClasses: string;
  headingClasses: string;
}

export const AnomalyResult: React.FC<AnomalyResultProps> = ({
  anomalies,
  cardClasses,
  headingClasses,
}) => {
  return (
    <Card className={cardClasses}>
      <CardContent className="p-6">
        <h2 className={headingClasses}>🚨 Anomalies</h2>
        <div className="overflow-auto max-h-64 mt-4">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-700 border-b">
              <tr>
                {Object.keys(anomalies[0] || {}).map((key) => (
                  <th key={key} className="pr-4 pb-2 whitespace-nowrap">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anomalies.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-t">
                  {Object.entries(row).map(([key, value]) => (
                    <td
                      key={key}
                      className="pr-4 py-1 whitespace-nowrap text-gray-800"
                    >
                      {typeof value === "number" ? (value as number).toFixed(2) : (value as any)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Showing 5 anomalies ({anomalies.length} total detected)
        </p>
      </CardContent>
    </Card>
  );
};