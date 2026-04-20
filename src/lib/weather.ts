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

export const describeCode = (code: number) =>
  WEATHER_CODE[code] ?? { label: "Unknown", emoji: "🌡️" };

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    hourly: "temperature_2m,weather_code,precipitation",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset,uv_index_max",
    timezone: "Asia/Kathmandu",
    forecast_days: "7",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error("Weather fetch failed");
  const weatherJson = await response.json();

  const hourly: WeatherData["hourly"] = [];
  const now = Date.now();
  const times: string[] = weatherJson.hourly?.time ?? [];
  for (let index = 0; index < times.length; index += 1) {
    const time = new Date(times[index]).getTime();
    if (time < now - 60 * 60 * 1000) continue;

    hourly.push({
      time: times[index],
      t: weatherJson.hourly.temperature_2m[index],
      code: weatherJson.hourly.weather_code[index],
      precip: weatherJson.hourly.precipitation[index] ?? 0,
    });

    if (hourly.length >= 24) break;
  }

  const daily: WeatherData["daily"] = (weatherJson.daily?.time ?? []).map(
    (day: string, index: number) => ({
      date: day,
      tMax: weatherJson.daily.temperature_2m_max[index],
      tMin: weatherJson.daily.temperature_2m_min[index],
      code: weatherJson.daily.weather_code[index],
      precipSum: weatherJson.daily.precipitation_sum[index],
      sunrise: weatherJson.daily.sunrise[index],
      sunset: weatherJson.daily.sunset[index],
      uv: weatherJson.daily.uv_index_max[index],
    }),
  );

  return {
    current: {
      temperature: weatherJson.current.temperature_2m,
      apparent: weatherJson.current.apparent_temperature,
      humidity: weatherJson.current.relative_humidity_2m,
      windSpeed: weatherJson.current.wind_speed_10m,
      windDir: weatherJson.current.wind_direction_10m,
      precipitation: weatherJson.current.precipitation,
      weatherCode: weatherJson.current.weather_code,
      isDay: weatherJson.current.is_day,
      time: weatherJson.current.time,
    },
    daily,
    hourly,
    timezone: weatherJson.timezone,
    elevation: weatherJson.elevation,
  };
}
