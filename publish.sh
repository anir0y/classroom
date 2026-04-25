#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Removing broken PaperMod directory..."
rm -rf themes/PaperMod

echo "==> Adding PaperMod as a proper git submodule..."
git submodule add --force https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod

echo "==> Staging all changes..."
git add -A

echo "==> Committing..."
git commit -m "feat: migrate from Blowfish to PaperMod theme

- Switch theme to PaperMod in hugo.toml
- Rewrite params.toml for PaperMod (homeInfo, socialIcons, search, cover)
- Rewrite menus.en.toml with PaperMod url format + search page
- Simplify languages.en.toml (remove Blowfish-specific author map)
- Rewrite single.html for PaperMod partials + ad slots
- Add cover.html override: fallback featureimage -> cover.image
- Add extend_head.html: deferred AdSense, SWG, structured data
- Add extend_footer.html: Buy Me a Coffee widget
- Fix schema.html: author string instead of Blowfish author map
- Add search page (content/search.md)
- Register PaperMod as git submodule"

echo "==> Pushing to master..."
git push origin master

echo ""
echo "Done! GitHub Actions will now build and deploy your site."
echo "Watch progress at: https://github.com/anir0y/classroom/actions"
echo ""
echo "==> Cleaning up this script..."
rm -f "$0"
