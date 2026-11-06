import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HistoricalTrendPoint } from '../../types/analytics';

export interface FollowerGrowthChartProps {
  data: HistoricalTrendPoint[];
}

export const FollowerGrowthChart: React.FC<FollowerGrowthChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        No historical snapshot data available to plot yet.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="followerColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E1306C" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#E1306C" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="followingColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#833AB4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#833AB4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
          <XAxis
            dataKey="dateLabel"
            stroke="#8E8E93"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#8E8E93"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          />
          <Area
            type="monotone"
            dataKey="followers"
            name="Followers"
            stroke="#E1306C"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#followerColor)"
          />
          <Area
            type="monotone"
            dataKey="following"
            name="Following"
            stroke="#833AB4"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#followingColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

