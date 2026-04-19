// Lightweight GeoJSON helpers: bbox, centroid, projection.

export type Coord = [number, number];
export type Ring = Coord[];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];

export type Feature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry:
    | { type: "Polygon"; coordinates: Polygon }
    | { type: "MultiPolygon"; coordinates: MultiPolygon };
};

export type FC = { type: "FeatureCollection"; features: Feature[] };

const eachRing = (f: Feature, cb: (ring: Ring) => void) => {
  if (f.geometry.type === "Polygon") {
    for (const r of f.geometry.coordinates) cb(r);
  } else {
    for (const poly of f.geometry.coordinates) for (const r of poly) cb(r);
  }
};

export const featureBBox = (f: Feature) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  eachRing(f, (ring) => {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  });
  return { minX, minY, maxX, maxY };
};

export const fcBBox = (fc: FC) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of fc.features) {
    const b = featureBBox(f);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return { minX, minY, maxX, maxY };
};

// Centroid via signed area of polygon rings (uses largest polygon for MultiPolygon)
const ringCentroid = (ring: Ring) => {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-12) {
    // degenerate - average vertices
    const sx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const sy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return { x: sx, y: sy, area: 0 };
  }
  return { x: cx / (6 * a), y: cy / (6 * a), area: Math.abs(a) };
};

export const featureCentroid = (f: Feature): Coord => {
  let best = { x: 0, y: 0, area: -1 };
  if (f.geometry.type === "Polygon") {
    const c = ringCentroid(f.geometry.coordinates[0]);
    return [c.x, c.y];
  }
  for (const poly of f.geometry.coordinates) {
    const c = ringCentroid(poly[0]);
    if (c.area > best.area) best = c;
  }
  return [best.x, best.y];
};

// Build an SVG path "d" for a feature given a projection
export const featurePath = (
  f: Feature,
  proj: (c: Coord) => [number, number]
) => {
  const ringToPath = (ring: Ring) => {
    let s = "";
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = proj(ring[i]);
      s += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2);
    }
    return s + "Z";
  };
  if (f.geometry.type === "Polygon") {
    return f.geometry.coordinates.map(ringToPath).join(" ");
  }
  return f.geometry.coordinates.map((poly) => poly.map(ringToPath).join(" ")).join(" ");
};

// Equirectangular projection that fits a bbox into width/height
export const makeProjection = (
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  width: number,
  height: number,
  padding = 12
) => {
  const w = width - padding * 2;
  const h = height - padding * 2;
  const midLat = (bbox.minY + bbox.maxY) / 2;
  const lonScale = Math.cos((midLat * Math.PI) / 180);
  const dx = (bbox.maxX - bbox.minX) * lonScale;
  const dy = bbox.maxY - bbox.minY;
  const s = Math.min(w / dx, h / dy);
  const offX = padding + (w - dx * s) / 2;
  const offY = padding + (h - dy * s) / 2;
  return (c: Coord): [number, number] => {
    const x = (c[0] - bbox.minX) * lonScale * s + offX;
    const y = (bbox.maxY - c[1]) * s + offY;
    return [x, y];
  };
};
