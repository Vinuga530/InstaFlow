import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

export interface RelationshipDonutChartProps {
  mutualCount: number;
  notFollowingBackCount: number;
  fansCount: number;
}

export const RelationshipDonutChart: React.FC<RelationshipDonutChartProps> = ({
  mutualCount,
  notFollowingBackCount,
  fansCount,
}) => {
  const data = [
    { name: 'Mutual', value: mutualCount, color: '#10B981' },
    { name: "Doesn't Follow Back", value: notFollowingBackCount, color: '#F59E0B' },
    { name: 'Fans', value: fansCount, color: '#3B82F6' },
  ].filter((d) => d.value > 0);

  const total = mutualCount + notFollowingBackCount + fansCount;

  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-neutral-400">
        No accounts to display
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full h-52 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={78}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '12px',
              }}
              formatter={(value: unknown, name: unknown) => {
                const num = Number(value) || 0;
                return [
                  `${num} (${total > 0 ? Math.round((num / total) * 100) : 0}%)`,
                  String(name),
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {total}
          </span>
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-1 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-neutral-600 dark:text-neutral-300 font-medium">
              {item.name}:
            </span>
            <span className="text-neutral-900 dark:text-neutral-100 font-bold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
