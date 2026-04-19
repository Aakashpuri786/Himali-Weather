import { useEffect } from "react";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  districtUrl,
} from "../lib/site";

type Props = {
  district: {
    name: string;
    province: string;
  } | null;
};

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let element = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.dataset.seoId = id;
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

export default function SeoHead({ district }: Props) {
  useEffect(() => {
    const title = district
      ? `${district.name} Weather Forecast, Temperature and 7-Day Outlook | Himali Weather`
      : DEFAULT_TITLE;
    const description = district
      ? `Live weather in ${district.name}, ${district.province} Province, Nepal. Check temperature, humidity, wind, sunrise, sunset, and a 7-day forecast on Himali Weather.`
      : DEFAULT_DESCRIPTION;
    const canonical = district ? districtUrl(district.name) : `${SITE_URL}/`;
    const pageName = district ? `${district.name} weather forecast` : "Nepal district weather forecast";

    document.title = title;
    document.documentElement.lang = "en";

    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertMeta(
      'meta[name="robots"]',
      { name: "robots" },
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    upsertMeta('meta[property="og:type"]', { property: "og:type" }, "website");
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonical);
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name" }, SITE_NAME);
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, `${SITE_URL}/og-cover.svg`);
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, `${SITE_URL}/og-cover.svg`);
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonical });

    upsertJsonLd("website", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: SITE_NAME,
          alternateName: "Himali",
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.svg`,
          description: DEFAULT_DESCRIPTION,
        },
        {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: "en",
          description: DEFAULT_DESCRIPTION,
        },
        {
          "@type": district ? "WebPage" : "CollectionPage",
          name: pageName,
          url: canonical,
          description,
          isPartOf: {
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
          },
          about: district
            ? {
                "@type": "Place",
                name: `${district.name}, Nepal`,
                containedInPlace: {
                  "@type": "AdministrativeArea",
                  name: `${district.province} Province, Nepal`,
                },
              }
            : {
                "@type": "Country",
                name: "Nepal",
              },
        },
      ],
    });
  }, [district]);

  return null;
}
