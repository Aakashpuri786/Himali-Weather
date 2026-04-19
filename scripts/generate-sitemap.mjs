import fs from "node:fs";
import path from "node:path";

const siteUrl = "https://himali-weather.vercel.app";
const rootDir = process.cwd();
const geoJsonPath = path.join(rootDir, "public", "data", "districts.geojson");
const sitemapPath = path.join(rootDir, "public", "sitemap.xml");

function slugifyDistrict(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const geoJson = JSON.parse(fs.readFileSync(geoJsonPath, "utf8"));
const districtNames = [...new Set(geoJson.features.map((feature) => String(feature.properties.DIST_EN)))]
  .sort((a, b) => a.localeCompare(b));

const now = new Date().toISOString();
const urls = ["/", ...districtNames.map((name) => `/district/${slugifyDistrict(name)}`)];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(`${siteUrl}${url}`)}</loc>
    <lastmod>${now}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(sitemapPath, xml, "utf8");
console.log(`Generated sitemap with ${urls.length} URLs at ${sitemapPath}`);
