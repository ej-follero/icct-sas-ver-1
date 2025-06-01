"use client";

import { MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Group A", value: 92, fill: "#C3EBFA" },
  { name: "Group B", value: 8, fill: "#FAE27C" },
];

const Performance = () => {
  return (
    <div className="bg-white p-4 rounded-md h-80 relative shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Performance</h1>
        <button
          aria-label="More options"
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          type="button"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <h1 className="text-3xl font-bold text-gray-900">9.2</h1>
        <p className="text-xs text-gray-400">of 10 max LTS</p>
      </div>

      <h2 className="font-medium absolute bottom-16 left-0 right-0 mx-auto text-center text-gray-700">
        1st Semester - 2nd Semester
      </h2>
    </div>
  );
};

export default Performance;
