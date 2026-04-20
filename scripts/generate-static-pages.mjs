import fs from "node:fs";
import path from "node:path";

const siteUrl = "https://himali-weather.vercel.app";
const siteName = "Himali Weather";
const defaultTitle = "Himali Weather | Nepal Weather Map, District Forecasts and 7-Day Outlook";
const defaultDescription =
  "Himali Weather is an interactive Nepal weather website with a district map, district search, live temperature, feels-like data, humidity, wind, sunrise, sunset, hourly conditions, and 7-day forecasts for all 77 districts of Nepal.";
const provinceNames = {
  "1": "Koshi",
  "2": "Madhesh",
  "3": "Bagmati",
  "4": "Gandaki",
  "5": "Lumbini",
  "6": "Karnali",
  "7": "Sudurpashchim",
};
const homeFaqs = [
  {
    question: "Does Himali Weather cover all 77 districts of Nepal?",
    answer:
      "Yes. Himali Weather lets you explore weather for all 77 districts of Nepal through an interactive map, district links, and a live forecast panel.",
  },
  {
    question: "What details can I check on Himali Weather?",
    answer:
      "Each district page shows temperature, feels-like temperature, humidity, wind, precipitation, elevation, UV, sunrise, sunset, hourly conditions, and a 7-day outlook.",
  },
  {
    question: "Why do districts in Nepal have different weather on the same day?",
    answer:
      "Nepal has big elevation and terrain differences, so conditions can change a lot between the Terai, hill districts, valleys, and high Himalayan regions.",
  },
];

const rootDir = process.cwd();
const geoJsonPath = path.join(rootDir, "public", "data", "districts.geojson");
const distDir = path.join(rootDir, "dist");
const distIndexPath = path.join(distDir, "index.html");

function slugifyDistrict(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function districtTitle(name) {
  return `${name} Weather in Nepal | Live Forecast and 7-Day Outlook | Himali Weather`;
}

function districtDescription(name, province) {
  return `Check ${name} weather in ${province} Province, Nepal on Himali Weather. View live temperature, feels-like conditions, humidity, wind, sunrise, sunset, hourly updates, and a 7-day forecast.`;
}

function renderPage(template, page) {
  return template
    .replaceAll("__SEO_TITLE__", escapeHtml(page.title))
    .replaceAll("__SEO_DESCRIPTION__", escapeHtml(page.description))
    .replaceAll("__SEO_CANONICAL__", escapeHtml(page.canonical))
    .replaceAll("__SEO_SCHEMA__", safeJson(page.schema))
    .replaceAll("__SEO_NOSCRIPT__", escapeHtml(page.noscript));
}

function homeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        alternateName: "Himali",
        url: siteUrl,
        logo: `${siteUrl}/favicon.svg`,
        description: defaultDescription,
      },
      {
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        inLanguage: "en",
        description: defaultDescription,
      },
      {
        "@type": "CollectionPage",
        name: "Nepal district weather forecast",
        url: `${siteUrl}/`,
        description: defaultDescription,
        about: {
          "@type": "Country",
          name: "Nepal",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: homeFaqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

function districtSchema(name, province, canonical) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        alternateName: "Himali",
        url: siteUrl,
        logo: `${siteUrl}/favicon.svg`,
        description: defaultDescription,
      },
      {
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        inLanguage: "en",
        description: defaultDescription,
      },
      {
        "@type": "WebPage",
        name: `${name} weather forecast`,
        url: canonical,
        description: districtDescription(name, province),
        isPartOf: {
          "@type": "WebSite",
          name: siteName,
          url: siteUrl,
        },
        about: {
          "@type": "Place",
          name: `${name}, Nepal`,
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: `${province} Province, Nepal`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Nepal weather",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${name} weather`,
            item: canonical,
          },
        ],
      },
    ],
  };
}

if (!fs.existsSync(distIndexPath)) {
  throw new Error(`Could not find built index.html at ${distIndexPath}`);
}

const template = fs.readFileSync(distIndexPath, "utf8");
const geoJson = JSON.parse(fs.readFileSync(geoJsonPath, "utf8"));
const districtRows = [...new Map(
  geoJson.features.map((feature) => [
    String(feature.properties.DIST_EN),
    {
      name: String(feature.properties.DIST_EN),
      provinceCode: String(feature.properties.ADM1_EN),
    },
  ]),
).values()].sort((a, b) => a.name.localeCompare(b.name));

  const homePage = renderPage(template, {
  title: defaultTitle,
  description: defaultDescription,
  canonical: `${siteUrl}/`,
  schema: homeSchema(),
  noscript:
    "Browse district weather across Nepal on Himali Weather. Enable JavaScript to use the interactive map, district search, live weather panel, and 7-day forecast view.",
});
fs.writeFileSync(distIndexPath, homePage, "utf8");

for (const district of districtRows) {
  const province = provinceNames[district.provinceCode] ?? `Province ${district.provinceCode}`;
  const slug = slugifyDistrict(district.name);
  const canonical = `${siteUrl}/district/${slug}`;
  const pageHtml = renderPage(template, {
    title: districtTitle(district.name),
    description: districtDescription(district.name, province),
    canonical,
    schema: districtSchema(district.name, province, canonical),
    noscript: `Check ${district.name} weather in ${province} Province, Nepal on Himali Weather. Enable JavaScript to use the interactive district map, live weather panel, and forecast widgets.`,
  });

  const districtDir = path.join(distDir, "district", slug);
  fs.mkdirSync(districtDir, { recursive: true });
  fs.writeFileSync(path.join(districtDir, "index.html"), pageHtml, "utf8");
}

console.log(`Generated ${districtRows.length} static district pages in ${path.join(distDir, "district")}`);
