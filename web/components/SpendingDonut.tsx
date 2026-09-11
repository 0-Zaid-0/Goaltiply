"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#3eb489", // sage
  "#d4a857", // gold
  "#7fb8a3",
  "#c1554d",
  "#8fa3bd",
  "#b58f57",
  "#5f8f7a",
];

export default function SpendingDonut({
  breakdown,
}: {
  breakdown: { category: string; total: number }[];
}) {
  const data = breakdown.map((b) => ({ name: b.category, value: b.total }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--on-accent)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text)",
            }}
            formatter={(value) => [`$${Number(value).toFixed(0)}`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[family-name:var(--font-display)] text-xl text-[var(--text)]">
          ${total.toFixed(0)}
        </span>
        <span className="text-[10px] text-[var(--text-dim)]">spent</span>
      </div>
    </div>
  );
}
