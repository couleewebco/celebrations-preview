// Review ratings/counts, fetched at BUILD time. Every lookup is best-effort with a short timeout;
// on any failure the last-known value from reviews-fallback.json is used, so a build never breaks.
//   Google    : only if GOOGLE_PLACES_API_KEY is set in the build env (Places API, "rating" + "userRatingCount")
//   The Knot / WeddingWire : public page is read (JSON-LD or visible text); these sites often block
//               automated requests (HTTP 403), in which case the fallback value is used.
// No secrets live in the repo: the key comes from the environment (GitHub Actions secret).
import fs from "node:fs";

const fallback = JSON.parse(fs.readFileSync(new URL("./reviews-fallback.json", import.meta.url), "utf8"));
const PLACE_ID = process.env.GOOGLE_PLACE_ID || "ChIJB89RbHlU-YcR7AMGlAam_6U"; // Celebrations on the River
const UA = "Mozilla/5.0 (compatible; CelebrationsPreviewBuild/1.0)";

const ok = (r, c) => Number.isFinite(r) && r >= 1 && r <= 5 && Number.isInteger(c) && c > 0 && c < 1e6;

async function get(url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(10000), headers: { "user-agent": UA, ...(opts.headers || {}) } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res;
}

async function google() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const res = await get(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount" },
  });
  const j = await res.json();
  const r = { rating: Number(j.rating), count: Number(j.userRatingCount) };
  if (!ok(r.rating, r.count)) throw new Error("bad Google payload");
  return r;
}

async function page(url) {
  const html = await (await get(url)).text();
  let m = /"ratingValue"\s*:\s*"?([\d.]+)"?[^}]*?"(?:reviewCount|ratingCount)"\s*:\s*"?(\d+)"?/.exec(html)
       || /"(?:reviewCount|ratingCount)"\s*:\s*"?(\d+)"?[^}]*?"ratingValue"\s*:\s*"?([\d.]+)"?/.exec(html);
  if (m) {
    const [a, b] = /ratingValue"\s*:\s*"?[\d.]+"?[^}]*?(?:reviewCount|ratingCount)/.test(m[0]) ? [m[1], m[2]] : [m[2], m[1]];
    return { rating: Number(a), count: Number(b) };
  }
  m = /([\d.]+) out of 5 stars? and (\d+) reviews/i.exec(html);
  if (m) return { rating: Number(m[1]), count: Number(m[2]) };
  throw new Error("no rating found");
}

async function resolve(name, fn) {
  try {
    const r = await fn();
    if (r && ok(r.rating, r.count)) return { ...r, rating: Math.round(r.rating * 10) / 10, source: "live" };
    if (r) throw new Error("implausible values");
  } catch (e) {
    if (name !== "google" || process.env.GOOGLE_PLACES_API_KEY) console.warn(`[reviews] ${name}: using fallback (${e.message})`);
  }
  return fallback[name] ? { ...fallback[name], source: "fallback" } : null;
}

export default async function () {
  const [g, knot, ww] = await Promise.all([
    resolve("google", google),
    resolve("theknot", () => page("https://www.theknot.com/marketplace/celebrations-on-the-river-la-crosse-wi-1062319")),
    resolve("weddingwire", () => page("https://www.weddingwire.com/biz/celebrations-on-the-river-la-crosse/83a8f9c8dc54595d.html")),
  ]);
  const out = {
    google: process.env.GOOGLE_PLACES_API_KEY ? g : null, // shown only when a live Google value exists
    theknot: knot,
    weddingwire: ww,
  };
  if (out.google && out.google.source !== "live") out.google = null;
  console.log("[reviews]", JSON.stringify(out));
  return out;
}
