import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  Snowflake, 
  CloudLightning, 
  CloudSnow 
} from "lucide-react";
import { cn } from "../../lib/utils";

interface WeatherIconProps {
  code: number;
  className?: string;
  isDay?: boolean;
}

export function WeatherIcon({ code, className, isDay = true }: WeatherIconProps) {
  const props = { className: cn("w-6 h-6", className) };

  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code === 0) return isDay ? <Sun {...props} className={cn("text-amber-500", props.className)} /> : <Cloud {...props} />;
  if (code === 1 || code === 2) return isDay ? <CloudSun {...props} className={cn("text-amber-400", props.className)} /> : <Cloud {...props} />;
  if (code === 3) return <Cloud {...props} className={cn("text-gray-400", props.className)} />;
  if (code === 45 || code === 48) return <CloudFog {...props} className={cn("text-gray-400", props.className)} />;
  if (code >= 51 && code <= 55) return <CloudDrizzle {...props} className={cn("text-blue-400", props.className)} />;
  if (code >= 61 && code <= 65) return <CloudRain {...props} className={cn("text-blue-500", props.className)} />;
  if (code >= 71 && code <= 75) return <Snowflake {...props} className={cn("text-blue-200 fill-blue-100", props.className)} />;
  if (code >= 77) return <CloudSnow {...props} className={cn("text-blue-300", props.className)} />;
  if (code >= 80 && code <= 82) return <CloudRain {...props} className={cn("text-blue-600", props.className)} />;
  if (code >= 85 && code <= 86) return <CloudSnow {...props} className={cn("text-blue-300", props.className)} />;
  if (code >= 95) return <CloudLightning {...props} className={cn("text-amber-600", props.className)} />;
  
  return <Cloud {...props} />;
}
