import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  Droplets,
  Gauge,
  MapPin,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import { provinceOf } from "../lib/provinces";
import { describeCode, fetchWeather, type WeatherData } from "../lib/weather";

type Props = {
  districtName: string | null;
  province: string | null;
  lon: number | null;
  lat: number | null;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const fmtHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit" }).replace(":00", "h");

export default function WeatherPanel({ districtName, province, lon, lat }: Props) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let cancel = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetchWeather(lat, lon)
      .then((d) => !cancel && setData(d))
      .catch((e) => !cancel && setError(String(e?.message ?? e)))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [lat, lon]);

  if (!districtName) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8">
        <div className="text-5xl sm:text-6xl float-y mb-4">🏔️</div>
        <h3 className="font-display text-2xl mb-2">Choose a district</h3>
        <p className="text-[var(--color-ink-soft)] max-w-xs text-sm leading-relaxed">
          Click any district on the map, or pick one from the dropdown. You&apos;ll see live temperature,
          forecast, sunrise and more.
        </p>
      </div>
    );
  }

  const p = province ? provinceOf(province) : null;

  return (
    <div className="weather-scroll p-4 sm:p-6 h-full overflow-y-auto scroll-ink">
      <div className="flex items-start gap-3 mb-4 sm:mb-5">
        <div className="w-1 self-stretch rounded-full" style={{ background: p?.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] font-mono">
            <MapPin className="inline w-3 h-3 mr-1 -mt-0.5" />
            Province {province} · {p?.name}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight">{districtName}</h2>
          {lat != null && lon != null && (
            <div className="font-mono text-[10px] text-[var(--color-ink-soft)] mt-1">
              {lat.toFixed(3)}°N · {lon.toFixed(3)}°E
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="load"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8 sm:py-10 text-center text-[var(--color-ink-soft)]"
          >
            <div className="inline-block w-6 h-6 border-2 border-[var(--color-ink)] border-t-transparent rounded-full animate-spin mb-3" />
            <div className="font-mono text-xs">fetching live data...</div>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            key="err"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded text-sm"
          >
            Could not fetch weather: {error}
          </motion.div>
        )}

        {data && !loading && (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4 sm:space-y-5"
          >
            <div
              className="rounded-2xl p-4 sm:p-5 text-[var(--color-bg)] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${p?.hover ?? "#1a1410"}, #1a1410)`,
              }}
            >
              <div className="absolute top-0 right-0 text-[88px] sm:text-[120px] leading-none opacity-20 select-none">
                {describeCode(data.current.weatherCode).emoji}
              </div>
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.2em] font-mono opacity-70">
                  Now · {fmtTime(data.current.time)} NPT
                </div>
                <div className="flex items-end gap-2 mt-1">
                  <span className="font-display text-6xl sm:text-7xl font-semibold leading-none">
                    {Math.round(data.current.temperature)}
                  </span>
                  <span className="font-display text-2xl sm:text-3xl mb-1 opacity-80">°C</span>
                </div>
                <div className="font-display italic text-base sm:text-lg mt-1">
                  {describeCode(data.current.weatherCode).label}
                </div>
                <div className="text-xs opacity-70 mt-1 font-mono">
                  Feels like {Math.round(data.current.apparent)}°C
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Stat icon={<Droplets className="w-4 h-4" />} label="Humidity" value={`${data.current.humidity}%`} />
              <Stat
                icon={<Wind className="w-4 h-4" />}
                label="Wind"
                value={`${Math.round(data.current.windSpeed)} km/h`}
                sub={windDir(data.current.windDir)}
              />
              <Stat icon={<Cloud className="w-4 h-4" />} label="Precip" value={`${data.current.precipitation} mm`} />
              <Stat icon={<Gauge className="w-4 h-4" />} label="Elevation" value={`${Math.round(data.elevation)} m`} />
              <Stat icon={<Sunrise className="w-4 h-4" />} label="Sunrise" value={fmtTime(data.daily[0].sunrise)} />
              <Stat icon={<Sunset className="w-4 h-4" />} label="Sunset" value={fmtTime(data.daily[0].sunset)} />
              <Stat icon={<Sun className="w-4 h-4" />} label="UV max" value={data.daily[0].uv?.toFixed(1) ?? "-"} />
              <Stat
                icon={<Thermometer className="w-4 h-4" />}
                label="Today"
                value={`${Math.round(data.daily[0].tMin)}° / ${Math.round(data.daily[0].tMax)}°`}
              />
            </div>

            <div>
              <h4 className="font-display text-base sm:text-lg mb-2 flex items-center gap-2">
                Next 24 hours
                <span className="flex-1 h-px bg-[var(--color-line)]" />
              </h4>
              <HourlyChart hourly={data.hourly} />
            </div>

            <div>
              <h4 className="font-display text-base sm:text-lg mb-2 flex items-center gap-2">
                7-day outlook
                <span className="flex-1 h-px bg-[var(--color-line)]" />
              </h4>
              <div className="space-y-1.5">
                {data.daily.map((d, i) => (
                  <DailyRow key={d.date} d={d} isToday={i === 0} />
                ))}
              </div>
            </div>

            <div className="text-[10px] font-mono text-[var(--color-ink-soft)] text-center pt-2 pb-4">
              Source: open-meteo.com · tz {data.timezone}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[var(--color-bg-2)] border border-[var(--color-line)]/60 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-[var(--color-ink-soft)]">
        {icon} {label}
      </div>
      <div className="font-display text-lg sm:text-xl mt-1">{value}</div>
      {sub && <div className="text-[10px] font-mono text-[var(--color-ink-soft)]">{sub}</div>}
    </div>
  );
}

