import { useMemo, useState } from "react";
import type { FC as GFC, Feature } from "../lib/geo";
import { fcBBox, featurePath, makeProjection, featureCentroid } from "../lib/geo";
import { PROVINCES, provinceOf } from "../lib/provinces";

type Props = {
  districts: GFC;
  provinces: GFC;
  selected: string | null;
  onSelect: (districtName: string) => void;
  width?: number;
  height?: number;
};

export default function NepalMap({
  districts,
  provinces,
  selected,
  onSelect,
  width = 1100,
  height = 560,
}: Props) {
  const [hover, setHover] = useState<{
    name: string;
    province: string;
    x: number;
    y: number;
  } | null>(null);

  const { districtPaths, provincePaths, labelPoints, capitals } = useMemo(() => {
    const bbox = fcBBox(districts);
    const proj = makeProjection(bbox, width, height, 24);

    const districtPaths = districts.features.map((f: Feature) => ({
      name: f.properties.DIST_EN as string,
      province: String(f.properties.ADM1_EN),
      d: featurePath(f, proj),
    }));

    const provincePaths = provinces.features.map((f: Feature) => ({
      code: String(f.properties.ADM1_EN),
      d: featurePath(f, proj),
    }));

    const labelPoints = provinces.features.map((f: Feature) => {
      const [lon, lat] = featureCentroid(f);
      const [x, y] = proj([lon, lat]);
      return { code: String(f.properties.ADM1_EN), x, y };
    });

    // Approx capital coords (lon,lat) -> projected
    const caps: Array<{ name: string; x: number; y: number; star?: boolean }> = [
      { name: "Kathmandu", x: 85.324, y: 27.7172, star: true },
      { name: "Pokhara", x: 83.9856, y: 28.2096 },
      { name: "Biratnagar", x: 87.2718, y: 26.4525 },
      { name: "Janakpur", x: 85.9266, y: 26.7288 },
      { name: "Nepalgunj", x: 81.6168, y: 28.05 },
      { name: "Dhangadhi", x: 80.5899, y: 28.6862 },
      { name: "Birendranagar", x: 81.6336, y: 28.6008 },
    ].map((c) => {
      const [x, y] = proj([c.x, c.y]);
      return { name: c.name, x, y, star: c.star };
    });

    return { districtPaths, provincePaths, labelPoints, capitals: caps };
  }, [districts, provinces, width, height]);

  const handleMove = (e: React.MouseEvent<SVGPathElement>, name: string, province: string) => {
    const svg = (e.currentTarget.ownerSVGElement as SVGSVGElement)?.getBoundingClientRect();
    if (!svg) return;
    setHover({
      name,
      province,
      x: e.clientX - svg.left + 12,
      y: e.clientY - svg.top + 12,
    });
  };

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="nepal-map-svg w-full h-auto block"
      >
        {/* Decorative backdrop */}
        <defs>
          <pattern id="gridp" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 L0 0 0 20" fill="none" stroke="#c9b99a" strokeOpacity="0.18" strokeWidth="0.5" />
          </pattern>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#gridp)" />

        {/* Province shadow layer (drawn first, large offset for depth) */}
        <g transform="translate(4,6)" opacity="0.22">
          {provincePaths.map((p) => (
            <path key={"sh-" + p.code} d={p.d} fill="#1a1410" />
          ))}
        </g>

        {/* District fills - colored by province */}
        <g>
          {districtPaths.map((p) => {
            const info = provinceOf(p.province);
            const isSelected = selected === p.name;
            const isHover = hover?.name === p.name;
            const fill = isSelected ? "#1a1410" : isHover ? info.hover : info.color;
            return (
              <path
                key={p.name}
                d={p.d}
                className="district-path"
                fill={fill}
                stroke="#3d2f20"
                strokeWidth={isSelected ? 1.6 : 0.5}
                strokeLinejoin="round"
                onMouseEnter={(e) => handleMove(e, p.name, p.province)}
                onMouseMove={(e) => handleMove(e, p.name, p.province)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(p.name)}
              >
                <title>{p.name} — Province {p.province} ({provinceOf(p.province).name})</title>
              </path>
            );
          })}
        </g>

        {/* Province borders on top — thick, with contrasting colour */}
        <g className="province-path">
          {provincePaths.map((p) => (
            <path
              key={"pv-" + p.code}
              d={p.d}
              fill="none"
              stroke="#1a1410"
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* Capitals */}
        <g>
          {capitals.map((c) => (
            <g key={c.name}>
              {c.star ? (
                <>
                  <circle cx={c.x} cy={c.y} r={5} fill="#1a1410" />
                  <circle cx={c.x} cy={c.y} r={2.5} fill="#ffd166" />
                </>
              ) : (
                <circle cx={c.x} cy={c.y} r={3} fill="#1a1410" stroke="#f4ede1" strokeWidth={1} />
              )}
              <text
                x={c.x + 7}
                y={c.y + 3}
                className="font-mono"
                fontSize="10"
                fill="#1a1410"
                style={{ paintOrder: "stroke", stroke: "#f4ede1", strokeWidth: 3 }}
              >
                {c.name}
              </text>
            </g>
          ))}
        </g>

        {/* Province labels */}
        <g>
          {labelPoints.map((l) => {
            const info = PROVINCES[l.code];
            if (!info) return null;
            return (
              <text
                key={"lp-" + l.code}
                x={l.x}
                y={l.y}
                textAnchor="middle"
                className="font-display uppercase"
                fontSize="14"
                fontWeight={700}
                letterSpacing="2"
                fill="#1a1410"
                opacity="0.55"
                style={{ paintOrder: "stroke", stroke: "#f4ede1", strokeWidth: 3 }}
              >
                {info.name}
              </text>
            );
          })}
        </g>

        {/* Compass */}
        <g transform={`translate(${width - 60}, 50)`}>
          <circle r="22" fill="#f4ede1" stroke="#1a1410" strokeWidth="1" />
          <path d="M0,-16 L4,0 L0,16 L-4,0 Z" fill="#c0392b" />
          <text y="-24" textAnchor="middle" fontSize="10" className="font-mono" fill="#1a1410">N</text>
        </g>
      </svg>

      {hover && (
        <div
          className="map-tooltip absolute pointer-events-none bg-[#1a1410] text-[#f4ede1] px-3 py-2 rounded shadow-lg text-sm z-10 max-w-[220px]"
          style={{ left: hover.x, top: hover.y }}
        >
          <div className="font-display text-base leading-tight">{hover.name}</div>
          <div className="font-mono text-[10px] opacity-70">
            Province {hover.province} · {provinceOf(hover.province).name}
          </div>
          <div className="text-[10px] opacity-60 mt-1">click to view weather →</div>
        </div>
      )}
    </div>
  );
}
