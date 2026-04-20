import { useEffect } from "react";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  districtDescription,
  districtPageName,
  districtTitle,
  HOME_FAQS,
  OG_IMAGE_URL,
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
    const title = district ? districtTitle(district.name) : DEFAULT_TITLE;
    const description = district ? districtDescription(district.name, district.province) : DEFAULT_DESCRIPTION;
    const canonical = district ? districtUrl(district.name) : `${SITE_URL}/`;
    const pageName = district ? districtPageName(district.name) : "Nepal district weather forecast";

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
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, OG_IMAGE_URL);
    upsertMeta(
      'meta[property="og:image:alt"]',
      { property: "og:image:alt" },
      "Himali Weather preview showing Nepal district weather forecasts",
    );
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, OG_IMAGE_URL);
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonical });

    upsertJsonLd("structured-data", {
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
        ...(district
          ? [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Nepal weather",
                    item: `${SITE_URL}/`,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: `${district.name} weather`,
                    item: canonical,
                  },
                ],
              },
            ]
          : [
              {
                "@type": "FAQPage",
                mainEntity: HOME_FAQS.map((item) => ({
                  "@type": "Question",
                  name: item.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: item.answer,
                  },
                })),
              },
            ]),
      ],
    });
  }, [district]);

  return null;
}
