import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ClusteringResultProps {
  clusters: any[];
  cardClasses: string;
  headingClasses: string;
}

export const ClusteringResult: React.FC<ClusteringResultProps> = ({
  clusters,
  cardClasses,
  headingClasses,
}) => {
  const clusterGroups = clusters.reduce((acc: Record<number, any[]>, row) => {
    const clusterId = row.cluster;
    if (!acc[clusterId]) acc[clusterId] = [];
    acc[clusterId].push(row);
    return acc;
  }, {});

  return (
    <Card className={cardClasses}>
      <CardContent className="p-6">
        <h2 className={headingClasses}>🧬 Clustering Results</h2>
        <div className="mt-4 space-y-6">
          {Object.entries(clusterGroups).map(([clusterId, rows]) => (
            <div key={clusterId} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold text-orange-600 mb-2">Cluster {clusterId}</h3>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-700 border-b">
                    <tr>
                      {Object.keys((rows as any[])[0])
                        .filter((key) => key !== "cluster")
                        .map((key) => (
                          <th key={key} className="pr-4 pb-2 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as any[]).slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.entries(row)
                          .filter(([key]) => key !== "cluster")
                          .map(([key, value]) => (
                            <td key={key} className="pr-4 py-1 whitespace-nowrap text-gray-800">
                              {typeof value === "number" ? (value as number).toFixed(2) : (value as any)}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Showing 5 sample rows for Cluster {clusterId} ({(rows as any[]).length} total rows)
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};