import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import type { HourlyForecast } from "@workspace/api-client-react";

interface ForecastChartProps {
  data: HourlyForecast[];
  metric: "temperature" | "snowfall" | "windSpeed";
}

export function ForecastChart({ data, metric }: ForecastChartProps) {
  // Only show next 24 hours
  const chartData = data.slice(0, 24).map(item => ({
    time: format(parseISO(item.time), "ha"),
    temperature: item.temperature,
    snowfall: item.snowfall || 0,
    windSpeed: item.windSpeed,
  }));

  const config = {
    temperature: { color: "hsl(var(--primary))", unit: "°C", label: "Temperature" },
    snowfall: { color: "#ec008c", unit: "cm", label: "Snowfall" },
    windSpeed: { color: "hsl(217, 32%, 60%)", unit: "km/h", label: "Wind" },
  };

  const currentConfig = config[metric];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            width={metric === "windSpeed" ? 56 : 44}
            tickFormatter={(value) => `${value}${currentConfig.unit}`}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
            }}
            formatter={(value: number) => [`${value}${currentConfig.unit}`, currentConfig.label]}
            labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={currentConfig.color}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#gradient-${metric})`}
            activeDot={{ r: 6, strokeWidth: 0, fill: currentConfig.color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