function windDir(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return `${dirs[Math.round(deg / 45) % 8]} · ${Math.round(deg)}°`;
}

function DailyRow({ d, isToday }: { d: WeatherData["daily"][number]; isToday: boolean }) {
  const meta = describeCode(d.code);
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 py-1.5 px-2 rounded hover:bg-[var(--color-bg-2)]">
      <div className="w-16 sm:w-20 font-mono text-xs">{isToday ? "Today" : fmtDay(d.date).split(",")[0]}</div>
      <div className="text-lg w-7 sm:w-8 text-center">{meta.emoji}</div>
      <div className="order-4 basis-full sm:order-none sm:basis-auto flex-1 text-xs text-[var(--color-ink-soft)] italic truncate">
        {meta.label}
      </div>
      <div className="ml-auto sm:ml-0 font-mono text-xs w-10 text-right text-[var(--color-ink-soft)]">
        {Math.round(d.tMin)}°
      </div>
      <div className="order-5 basis-full sm:order-none sm:basis-auto w-full sm:w-20 h-1 bg-[var(--color-line)]/50 rounded-full relative overflow-hidden">
        <div
          className="absolute h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #6f9ab8, #f2cc8f, #c0392b)",
            left: `${Math.max(0, ((d.tMin + 10) / 50) * 100)}%`,
            right: `${Math.max(0, 100 - ((d.tMax + 10) / 50) * 100)}%`,
          }}
        />
      </div>
      <div className="font-mono text-xs w-10 font-semibold">{Math.round(d.tMax)}°</div>
    </div>
  );
}

function HourlyChart({ hourly }: { hourly: WeatherData["hourly"] }) {
  if (!hourly.length) return null;
  const temps = hourly.map((h) => h.t);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = Math.max(1, max - min);
  const W = 100;
  const H = 40;
  const pts = hourly.map((h, i) => {
    const x = (i / (hourly.length - 1)) * W;
    const y = H - ((h.t - min) / range) * H;
    return `${x},${y}`;
  });
  const areaPath = `M0,${H} L${pts.join(" L")} L${W},${H} Z`;
  const linePath = `M${pts.join(" L")}`;

  return (
    <div className="bg-[var(--color-bg-2)] border border-[var(--color-line)]/60 rounded-lg p-2.5 sm:p-3">
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full h-24 sm:h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c0392b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c0392b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hg)" />
        <path d={linePath} fill="none" stroke="#1a1410" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        {hourly.map((h, i) => {
          if (i % 4 !== 0) return null;
          const x = (i / (hourly.length - 1)) * W;
          const y = H - ((h.t - min) / range) * H;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="0.8" fill="#1a1410" />
              <text x={x} y={y - 2} textAnchor="middle" fontSize="3" fill="#1a1410" className="font-mono">
                {Math.round(h.t)}°
              </text>
              <text x={x} y={H + 10} textAnchor="middle" fontSize="3" fill="#544637" className="font-mono">
                {fmtHour(h.time)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
