export const SITE_URL = "https://himali-weather.vercel.app";
export const SITE_NAME = "Himali Weather";
export const DEFAULT_TITLE =
  "Nepal Weather by District | Live Forecast for 77 Districts | Himali Weather";
export const DEFAULT_DESCRIPTION =
  "Explore live Nepal weather by district with Himali Weather. Check temperature, humidity, wind, sunrise, sunset, and a 7-day forecast for all 77 districts of Nepal.";
export const OG_IMAGE_URL = `${SITE_URL}/og-cover.svg`;

export const HOME_FAQS = [
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
  return `${name} Weather Forecast, Temperature and 7-Day Outlook | Himali Weather`;
}

export function districtDescription(name: string, province: string) {
  return `Live weather in ${name}, ${province} Province, Nepal. Check temperature, humidity, wind, sunrise, sunset, and a 7-day forecast on Himali Weather.`;
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
