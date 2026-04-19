export const SITE_URL = "https://himali-weather.vercel.app";
export const SITE_NAME = "Himali Weather";
export const DEFAULT_TITLE =
  "Nepal Weather by District | Live Forecast for 77 Districts | Himali Weather";
export const DEFAULT_DESCRIPTION =
  "Explore live Nepal weather by district with Himali Weather. Check temperature, humidity, wind, sunrise, sunset, and a 7-day forecast for all 77 districts of Nepal.";

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

export function matchDistrictFromPath<T extends RoutedDistrict>(
  pathname: string,
  items: T[],
) {
  const match = pathname.match(/^\/district\/([^/]+)\/?$/i);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]).toLowerCase();
  return items.find((item) => slugifyDistrict(item.name) === slug) ?? null;
}
