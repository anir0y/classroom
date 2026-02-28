# Blog Optimization Design: Ad Revenue + SEO + UX

**Date**: 2026-02-28
**Site**: classroom.anir0y.in
**Primary Goal**: Maximize Google AdSense revenue
**Approach**: Theme migration (Dream → PaperMod) + full SEO/ad/UX overhaul

---

## 1. Theme Migration (Dream → PaperMod)

### What
Replace Dream theme (Semantic UI, jQuery, Masonry, flip-card animation — ~1.2MB total payload) with Hugo PaperMod (~50KB).

### Why
- 95% reduction in page weight directly improves Core Web Vitals
- Better Core Web Vitals → better Google ranking → more organic traffic → more ad impressions
- PaperMod provides all current features (dark mode, search, cover images, reading time, share buttons) at a fraction of the weight

### What We Keep
- All 151+ posts (Hugo content is theme-agnostic)
- Custom domain (classroom.anir0y.in), CNAME, GitHub Pages deployment
- Cover images, avatar, branding colors
- Dark/light mode toggle
- Search functionality
- Buy Me a Coffee widget

### What We Lose
- Flip-card homepage animation (replaced by clean list/grid layout)
- Semantic UI component library (not needed — PaperMod's CSS handles everything)
- Custom scrollbar styling (minimal impact)

### Config Changes
- Rewrite `config.toml` for PaperMod's parameter format
- Rewrite layout overrides in `/layouts/` to match PaperMod's template structure
- Remove theme submodule for Dream, add PaperMod

---

## 2. Ad Placement Strategy

### Current State
One ad slot hardcoded in post markdown (via archetype template), placed at end of post only.

### New Approach: 3 Template-Based Ad Slots

| Slot | Location | Format | Rationale |
|------|----------|--------|-----------|
| Top | Below post title, above content | Display (responsive) | High viewability — every visitor sees it |
| Mid-article | After ~3rd paragraph or after TOC | In-article (fluid) | Captures engaged readers mid-scroll |
| Bottom | After content, before comments | Display (responsive) | Captures readers who finish the article |

### Implementation Details
- Ads managed via Hugo partials: `layouts/partials/ads-top.html`, `ads-mid.html`, `ads-bottom.html`
- Remove hardcoded ad `<script>` and `<ins>` tags from all 151+ post markdown files
- Mid-article injection: split `.Content` on `</p>` tags, inject ad partial after Nth paragraph
- Short post guard: skip mid-article ad when word count < 500 (AdSense compliance)
- Add Google Auto-ads script as supplemental (lets Google find additional placements)
- Publisher ID: `ca-pub-3526678290068011`
- Existing slot `7160066188` reused; user creates additional slots in AdSense dashboard

---

## 3. SEO Overhaul

### 3a. Meta & Structured Data
- Re-enable GA4 (`G-NZBEX7RBNF`) in config
- Add JSON-LD `Article` schema to every post (title, author, datePublished, dateModified, image)
- Add `BreadcrumbList` JSON-LD schema
- Enhance `robots.txt` with sitemap reference and crawl directives
- Canonical URLs set correctly (PaperMod handles this)
- Open Graph + Twitter Cards (PaperMod native support)

### 3b. Bulk Post Metadata Fixes (All 151+ Posts)
- Fix typo `"walkthough"` → `"walkthrough"` in all descriptions
- Fix `draft: falser` → `draft: false` in traverse.md
- Fix `"wehre"` → `"where"` in traverse.md
- Generate unique, keyword-rich descriptions for each THM walkthrough (replace generic copy-paste template)
- Add descriptive alt-text to images currently using `![img](...)`
- Add `keywords` field to front matter

### 3c. Internal Linking & Retention
- Enable PaperMod's Related Posts feature
- Add Series support for multi-part walkthroughs
- Breadcrumb navigation
- Cross-link between related categories

---

## 4. UX Improvements

### 4a. Reading Experience
- Table of Contents (TOC) on every post (PaperMod native)
- Estimated reading time (PaperMod native)
- "Back to top" button
- Cleaner typography

### 4b. Engagement
- Utterances comments (GitHub-based, lightweight)
- Social share buttons (PaperMod native)
- Buy Me a Coffee widget (repositioned: after content, before comments)

### 4c. Navigation
- Category/tag pages with post counts
- Archives page (chronological listing)
- Mobile hamburger menu (PaperMod native)

### 4d. Performance
- Remove: jQuery, Semantic UI, Masonry, html2canvas, OverlayScrollbars
- Add: lazy-loading images, preconnect to AdSense CDN
- Hugo `--minify` already enabled

---

## Risks & Checks

| Risk | Mitigation |
|------|------------|
| Posts don't render correctly after theme switch | Test locally with `hugo server` before deploying |
| Existing URLs break (SEO penalty) | Hugo slug generation is theme-independent; URLs won't change |
| AdSense policy violation (too many ads on short posts) | Word count guard skips mid-article ad on posts < 500 words |
| Bulk metadata fixes introduce errors | Script with dry-run mode, review diffs before committing |
| PaperMod doesn't support a needed feature | PaperMod is the most actively maintained Hugo theme; fallback to layout overrides |

---

## Out of Scope
- Content rewriting (only metadata/descriptions are touched, not post body text)
- New post creation
- Domain/hosting changes
- AdSense account configuration (user handles slot creation in AdSense dashboard)
- Custom theme development
