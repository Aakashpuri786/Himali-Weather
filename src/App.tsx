import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Compass, Mountain } from "lucide-react";
import DistrictSelect from "./components/DistrictSelect";
import NepalMap from "./components/NepalMap";
import SeoHead from "./components/SeoHead";
import WeatherPanel from "./components/WeatherPanel";
import { featureCentroid, type FC } from "./lib/geo";
import { PROVINCES, provinceOf } from "./lib/provinces";
import { districtPath, HOME_FAQS, matchDistrictFromPath } from "./lib/site";

type DistrictIndex = {
  name: string;
  province: string;
  lat: number;
  lon: number;
  path: string;
};

const FEATURED_DISTRICTS = [
  "Kathmandu",
  "Bhaktapur",
  "Lalitpur",
  "Kaski",
  "Chitwan",
  "Jhapa",
  "Kailali",
  "Banke",
];

export default function App() {
  const [districts, setDistricts] = useState<FC | null>(null);
  const [states, setStates] = useState<FC | null>(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    Promise.all([
      fetch("/data/districts.geojson").then((response) => response.json()),
      fetch("/data/states.geojson").then((response) => response.json()),
    ]).then(([districtData, stateData]) => {
      setDistricts(districtData);
      setStates(stateData);
    });
  }, []);

  const index: DistrictIndex[] = useMemo(() => {
    if (!districts) return [];

    return districts.features
      .map((feature) => {
        const [lon, lat] = featureCentroid(feature);
        const name = String(feature.properties.DIST_EN);
        return {
          name,
          province: String(feature.properties.ADM1_EN),
          lat,
          lon,
          path: districtPath(name),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [districts]);

  const districtItems = useMemo(
    () => index.map(({ name, province, path }) => ({ name, province, path })),
    [index],
  );

  const selected = useMemo(() => {
    if (!districtItems.length) return null;
    return matchDistrictFromPath(pathname, districtItems)?.name ?? null;
  }, [districtItems, pathname]);

  const current = selected ? index.find((district) => district.name === selected) ?? null : null;
  const currentProvince = current ? provinceOf(current.province) : null;

  const districtsByProvince = useMemo(
    () =>
      Object.values(PROVINCES).map((province) => ({
        province,
        districts: districtItems.filter((district) => district.province === province.code),
      })),
    [districtItems],
  );

  const featuredDistricts = useMemo(
    () =>
      FEATURED_DISTRICTS.flatMap((name) => {
        const district = districtItems.find((item) => item.name === name);
        return district ? [district] : [];
      }),
    [districtItems],
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openHomePage = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    setPathname("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDistrict = (name: string, options?: { replace?: boolean; scroll?: boolean }) => {
    const nextPath = districtPath(name);
    if (window.location.pathname !== nextPath) {
      if (options?.replace) {
        window.history.replaceState({}, "", nextPath);
      } else {
        window.history.pushState({}, "", nextPath);
      }
    }
    setPathname(nextPath);
    if (options?.scroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openDistrictFromLink = (event: MouseEvent<HTMLAnchorElement>, name: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    openDistrict(name, { scroll: true });
  };

  return (
    <div className="min-h-screen overflow-x-clip">
      <SeoHead district={current && currentProvince ? { name: current.name, province: currentProvince.name } : null} />

      <header className="border-b border-[var(--color-line)]">
        <div className="app-shell max-w-[1400px] mx-auto py-4 sm:py-5 flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
          <a href="/" onClick={openHomePage} className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--color-ink)] flex items-center justify-center shadow-[0_6px_20px_-8px_rgba(26,20,16,0.6)]">
              <Mountain className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-gold)]" />
            </div>
            <div>
              <div className="font-display text-xl sm:text-2xl leading-none font-semibold">
                Himali<span className="text-[var(--color-accent)]">.</span>
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-mono text-[var(--color-ink-soft)]">
                Nepal weather atlas
              </div>
            </div>
          </a>
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3 sm:gap-4 text-[11px] sm:text-xs font-mono text-[var(--color-ink-soft)]">
            <span className="hidden sm:flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              77 districts | 7 provinces
            </span>
            <span className="px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-bg)] rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
      </header>

      <main className="app-shell max-w-[1400px] mx-auto py-6 sm:py-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-4xl">
            Nepal weather forecast by district, from the <em className="text-[var(--color-accent)]">Terai</em> to the{" "}
            <em className="text-[var(--color-accent-2)]">Himalayas</em>.
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-ink-soft)] mt-3 max-w-3xl leading-relaxed">
            Himali Weather helps people check Nepal weather in every district. Explore live temperature,
            humidity, wind, sunrise, sunset, and a 7-day outlook for all 77 districts of Nepal, including
            Kathmandu, Bhaktapur, Lalitpur, Kaski, Chitwan, Jhapa, Kailali, and more.
          </p>
          {featuredDistricts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {featuredDistricts.map((district) => (
                <a
                  key={district.name}
                  href={district.path}
                  onClick={(event) => openDistrictFromLink(event, district.name)}
                  className="px-3 py-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-bg-2)] text-xs sm:text-sm font-mono hover:border-[var(--color-ink)] transition-colors"
                >
                  {district.name} weather
                </a>
              ))}
            </div>
          )}
        </motion.section>

        <section className="flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-2 mb-4 sm:mb-5 text-[11px] sm:text-xs font-mono">
          <span className="uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">Provinces:</span>
          {Object.values(PROVINCES).map((province) => (
            <span key={province.code} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: province.color, outline: "1px solid rgba(26,20,16,0.4)" }}
              />
              {province.code}. {province.name}
            </span>
          ))}
        </section>

        <section className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-4 sm:gap-6 items-start">
          <div className="map-frame paper relative bg-[var(--color-bg-2)] border border-[var(--color-line)] rounded-2xl p-3 sm:p-4 shadow-[0_18px_50px_-28px_rgba(26,20,16,0.4)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 sm:px-2">
              <div className="font-display italic text-base sm:text-lg">The Cartographer&apos;s Nepal</div>
              <div className="font-mono text-[9px] sm:text-[10px] text-[var(--color-ink-soft)] uppercase tracking-wider">
                scale ~ 1:3,500,000
              </div>
            </div>
            {districts && states ? (
              <NepalMap
                districts={districts}
                provinces={states}
                selected={selected}
                onSelect={(name) => openDistrict(name)}
              />
            ) : (
              <div className="h-[48vh] min-h-[280px] sm:h-[60vh] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--color-ink)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="map-meta mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 sm:px-2 font-mono text-[9px] sm:text-[10px] text-[var(--color-ink-soft)] uppercase tracking-wider">
              <span>star marks the national capital</span>
              <span>dots mark provincial capitals</span>
              <span>tap or click any district</span>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <DistrictSelect
              items={index.map(({ name, province }) => ({ name, province }))}
              value={selected}
              onChange={(name) => openDistrict(name)}
            />

            <div className="panel-card bg-[var(--color-bg-2)] border border-[var(--color-line)] rounded-2xl min-h-[420px] sm:min-h-[520px] overflow-hidden">
              <WeatherPanel
                districtName={current?.name ?? null}
                province={current?.province ?? null}
                lat={current?.lat ?? null}
                lon={current?.lon ?? null}
              />
            </div>
          </div>
        </section>

        {current && currentProvince && (
          <section className="mt-10 sm:mt-12 bg-[var(--color-bg-2)] border border-[var(--color-line)] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-2xl sm:text-3xl leading-tight">
              Weather in {current.name}, {currentProvince.name} Province
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-ink-soft)] max-w-4xl leading-relaxed">
              Follow live weather in {current.name}, Nepal with current temperature, humidity, wind,
              sunrise, sunset, and a full 7-day forecast. Compare {current.name} with nearby districts
              across {currentProvince.name} Province or explore conditions anywhere else in Nepal from the
              district list below.
            </p>
          </section>
        )}

        <section className="mt-10 sm:mt-12 bg-[var(--color-bg-2)] border border-[var(--color-line)] rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-2xl sm:text-3xl leading-tight">
            Weather forecast for all 77 districts of Nepal
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--color-ink-soft)] max-w-4xl leading-relaxed">
            These district pages are organized by province so people can quickly find local weather across Nepal.
            Use the links below for districts such as Kathmandu, Lalitpur, Bhaktapur, Kaski, Jhapa, Kailali,
            Surkhet, Mustang, and every other district in the country.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {districtsByProvince.map(({ province, districts: provinceDistricts }) => (
              <section
                key={province.code}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl">{province.name}</h3>
                    <p className="text-xs font-mono text-[var(--color-ink-soft)]">
                      Province {province.code} | capital {province.capital}
                    </p>
                  </div>
                  <span
                    className="w-4 h-4 rounded-sm shrink-0"
                    style={{ background: province.color, outline: "1px solid rgba(26,20,16,0.25)" }}
                  />
                </div>
                <p className="mt-3 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                  Browse weather in {province.name} Province across {provinceDistricts.length} districts.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {provinceDistricts.map((district) => (
                    <a
                      key={district.name}
                      href={district.path}
                      onClick={(event) => openDistrictFromLink(event, district.name)}
                      className="px-2.5 py-1.5 rounded-full border border-[var(--color-line)] text-xs font-mono hover:border-[var(--color-ink)] transition-colors"
                    >
                      {district.name}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <h2 className="font-display text-2xl sm:text-3xl leading-tight">
            Why weather in Nepal changes so much from district to district
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
              <h3 className="font-display text-xl">Terai plains</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Districts in the south are usually warmer, flatter, and more humid, especially during the monsoon.
              </p>
            </article>
            <article className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
              <h3 className="font-display text-xl">Hill districts</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Central hill districts can change quickly through the day, with cooler nights and shifting cloud cover.
              </p>
            </article>
            <article className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
              <h3 className="font-display text-xl">High Himalaya</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Mountain districts are colder, windier, and more exposed to snow, altitude, and fast-moving weather systems.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <h2 className="font-display text-2xl sm:text-3xl leading-tight">
            Questions people ask about Nepal weather
          </h2>
          <div className="mt-5 space-y-3">
            {HOME_FAQS.map((item, index) => (
              <details
                key={item.question}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4"
                open={index === 0}
              >
                <summary className="font-display text-lg cursor-pointer">{item.question}</summary>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-10 sm:mt-16 pt-5 sm:pt-6 border-t border-[var(--color-line)] text-[11px] font-mono text-[var(--color-ink-soft)] flex flex-col sm:flex-row sm:flex-wrap sm:justify-between gap-2">
          <span>Boundaries: mesaugat/geoJSON-Nepal (OCHA)</span>
          <span>Weather: Open-Meteo</span>
          <span>Built for Nepal&apos;s 77 districts</span>
        </footer>
      </main>
    </div>
  );
}
