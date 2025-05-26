"use client";

import Image from "next/image";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartType = "bar" | "line" | "pie" | "radial";

interface ChartData {
  name?: string;
  value?: number;
  count?: number;
  fill?: string;
  [key: string]: any;
}

interface DataChartProps {
  type: ChartType;
  data: ChartData[];
  title: string;
  showMoreIcon?: boolean;
  height?: string;
  className?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  customTooltip?: (value: any) => string;
  customLegend?: (value: string) => string;
  dataKeys?: string[];
  radialConfig?: {
    innerRadius?: string;
    outerRadius?: string;
    barSize?: number;
  };
  pieConfig?: {
    innerRadius?: number;
    outerRadius?: number;
    paddingAngle?: number;
  };
}

const DataChart = ({
  type,
  data,
  title,
  showMoreIcon = true,
  height = "90%",
  className = "",
  colors = ["#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6"],
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  customTooltip,
  customLegend,
  dataKeys,
  radialConfig = {
    innerRadius: "40%",
    outerRadius: "100%",
    barSize: 32,
  },
  pieConfig = {
    innerRadius: 60,
    outerRadius: 80,
    paddingAngle: 5,
  },
}: DataChartProps) => {
  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data} barSize={20}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />}
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: "#d1d5db" }}
              tickLine={false}
            />
            <YAxis axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false} />
            {showTooltip && (
              <Tooltip
                contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
                formatter={customTooltip}
              />
            )}
            {showLegend && (
              <Legend
                align="left"
                verticalAlign="top"
                wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
                formatter={customLegend}
              />
            )}
            {dataKeys?.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                legendType="circle"
                radius={[10, 10, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "line":
        return (
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                }}
                formatter={customTooltip}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
            )}
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={customLegend}
              />
            )}
            {dataKeys?.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={pieConfig.innerRadius}
              outerRadius={pieConfig.outerRadius}
              paddingAngle={pieConfig.paddingAngle}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                formatter={customTooltip}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                }}
              />
            )}
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={customLegend}
              />
            )}
          </PieChart>
        );

      case "radial":
        return (
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius={radialConfig.innerRadius}
            outerRadius={radialConfig.outerRadius}
            barSize={radialConfig.barSize}
            data={data}
          >
            <RadialBar background dataKey="count" />
            {showLegend && <Legend />}
          </RadialBarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl w-full h-full p-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        {showMoreIcon && <Image src="/moreDark.png" alt="" width={20} height={20} />}
      </div>
      <div style={{ height }} className="relative w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DataChart; 