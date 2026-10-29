#!/bin/bash
# Builds with the GitHub Pages prefix, checks it, then publishes to gh-pages.
set -e
cd "$(dirname "$0")"
rm -rf _site
PATH_PREFIX=/celebrations-preview/ npx @11ty/eleventy >/dev/null
grep -q 'href="/celebrations-preview/assets/css/site.css' _site/index.html || { echo "ABORT: CSS path missing prefix"; exit 1; }
rm -rf /tmp/gp && cp -r _site /tmp/gp && cd /tmp/gp && touch .nojekyll
git init -q -b gh-pages && git add -A && git -c user.name=megamower22 -c user.email=couleewebco@gmail.com commit -qm deploy
git -c credential.helper= -c credential.helper='!/usr/local/bin/gh auth git-credential' push -qf https://github.com/megamower22/celebrations-preview.git gh-pages
sleep 60
curl -s https://megamower22.github.io/celebrations-preview/ | grep -q '/celebrations-preview/assets/css/site.css' && echo "LIVE OK" || echo "WARN: live check failed"
