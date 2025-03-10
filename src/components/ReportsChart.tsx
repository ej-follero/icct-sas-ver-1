"use client";

import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    name: "Jan",
    Present: 4000,
    Absent: 2400,
  },
  {
    name: "Feb",
    Present: 3000,
    Absent: 1398,
  },
  {
    name: "Mar",
    Present: 2000,
    Absent: 9800,
  },
  {
    name: "Apr",
    Present: 2780,
    Absent: 3908,
  },
  {
    name: "May",
    Present: 1890,
    Absent: 4800,
  },
  {
    name: "Jun",
    Present: 2390,
    Absent: 3800,
  },
  {
    name: "Jul",
    Present: 3490,
    Absent: 4300,
  },
  {
    name: "Aug",
    Present: 3490,
    Absent: 4300,
  },
  {
    name: "Sep",
    Present: 3490,
    Absent: 4300,
  },
  {
    name: "Oct",
    Present: 3490,
    Absent: 4300,
  },
  {
    name: "Nov",
    Present: 3490,
    Absent: 4300,
  },
  {
    name: "Dec",
    Present: 3490,
    Absent: 4300,
  },
];

const ReportsChart = () => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Reports</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false}  tickMargin={20}/>
          <Tooltip />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line
            type="monotone"
            dataKey="Present"
            stroke="#00D804"
            strokeWidth={5}
          />
          <Line type="monotone" dataKey="Absent" stroke="#C50006" strokeWidth={5}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportsChart;
