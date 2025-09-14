"use client";

import React from 'react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface DataChartProps {
  data: DataPoint[];
  type: 'pie' | 'bar' | 'line';
  height?: number;
  width?: number;
  colors?: string[];
  title?: string;
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  className?: string;
  interactive?: boolean;
  onDataPointClick?: (data: DataPoint, index: number) => void;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  responsive?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function DataChart({
  data,
  type,
  height = 300,
  width,
  colors = COLORS,
  title,
  xAxisDataKey = 'name',
  yAxisDataKey = 'value',
  className = '',
  interactive = true,
  onDataPointClick,
  showTooltip = true,
  showLegend = true,
  animate = true,
  responsive = true
}: DataChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yAxisDataKey}
                onClick={interactive && onDataPointClick ? (data, index) => onDataPointClick(data, index) : undefined}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    style={{ transition: animate ? 'fill 0.3s ease' : 'none' }}
                  />
                ))}
              </Pie>
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisDataKey} tick={{ fill: '#1e3a8a' }} />
              <YAxis tick={{ fill: '#1e3a8a' }} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              <Bar 
                dataKey={yAxisDataKey} 
                fill="#8884d8"
                onClick={interactive && onDataPointClick ? (data, index) => onDataPointClick(data, index) : undefined}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisDataKey} tick={{ fill: '#1e3a8a' }} />
              <YAxis tick={{ fill: '#1e3a8a' }} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey={yAxisDataKey} 
                stroke="#8884d8" 
                strokeWidth={2}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">{title}</h3>
      )}
      {renderChart()}
    </div>
  );
}
