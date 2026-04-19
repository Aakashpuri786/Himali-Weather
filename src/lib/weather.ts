// Open-Meteo (no API key required)

export type WeatherData = {
  current: {
    temperature: number;
    apparent: number;
    humidity: number;
    windSpeed: number;
    windDir: number;
    precipitation: number;
    weatherCode: number;
    isDay: number;
    time: string;
  };
  daily: Array<{
    date: string;
    tMax: number;
    tMin: number;
    code: number;
    precipSum: number;
    sunrise: string;
    sunset: string;
    uv: number;
  }>;
  hourly: Array<{ time: string; t: number; code: number; precip: number }>;
  timezone: string;
  elevation: number;
};

export const WEATHER_CODE: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Fog", emoji: "🌫️" },
  48: { label: "Rime fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌦️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "⛈️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "❄️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  77: { label: "Snow grains", emoji: "🌨️" },
  80: { label: "Rain showers", emoji: "🌦️" },
  81: { label: "Heavy showers", emoji: "🌧️" },
  82: { label: "Violent showers", emoji: "⛈️" },
  85: { label: "Snow showers", emoji: "🌨️" },
  86: { label: "Heavy snow showers", emoji: "❄️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm + hail", emoji: "⛈️" },
  99: { label: "Severe thunderstorm", emoji: "⛈️" },
};

export const describeCode = (c: number) =>
  WEATHER_CODE[c] ?? { label: "Unknown", emoji: "🌡️" };

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    hourly: "temperature_2m,weather_code,precipitation",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset,uv_index_max",
    timezone: "Asia/Kathmandu",
    forecast_days: "7",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Weather fetch failed");
  const j = await res.json();

  const hourly: WeatherData["hourly"] = [];
  const now = Date.now();
  const times: string[] = j.hourly?.time ?? [];
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    if (t < now - 60 * 60 * 1000) continue;
    hourly.push({
      time: times[i],
      t: j.hourly.temperature_2m[i],
      code: j.hourly.weather_code[i],
      precip: j.hourly.precipitation[i] ?? 0,
    });
    if (hourly.length >= 24) break;
  }

  const daily: WeatherData["daily"] = (j.daily?.time ?? []).map((d: string, i: number) => ({
    date: d,
    tMax: j.daily.temperature_2m_max[i],
    tMin: j.daily.temperature_2m_min[i],
    code: j.daily.weather_code[i],
    precipSum: j.daily.precipitation_sum[i],
    sunrise: j.daily.sunrise[i],
    sunset: j.daily.sunset[i],
    uv: j.daily.uv_index_max[i],
  }));

  return {
    current: {
      temperature: j.current.temperature_2m,
      apparent: j.current.apparent_temperature,
      humidity: j.current.relative_humidity_2m,
      windSpeed: j.current.wind_speed_10m,
      windDir: j.current.wind_direction_10m,
      precipitation: j.current.precipitation,
      weatherCode: j.current.weather_code,
      isDay: j.current.is_day,
      time: j.current.time,
    },
    daily,
    hourly,
    timezone: j.timezone,
    elevation: j.elevation,
  };
}
