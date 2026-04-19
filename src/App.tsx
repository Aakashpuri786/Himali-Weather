import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mountain, Compass } from "lucide-react";
import NepalMap from "./components/NepalMap";
import DistrictSelect from "./components/DistrictSelect";
import WeatherPanel from "./components/WeatherPanel";
import { PROVINCES } from "./lib/provinces";
import { featureCentroid, type FC } from "./lib/geo";

type DistrictIndex = {
  name: string;
  province: string;
  lat: number;
  lon: number;
};

export default function App() {
  const [districts, setDistricts] = useState<FC | null>(null);
  const [states, setStates] = useState<FC | null>(null);
  const [selected, setSelected] = useState<string | null>("Kathmandu");

  useEffect(() => {
    Promise.all([
      fetch("/data/districts.geojson").then((r) => r.json()),
      fetch("/data/states.geojson").then((r) => r.json()),
    ]).then(([d, s]) => {
      setDistricts(d);
      setStates(s);
    });
  }, []);

  const index: DistrictIndex[] = useMemo(() => {
    if (!districts) return [];
    return districts.features
      .map((f) => {
        const [lon, lat] = featureCentroid(f);
        return {
          name: f.properties.DIST_EN as string,
          province: String(f.properties.ADM1_EN),
          lat,
          lon,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [districts]);

  const current = selected ? index.find((d) => d.name === selected) ?? null : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-line)]">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-ink)] flex items-center justify-center shadow-[0_6px_20px_-8px_rgba(26,20,16,0.6)]">
              <Mountain className="w-6 h-6 text-[var(--color-gold)]" />
            </div>
            <div>
              <div className="font-display text-2xl leading-none font-semibold">
                Himali<span className="text-[var(--color-accent)]">.</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-mono text-[var(--color-ink-soft)]">
                Nepal weather atlas
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-ink-soft)]">
            <span className="hidden sm:flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              77 districts · 7 provinces
            </span>
            <span className="px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-bg)] rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] max-w-3xl">
            From the <em className="text-[var(--color-accent)]">Terai</em> to the{" "}
            <em className="text-[var(--color-accent-2)]">Himalayas</em> — the weather, district by district.
          </h1>
          <p className="text-[var(--color-ink-soft)] mt-3 max-w-2xl">
            Pick a district from the map or the dropdown. We'll pull live temperature, humidity,
            wind and a 7-day forecast from Open-Meteo.
          </p>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 text-xs font-mono">
          <span className="uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">Provinces:</span>
          {Object.values(PROVINCES).map((p) => (
            <span key={p.code} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: p.color, outline: "1px solid rgba(26,20,16,0.4)" }} />
              {p.code}. {p.name}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          {/* Map card */}
          <div className="paper relative bg-[var(--color-bg-2)] border border-[var(--color-line)] rounded-2xl p-4 shadow-[0_18px_50px_-28px_rgba(26,20,16,0.4)]">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="font-display italic text-lg">
                The Cartographer's Nepal
              </div>
              <div className="font-mono text-[10px] text-[var(--color-ink-soft)] uppercase tracking-wider">
                scale ~ 1:3,500,000
              </div>
            </div>
            {districts && states ? (
              <NepalMap
                districts={districts}
                provinces={states}
                selected={selected}
                onSelect={setSelected}
              />
            ) : (
              <div className="h-[60vh] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--color-ink)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="mt-2 flex items-center justify-between px-2 font-mono text-[10px] text-[var(--color-ink-soft)] uppercase tracking-wider">
              <span>★ national capital</span>
              <span>● provincial capital</span>
              <span>hover & click any district</span>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <DistrictSelect
              items={index.map(({ name, province }) => ({ name, province }))}
              value={selected}
              onChange={setSelected}
            />

            <div className="bg-[var(--color-bg-2)] border border-[var(--color-line)] rounded-2xl min-h-[520px] overflow-hidden">
              <WeatherPanel
                districtName={current?.name ?? null}
                province={current?.province ?? null}
                lat={current?.lat ?? null}
                lon={current?.lon ?? null}
              />
            </div>
          </div>
        </div>

        <footer className="mt-16 pt-6 border-t border-[var(--color-line)] text-[11px] font-mono text-[var(--color-ink-soft)] flex flex-wrap justify-between gap-2">
          <span>Boundaries: mesaugat/geoJSON-Nepal (OCHA)</span>
          <span>Weather: Open-Meteo</span>
          <span>Built with ❤️ for the 77 जिल्ला</span>
        </footer>
      </main>
    </div>
  );
}
