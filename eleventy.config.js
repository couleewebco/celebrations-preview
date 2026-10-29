// Celebrations on the River – Eleventy config. Plain HTML/CSS/JS output, no client framework.
import fs from "node:fs";
import path from "node:path";

const PREFIX = (process.env.PATH_PREFIX || "/").replace(/\/?$/, "/");   // "/celebrations-preview/" on GitHub Pages, "/" on Cloudflare
const prefixNoSlash = PREFIX === "/" ? "" : PREFIX.slice(0, -1);

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/media": "media" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

  eleventyConfig.amendLibrary("md", (md) => md.set({ html: true, linkify: true, typographer: false }));

  eleventyConfig.addCollection("storyList", (api) =>
    api.getFilteredByGlob("src/content/stories/*.md").sort((a, b) => b.date - a.date));
  eleventyConfig.addCollection("blogList", (api) =>
    api.getFilteredByGlob("src/content/blog/*.md").sort((a, b) => b.date - a.date));
  eleventyConfig.addCollection("pdfList", () => []);

  eleventyConfig.addFilter("firstImg", (raw) => {
    const m = /!\[[^\]]*\]\((\/media\/[^)\s]+)\)/.exec(raw || "");
    return m ? m[1] : "";
  });
  eleventyConfig.addFilter("thumb", (src) => {
    if (!src || !/\.jpe?g$/i.test(src)) return src;
    const t = "src/media/_t/" + src.replace(/^\/media\//, "");
    return fs.existsSync(t) ? src.replace("/media/", "/media/_t/") : src;
  });
  eleventyConfig.addFilter("readableDate", (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "");
  eleventyConfig.addFilter("pdfTitle", (f) => f.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim());
  eleventyConfig.addFilter("youtubeId", (v) => v);

  eleventyConfig.addGlobalData("env", () => ({ prefix: PREFIX }));
  eleventyConfig.addGlobalData("pdfs", () => {
    const out = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.pdf$/i.test(e.name)) out.push({ url: "/" + path.relative("src", p).split(path.sep).join("/"), file: e.name, size: fs.statSync(p).size });
      }
    };
    if (fs.existsSync("src/media")) walk("src/media");
    return out.sort((a, b) => a.file.localeCompare(b.file));
  });

  // ---- HTML post-processing --------------------------------------------------------------
  eleventyConfig.addTransform("enhance", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    let h = content;
    const inputPath = this.page.inputPath || "";

    // 1. FAQ accordion (page: wedding-faqs) – h5 questions become <details>
    if (inputPath.includes("wedding-faqs")) {
      h = h.replace(/(<h5[^>]*>)([\s\S]*?)(<\/h5>)([\s\S]*?)(?=<h[1-6][\s>]|<\/article>)/g,
        (m, a, q, b, ans) => `<details class="faq-item"><summary>${q}</summary><div class="faq-a">${ans}</div></details>\n`);
    }
    // 2. review runs (blockquote + "— name") become a scrolling slider
    h = h.replace(/(?:<blockquote>[\s\S]*?<\/blockquote>\s*<p>—[\s\S]*?<\/p>\s*){2,}/g, (run) => {
      const items = run.replace(/(<blockquote>[\s\S]*?<\/blockquote>\s*<p>—[\s\S]*?<\/p>)\s*/g, '<div class="review">$1</div>');
      return `<div class="reviews" role="region" aria-label="Reviews">${items}</div>`;
    });
    // 3. runs of 3+ image-only paragraphs become a gallery grid
    h = h.replace(/(?:<p>\s*<img [^>]*>\s*<\/p>\s*){3,}/g, (run) =>
      `<div class="gallery">${run.replace(/<\/?p>/g, "")}</div>`);
    // 4. thumbs + lazy loading
    h = h.replace(/<img ([^>]*?)src="(\/media\/[^"]+\.jpe?g)"([^>]*)>/gi, (m, pre, src, post) => {
      const t = "src/media/_t/" + src.replace(/^\/media\//, "");
      const hasSet = /srcset=/.test(m);
      let extra = "";
      if (!hasSet && fs.existsSync(t)) {
        extra = ` srcset="${src.replace("/media/", "/media/_t/")} 640w, ${src} 1800w" sizes="(min-width:900px) 380px, 90vw"`;
      }
      const lazy = /loading=/.test(m) ? "" : ' loading="lazy" decoding="async"';
      return `<img ${pre}src="${src}"${post}${extra}${lazy}>`;
    });
    h = h.replace(/<img ((?:(?!loading=)[^>])*?)>/gi, (m, a) => /loading=/.test(m) ? m : `<img ${a} loading="lazy" decoding="async">`);
    // 5. path prefix for GitHub Pages sub-path hosting
    if (prefixNoSlash) {
      h = h.replace(/(\s(?:href|src|poster|action|data-src|data-full|data-poster)=")\/(?!\/)/g, `$1${prefixNoSlash}/`);
      h = h.replace(/(\ssrcset=")([^"]+)"/g, (m, a, v) =>
        a + v.split(",").map((s) => s.trim().replace(/^\/(?!\/)/, prefixNoSlash + "/")).join(", ") + '"');
      h = h.replace(/(url\(["']?)\/(?!\/)/g, `$1${prefixNoSlash}/`);
      h = h.replace(/(data-base=")[^"]*"/, `$1${prefixNoSlash}"`);
    }
    return h;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
    pathPrefix: PREFIX,
  };
}
