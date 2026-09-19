import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
export function VolumeChart({ data }) {
  return (
    <div className="chart" role="img" aria-label="Emergency arrivals by date">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#168675" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#168675" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#edf0ef" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => d.slice(5)}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="arrivals"
            name="Arrivals"
            stroke="#168675"
            fill="url(#volumeFill)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function HourChart({ data }) {
  return (
    <div className="chart" role="img" aria-label="Arrivals by UTC hour">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#edf0ef" />
          <XAxis
            dataKey="hour"
            tickFormatter={(h) => `${h}:00`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar
            isAnimationActive={false}
            dataKey="count"
            name="Arrivals"
            fill="#77aea4"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
