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
- Menu, phone, footer links, buttons, rating badge links: `src/_data/site.json`
- Review counts/ratings are NOT typed in: `src/_data/reviews.js` fetches them at build time (last-known fallback in `src/_data/reviews-fallback.json`). A daily GitHub Actions rebuild (`docs/rebuild-preview.workflow.yml.txt` - copy to `.github/workflows/` to enable) keeps the preview current. Optional: add a repo secret `GOOGLE_PLACES_API_KEY` to also show a live Google rating badge.
- Photos, videos and PDFs: `src/media/`
- Form questions (copied from the old site): `src/_data/gforms.json`
- Colors/fonts: `src/assets/css/site.css`

## Run it on your computer
`npm install` then `npm start` (opens a live preview), `npm run build` (makes the `_site` folder).

## Forms and the wedding calculator
Forms (tours, contact, open dates, quotes, taste-test RSVP, careers, and the calculator’s Share Quote) POST to the Cloudflare Worker in `form_endpoint` (`src/_data/site.json`), currently `https://celebrations-forms.couleewebco.workers.dev`. The in-page wedding cost calculator lives in `src/assets/calculator/` and is included on the calculator page. Do not point `form_endpoint` at Formsubmit or another third-party form service unless you intend to replace the Worker.

## Before going live (launch flip)
Keep `"noindex": true` in `src/_data/site.json` (or "Hide from Google" checked in Site Settings) until the moment of cutover so this preview stays out of Google.

When the site is ready to replace celebrationslacrosse.com:

1. Set `"noindex": false` (or untick "Hide from Google") so `robots.txt` allows crawlers and the sitemap can be listed. Rebuild after this change.
2. Build and host with `PATH_PREFIX` unset (see Cloudflare Pages notes below). Leave the prefix set only for the GitHub Pages preview at `/celebrations-preview/`.
3. Outside this repo, confirm before DNS cutover: the form Worker allows `https://celebrationslacrosse.com` (and `www`) in CORS; Resend is verified for the live from-address; and mail goes to the client inbox (not the test address). Those DNS, Resend, and Worker changes are not made in this repository.

## Hosting
- **Preview** (now): GitHub Pages from the `gh-pages` branch (built copy of the site), hidden from Google. To make the preview rebuild automatically after edits, copy `docs/github-pages-workflow.yml.txt` to `.github/workflows/pages.yml` (needs a GitHub login with workflow permission), then set Pages source to *GitHub Actions*. Cloudflare Pages (below) rebuilds automatically with no extra setup.
- **Live site** (free Cloudflare Pages, in the client's account): Create project → *Connect to Git* → pick this repo → Build command `npx @11ty/eleventy` → Output folder `_site` → leave `PATH_PREFIX` unset. Then, in `src/_data/site.json`, set `"noindex": false` (or untick "Hide from Google" in Site Settings) so Google can list the new site. Old duplicate web addresses redirect through `src/_redirects`.
