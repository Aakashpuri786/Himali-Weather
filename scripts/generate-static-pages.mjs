import fs from "node:fs";
import path from "node:path";

const siteUrl = "https://himali-weather.vercel.app";
const siteName = "Himali Weather";
const defaultTitle = "Nepal Weather by District | Live Forecast for 77 Districts | Himali Weather";
const defaultDescription =
  "Explore live Nepal weather by district with Himali Weather. Check temperature, humidity, wind, sunrise, sunset, and a 7-day forecast for all 77 districts of Nepal.";
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
    question: "Can I check weather for different districts of Nepal?",
    answer:
      "Yes. Himali Weather covers all 77 districts of Nepal with a live weather panel, district map, and a 7-day forecast.",
  },
  {
    question: "What weather details can I see on Himali Weather?",
    answer:
      "You can see temperature, feels-like temperature, humidity, wind speed, precipitation, sunrise, sunset, UV, and hourly plus 7-day outlook data.",
  },
  {
    question: "Why is weather in Kathmandu different from weather in mountain districts?",
    answer:
      "Nepal has major elevation and terrain changes, so weather can be very different between the Terai, hill districts, and Himalayan districts on the same day.",
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
  return `${name} Weather Forecast, Temperature and 7-Day Outlook | Himali Weather`;
}

function districtDescription(name, province) {
  return `Live weather in ${name}, ${province} Province, Nepal. Check temperature, humidity, wind, sunrise, sunset, and a 7-day forecast on Himali Weather.`;
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
    "Browse Nepal weather by district on Himali Weather. Enable JavaScript to load the interactive map, live weather data, and 7-day forecast widgets.",
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
    noscript: `Check live weather in ${district.name}, ${province} Province, Nepal on Himali Weather. Enable JavaScript to load the interactive district map and forecast widgets.`,
  });

  const districtDir = path.join(distDir, "district", slug);
  fs.mkdirSync(districtDir, { recursive: true });
  fs.writeFileSync(path.join(districtDir, "index.html"), pageHtml, "utf8");
}

console.log(`Generated ${districtRows.length} static district pages in ${path.join(distDir, "district")}`);
