export const SITE_URL = "https://himali-weather.vercel.app";
export const SITE_NAME = "Himali Weather";
export const DEFAULT_TITLE =
  "Himali Weather | Nepal Weather Map, District Forecasts and 7-Day Outlook";
export const DEFAULT_DESCRIPTION =
  "Himali Weather is an interactive Nepal weather website with a district map, district search, live temperature, feels-like data, humidity, wind, sunrise, sunset, hourly conditions, and 7-day forecasts for all 77 districts of Nepal.";
export const OG_IMAGE_URL = `${SITE_URL}/og-cover.svg`;

export const HOME_FAQS = [
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
] as const;

export type RoutedDistrict = {
  name: string;
  province: string;
};

export function slugifyDistrict(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function districtPath(name: string) {
  return `/district/${slugifyDistrict(name)}`;
}

export function districtUrl(name: string) {
  return `${SITE_URL}${districtPath(name)}`;
}

export function districtTitle(name: string) {
  return `${name} Weather in Nepal | Live Forecast and 7-Day Outlook | Himali Weather`;
}

export function districtDescription(name: string, province: string) {
  return `Check ${name} weather in ${province} Province, Nepal on Himali Weather. View live temperature, feels-like conditions, humidity, wind, sunrise, sunset, hourly updates, and a 7-day forecast.`;
}

export function districtPageName(name: string) {
  return `${name} weather forecast`;
}

export function matchDistrictFromPath<T extends RoutedDistrict>(
  pathname: string,
  items: T[],
) {
  const match = pathname.match(/^\/district\/([^/]+)\/?$/i);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]).toLowerCase();
  return items.find((item) => slugifyDistrict(item.name) === slug) ?? null;
}
