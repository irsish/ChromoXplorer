export const DEFAULT_SITE_URL = "https://chromoxplorer.org";
export const DEFAULT_IMAGE_PATH = "/android-chrome-512x512.png";
export const DEFAULT_IMAGE_ALT = "ChromoXplorer logo";
export const DEFAULT_SUPPORT_EMAIL = "support@chromoxplorer.com";

const DEFAULT_METADATA = {
  path: "/",
  title: "ChromoXplorer | 3D Genome Visualization Platform",
  description:
    "Explore chromosome territories, chromatin structure, Hi-C compartments, TADs, and genes in an interactive 3D genome visualization platform.",
  robots: "index,follow",
  image: DEFAULT_IMAGE_PATH,
  imageAlt: DEFAULT_IMAGE_ALT,
};

export const ROUTE_METADATA = {
  "/": {
    ...DEFAULT_METADATA,
    sitemap: { changefreq: "weekly", priority: "1.0" },
  },
  "/about": {
    path: "/about",
    title: "About ChromoXplorer | 3D Genome Visualization",
    description:
      "Learn how ChromoXplorer helps researchers explore chromosome territories, A/B compartments, TADs, and gene loci in a unified 3D view.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "monthly", priority: "0.8" },
  },
  "/resources": {
    path: "/resources",
    title: "Genome Resources | ChromoXplorer",
    description:
      "Browse genome browsers, Hi-C tools, databases, and educational resources for studying genome organization and chromatin architecture.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "monthly", priority: "0.7" },
  },
  "/pricing": {
    path: "/pricing",
    title: "Pricing | ChromoXplorer",
    description:
      "Compare ChromoXplorer plans for public 3D genome exploration and researcher workflows with private PDB file loading.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "monthly", priority: "0.7" },
  },
  "/faq": {
    path: "/faq",
    title: "FAQ | ChromoXplorer",
    description:
      "Find answers about ChromoXplorer, supported genomic data formats, account access, pricing, and browser-based 3D genome visualization.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "monthly", priority: "0.7" },
  },
  "/support": {
    path: "/support",
    title: "Support | ChromoXplorer",
    description:
      "Contact the ChromoXplorer team for researcher access, bug reports, data format questions, and support with the 3D genome viewer.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "monthly", priority: "0.6" },
  },
  "/terms": {
    path: "/terms",
    title: "Terms of Service | ChromoXplorer",
    description:
      "Review the terms governing access to ChromoXplorer, including acceptable use, uploaded data, intellectual property, and liability.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "yearly", priority: "0.4" },
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy | ChromoXplorer",
    description:
      "Read how ChromoXplorer collects, uses, stores, and protects account information, browser storage, and optional profile data.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "yearly", priority: "0.4" },
  },
  "/explorer": {
    path: "/explorer",
    title: "3D Genome Explorer | ChromoXplorer",
    description:
      "Launch the ChromoXplorer web app to inspect chromosome territories, compartments, TADs, and genes in an interactive 3D scene.",
    robots: "noindex,nofollow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
  },
  "/account": {
    path: "/account",
    title: "Account | ChromoXplorer",
    description:
      "Manage your ChromoXplorer account, profile details, and researcher settings.",
    robots: "noindex,nofollow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
  },
  "/account/admin/cells": {
    path: "/account/admin/cells",
    title: "Manage Cells | ChromoXplorer",
    description:
      "Admin workspace for managing ChromoXplorer genomic cell datasets.",
    robots: "noindex,nofollow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
  },
  "/auth/callback": {
    path: "/auth/callback",
    title: "Signing In | ChromoXplorer",
    description: "Authentication callback for ChromoXplorer user sessions.",
    robots: "noindex,nofollow,noarchive",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
  },
  "/complete-profile": {
    path: "/complete-profile",
    title: "Complete Profile | ChromoXplorer",
    description:
      "Finish setting up your ChromoXplorer researcher profile.",
    robots: "noindex,nofollow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
  },
  "/credits": {
    path: "/credits",
    title: "Credits | ChromoXplorer",
    description:
      "Meet the Chromonauts — the Temple University student team who designed and built ChromoXplorer across both semesters of the CIS 4396 capstone.",
    robots: "index,follow",
    image: DEFAULT_IMAGE_PATH,
    imageAlt: DEFAULT_IMAGE_ALT,
    sitemap: { changefreq: "yearly", priority: "0.5" },
  },
};

export function normalizePath(pathname = "/") {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function getRouteMetadata(pathname) {
  const path = normalizePath(pathname);
  const metadata = ROUTE_METADATA[path];

  if (metadata) {
    return metadata;
  }

  return {
    ...DEFAULT_METADATA,
    path,
    robots: "noindex,nofollow",
  };
}

export function getSitemapRoutes() {
  return Object.values(ROUTE_METADATA).filter((route) => route.sitemap);
}

export function toAbsoluteUrl(value, siteUrl = DEFAULT_SITE_URL) {
  if (!value) {
    return `${siteUrl}${DEFAULT_IMAGE_PATH}`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export function getStructuredData(pathname, siteUrl = DEFAULT_SITE_URL) {
  const path = normalizePath(pathname);

  if (path === "/") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "ChromoXplorer",
        url: siteUrl,
        logo: toAbsoluteUrl(DEFAULT_IMAGE_PATH, siteUrl),
        email: DEFAULT_SUPPORT_EMAIL,
        sameAs: ["https://github.com/templecapstone2/S26-Project3"],
        description:
          "ChromoXplorer is a 3D genome visualization platform for exploring chromosome territories, chromatin structure, compartments, TADs, and genes in the browser.",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ChromoXplorer",
        url: siteUrl,
        description:
          "Interactive 3D genome viewer for genome architecture, chromatin organization, and Hi-C-driven chromosome visualization.",
      },
    ];
  }

  if (path === "/faq") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is ChromoXplorer?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "ChromoXplorer is a 3D genome visualization platform that renders chromosome structures as interactive three-dimensional scenes so researchers and students can explore genome architecture in the browser.",
            },
          },
          {
            "@type": "Question",
            name: "Who is ChromoXplorer for?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "ChromoXplorer is designed for researchers, bioinformaticians, educators, and students interested in genome architecture, chromatin organization, and gene regulation.",
            },
          },
          {
            "@type": "Question",
            name: "Does ChromoXplorer require any installation?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "No. ChromoXplorer runs entirely in the web browser, so no local software installation is required.",
            },
          },
          {
            "@type": "Question",
            name: "What file format does ChromoXplorer use?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "ChromoXplorer reads PDB files containing three-dimensional chromosome coordinates derived from genome modeling workflows.",
            },
          },
          {
            "@type": "Question",
            name: "What is Hi-C data?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Hi-C is a chromosome conformation capture method that measures physical proximity between genomic loci to help model three-dimensional genome folding.",
            },
          },
          {
            "@type": "Question",
            name: "Can I upload my own data?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Yes. Researcher accounts can upload their own PDB files and visualize them in the browser without storing those files on the server.",
            },
          },
          {
            "@type": "Question",
            name: "Is ChromoXplorer free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Yes. The free tier includes public 3D genome exploration with curated datasets and no account requirement.",
            },
          },
        ],
      },
    ];
  }

  return [];
}
