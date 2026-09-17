import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Line, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import type { HourlyForecast } from "@workspace/api-client-react";
import { useUnits } from "@/components/auth/UserPrefsProvider";
import { cToF, cmToIn, kmhToMph } from "@/lib/unitsFormat";

interface ForecastChartProps {
  data: HourlyForecast[];
  metric: "temperature" | "snowfall" | "windSpeed";
}

export function ForecastChart({ data, metric }: ForecastChartProps) {
  const u = useUnits();
  const imperial = u.units === "imperial";
  // Only show next 24 hours · converted at the display edge (canonical data stays metric)
  const chartData = data.slice(0, 24).map(item => ({
    time: format(parseISO(item.time), "ha"),
    temperature:
      item.temperature != null && imperial
        ? Math.round(cToF(item.temperature) * 10) / 10
        : item.temperature,
    feelsLike:
      item.feelsLike != null && imperial
        ? Math.round(cToF(item.feelsLike) * 10) / 10
        : item.feelsLike,
    snowfall: imperial
      ? Math.round(cmToIn(item.snowfall || 0) * 100) / 100
      : item.snowfall || 0,
    windSpeed:
      item.windSpeed != null && imperial
        ? Math.round(kmhToMph(item.windSpeed))
        : item.windSpeed,
  }));

  const config = {
    temperature: { color: "hsl(var(--primary))", unit: u.tempUnit, label: "actual" },
    snowfall: { color: "#ec008c", unit: u.snowUnit, label: "Snowfall" },
    windSpeed: { color: "hsl(217, 32%, 60%)", unit: u.windUnit, label: "Wind" },
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
            formatter={(value: number, name: string) => [
              `${value ?? "-"}${currentConfig.unit}`,
              metric === "temperature"
                ? name === "feelsLike"
                  ? "feelzlike"
                  : "actual"
                : currentConfig.label,
            ]}
            labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
          />
          {metric === "temperature" && (
            <Legend
              verticalAlign="top"
              height={28}
              iconType="plainline"
              formatter={(value) => (value === "feelsLike" ? "feelzlike" : "actual")}
              wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
            />
          )}
          {metric === "temperature" ? (
            <Line
              type="monotone"
              dataKey="temperature"
              name="temperature"
              stroke={currentConfig.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: currentConfig.color }}
              connectNulls={false}
            />
          ) : (
            <Area
              type="monotone"
              dataKey={metric}
              stroke={currentConfig.color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#gradient-${metric})`}
              activeDot={{ r: 6, strokeWidth: 0, fill: currentConfig.color }}
            />
          )}
          {metric === "temperature" && (
            <Line
              type="monotone"
              dataKey="feelsLike"
              name="feelsLike"
              stroke="#ec008c"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "#ec008c" }}
              connectNulls={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
