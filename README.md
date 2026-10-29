# Celebrations on the River – website

A plain, fast static site built with **Eleventy**. All text lives in simple Markdown files, and all photos/videos/PDFs are normal files, so it can be edited **for free, with no AI**.

## Edit it in your browser (free, easiest)
1. Go to **https://app.pagescms.org** and click **Sign in with GitHub**.
2. Choose this repository (`celebrations-preview`, later the real one).
3. Pick **Pages**, **Past Weddings**, **Wedding Ideas Blog** or **Site Settings** (phone, menu, footer, buttons).
4. Click a page, change the words or click an image/video box to swap it (upload a new photo or choose one already there), then press **Save**.
5. Saving makes a small commit; the site rebuilds by itself and is live in about 1–2 minutes.

Tips: make photos ≤ 2000px wide JPEGs (big files slow the site). Videos should be `.mp4`. Never change the "permalink" line of an existing page (that is its web address).

## Edit with files (also free)
- Pages: `src/content/pages/*.md` · Past weddings: `src/content/stories/` · Blog: `src/content/blog/`
- Top of each file (between the `---` lines) = title, search description, banner photo/video, videos. Below = the page text in Markdown.
- Menu, phone, footer links, buttons, ratings: `src/_data/site.json`
- Photos, videos and PDFs: `src/media/`
- Form questions (copied from the old site): `src/_data/gforms.json`
- Colors/fonts: `src/assets/css/site.css`

## Run it on your computer
`npm install` then `npm start` (opens a live preview), `npm run build` (makes the `_site` folder).

## Making the forms deliver email (needs a free form service)
The forms are real, but they need an address to send to. Create a free form at Formspree (formspree.io) or Web3Forms, paste its URL into **Site Settings → "Form delivery address"** (`form_endpoint` in `site.json`). Until then forms show the phone/email and a link to the old website's form.
The Wedding Cost Calculator and the tour-booking calendar still use the old/original tools (linked/embedded).

## Hosting
- **Preview** (now): GitHub Pages, hidden from Google. Builds automatically using `.github/workflows/pages.yml`.
- **Live site** (free Cloudflare Pages, in the client's account): Create project → *Connect to Git* → pick this repo → Build command `npx @11ty/eleventy` → Output folder `_site` → leave `PATH_PREFIX` unset. Then, in `src/_data/site.json`, set `"noindex": false` (or untick "Hide from Google" in Site Settings) so Google can list the new site. Old duplicate web addresses redirect through `src/_redirects`.
