"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  t: string;
  w: number;
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}

function formatWatts(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} kW`;
  return `${Math.round(v)} W`;
}

export function ProductionChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-[13px] text-swiss-mute">
        Pas encore de données historiques — les courbes s'étofferont après
        quelques cycles de synchronisation.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E30613" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#E30613" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#E6E4DE"
            strokeDasharray="1 4"
            vertical={false}
          />
          <XAxis
            dataKey="t"
            tickFormatter={formatHour}
            stroke="#6B6963"
            fontSize={11}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            stroke="#6B6963"
            fontSize={11}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatWatts}
            width={46}
          />
          <Tooltip
            contentStyle={{
              background: "#0A0A0B",
              border: "none",
              borderRadius: 2,
              fontSize: 12,
              color: "#FAFAF7",
              padding: "6px 10px",
            }}
            labelStyle={{ color: "#E30613", fontWeight: 500 }}
            labelFormatter={(v) => formatHour(String(v))}
            formatter={(v: number) => [formatWatts(v), "Puissance"]}
          />
          <Area
            type="monotone"
            dataKey="w"
            stroke="#E30613"
            strokeWidth={1.75}
            fill="url(#gRed)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
