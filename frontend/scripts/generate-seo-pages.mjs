import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_SITE_URL,
  getRouteMetadata,
  getSitemapRoutes,
  getStructuredData,
  toAbsoluteUrl,
} from "../src/seo/routeMetadata.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const indexHtmlPath = path.join(distDir, "index.html");
const siteUrl = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
const verificationToken = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim() || "";
const buildDate = new Date().toISOString();

function replaceSeoTokens(template, metadata) {
  const canonicalUrl = `${siteUrl}${metadata.path === "/" ? "" : metadata.path}`;
  const imageUrl = toAbsoluteUrl(metadata.image, siteUrl);
  const structuredData = getStructuredData(metadata.path, siteUrl);

  return template
    .replaceAll("__SEO_TITLE__", escapeHtml(metadata.title))
    .replaceAll("__SEO_DESCRIPTION__", escapeHtml(metadata.description))
    .replaceAll("__SEO_ROBOTS__", escapeHtml(metadata.robots))
    .replaceAll("__SEO_CANONICAL__", escapeHtml(canonicalUrl))
    .replaceAll("__SEO_IMAGE__", escapeHtml(imageUrl))
    .replaceAll("__SEO_IMAGE_ALT__", escapeHtml(metadata.imageAlt))
    .replaceAll(
      "__SEO_GOOGLE_SITE_VERIFICATION__",
      verificationToken
        ? `<meta name="google-site-verification" content="${escapeHtml(verificationToken)}" />`
        : "",
    )
    .replaceAll("__SEO_STRUCTURED_DATA__", buildStructuredDataScripts(structuredData));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function routeToOutputPath(routePath) {
  if (routePath === "/") {
    return indexHtmlPath;
  }

  return path.join(distDir, routePath.slice(1), "index.html");
}

function buildStructuredDataScripts(items) {
  if (!items.length) {
    return "";
  }

  return items
    .map(
      (item) =>
        `<script type="application/ld+json">${escapeScriptJson(JSON.stringify(item))}</script>`,
    )
    .join("\n    ");
}

function escapeScriptJson(value) {
  return value.replaceAll("</script>", "<\\/script>");
}

function buildSitemapXml() {
  const urls = getSitemapRoutes()
    .map((route) => {
      const location = `${siteUrl}${route.path === "/" ? "/" : route.path}`;
      return [
        "  <url>",
        `    <loc>${escapeHtml(location)}</loc>`,
        `    <lastmod>${buildDate}</lastmod>`,
        `    <changefreq>${route.sitemap.changefreq}</changefreq>`,
        `    <priority>${route.sitemap.priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

function buildRobotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /account",
    "Disallow: /account/",
    "Disallow: /auth",
    "Disallow: /auth/",
    "Disallow: /complete-profile",
    "Disallow: /explorer",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

async function main() {
  const template = await readFile(indexHtmlPath, "utf8");
  const routes = [
    "/",
    ...getSitemapRoutes().map((route) => route.path),
    "/explorer",
    "/account",
    "/account/admin/cells",
    "/auth/callback",
    "/complete-profile",
  ];
  const uniqueRoutes = [...new Set(routes)];

  await Promise.all(
    uniqueRoutes.map(async (routePath) => {
      const metadata = getRouteMetadata(routePath);
      const html = replaceSeoTokens(template, metadata);
      const outputPath = routeToOutputPath(routePath);

      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, html, "utf8");
    }),
  );

  await writeFile(path.join(distDir, "sitemap.xml"), buildSitemapXml(), "utf8");
  await writeFile(path.join(distDir, "robots.txt"), buildRobotsTxt(), "utf8");
}

main().catch((error) => {
  console.error("Failed to generate SEO pages.", error);
  process.exitCode = 1;
});
