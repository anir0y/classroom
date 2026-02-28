# Blog Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate classroom.anir0y.in from Dream theme to PaperMod, add 3-slot AdSense placement, fix SEO metadata across 148 posts, and add engagement features (Utterances, Related Posts) to maximize ad revenue.

**Architecture:** Hugo static site with PaperMod theme. Ads managed via Hugo partials (not hardcoded in markdown). SEO metadata fixed via bulk scripts. Engagement via Utterances comments + PaperMod native features (TOC, Related Posts, Search, Archives).

**Tech Stack:** Hugo (latest), PaperMod theme, Google AdSense (ca-pub-3526678290068011), GA4 (G-SPD6BXK0P5), Microsoft Clarity, Utterances, GitHub Pages deployment.

---

## Phase 1: Theme Migration (Dream → PaperMod)

### Task 1: Install PaperMod Theme

**Files:**
- Remove: `themes/dream/` (entire directory)
- Create: `themes/PaperMod/` (via git submodule)

**Step 1: Remove old Dream theme directory**

```bash
rm -rf themes/dream
```

**Step 2: Add PaperMod as git submodule**

```bash
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

**Step 3: Verify submodule installed correctly**

```bash
ls themes/PaperMod/layouts/_default/
```
Expected: `baseof.html`, `list.html`, `single.html`, etc.

**Step 4: Create `.gitmodules` if not auto-created**

Verify file exists at project root:
```bash
cat .gitmodules
```
Expected: Entry for `themes/PaperMod` with URL.

**Step 5: Commit**

```bash
git add .gitmodules themes/PaperMod
git rm -r --cached themes/dream 2>/dev/null || true
git commit -m "chore: replace Dream theme with PaperMod submodule"
```

---

### Task 2: Rewrite config.toml for PaperMod

**Files:**
- Modify: `config.toml` (complete rewrite)

**Step 1: Back up existing config**

```bash
cp config.toml config.toml.bak
```

**Step 2: Write new PaperMod config**

Replace `config.toml` with:

```toml
baseURL = "https://classroom.anir0y.in"
languageCode = "en"
title = "Classroom"
theme = "PaperMod"
copyright = "YOU CAN REUSE MY CONTENT"

enableRobotsTXT = true
buildDrafts = false
buildFuture = false
buildExpired = false

paginate = 10

[minify]
  disableXML = true
  minifyOutput = true

[outputs]
  home = ["HTML", "RSS", "JSON"]

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
  [markup.highlight]
    noClasses = false

[params]
  env = "production"
  title = "Classroom"
  description = "Cybersecurity blog by Animesh Roy — CTF walkthroughs, malware analysis, penetration testing, and security research."
  keywords = ["cybersecurity", "tryhackme", "ctf", "malware analysis", "penetration testing", "red teaming"]
  author = "Animesh Roy"

  DateFormat = "January 2, 2006"
  defaultTheme = "auto"
  disableThemeToggle = false
  ShowReadingTime = true
  ShowShareButtons = true
  ShowPostNavLinks = true
  ShowBreadCrumbs = true
  ShowCodeCopyButtons = true
  ShowWordCount = false
  ShowRssButtonInSectionTermList = true
  UseHugoToc = true
  disableSpecial1stPost = false
  disableScrollToTop = false
  hidemeta = false
  hideSummary = false
  showtoc = true
  tocopen = false

  [params.assets]
    favicon = "/img/avatar.jpeg"
    favicon16x16 = "/img/avatar.jpeg"
    favicon32x32 = "/img/avatar.jpeg"
    apple_touch_icon = "/img/avatar.jpeg"

  [params.label]
    text = "Classroom"
    icon = "/img/avatar.jpeg"
    iconHeight = 35

  [params.profileMode]
    enabled = false

  [params.homeInfoParams]
    Title = "Animesh Roy's Classroom"
    Content = "Cybersecurity expertise — CTF walkthroughs, malware analysis, penetration testing, and security research."

  [[params.socialIcons]]
    name = "twitter"
    url = "https://twitter.com/anir0y"

  [[params.socialIcons]]
    name = "github"
    url = "https://github.com/anir0y"

  [[params.socialIcons]]
    name = "linkedin"
    url = "https://linkedin.com/in/anir0y"

  [[params.socialIcons]]
    name = "instagram"
    url = "https://instagram.com/0xanir0y"

  [[params.socialIcons]]
    name = "rss"
    url = "index.xml"

  [params.cover]
    hidden = false
    hiddenInList = false
    hiddenInSingle = false

  [params.editPost]
    URL = "https://github.com/anir0y/classroom/tree/master/content"
    Text = "Suggest Changes"
    appendFilePath = true

  [params.fuseOpts]
    isCaseSensitive = false
    shouldSort = true
    location = 0
    distance = 1000
    threshold = 0.4
    minMatchCharLength = 0
    keys = ["title", "permalink", "summary", "content"]

[[menu.main]]
  identifier = "posts"
  name = "Posts"
  url = "/post/"
  weight = 1

[[menu.main]]
  identifier = "categories"
  name = "Categories"
  url = "/categories/"
  weight = 2

[[menu.main]]
  identifier = "tags"
  name = "Tags"
  url = "/tags/"
  weight = 3

[[menu.main]]
  identifier = "archives"
  name = "Archives"
  url = "/archives/"
  weight = 4

[[menu.main]]
  identifier = "search"
  name = "Search"
  url = "/search/"
  weight = 5

[[menu.main]]
  identifier = "about"
  name = "About"
  url = "/about/me/"
  weight = 6
```

**Step 3: Verify Hugo builds without errors**

```bash
hugo --minify 2>&1 | head -20
```
Expected: Build succeeds with no template errors.

**Step 4: Commit**

```bash
git add config.toml config.toml.bak
git commit -m "feat: rewrite config.toml for PaperMod theme"
```

---

### Task 3: Remove Old Layout Overrides

**Files:**
- Remove ALL files in: `layouts/` (these are Dream-specific overrides)

The old layouts were customized for the Dream theme (Semantic UI grid, flip containers, etc.). PaperMod's built-in layouts handle everything we need. We'll add back only the custom partials we need (ads, SEO) in later tasks.

**Step 1: Remove old layout files**

```bash
rm -rf layouts/_default/
rm -rf layouts/partials/
rm -rf layouts/posts/
rm -rf layouts/categories/
rm -rf layouts/tags/
rm -f layouts/index.html
rm -f layouts/404.html
rm -rf layouts/_internal/
```

**Step 2: Verify layouts directory is empty**

```bash
ls -la layouts/
```
Expected: Empty or only `.` and `..`

**Step 3: Commit**

```bash
git add -A layouts/
git commit -m "chore: remove Dream-specific layout overrides"
```

---

### Task 4: Create PaperMod Required Pages

**Files:**
- Create: `content/archives.md`
- Create: `content/search.md`

**Step 1: Create archives page**

Write to `content/archives.md`:
```markdown
---
title: "Archives"
layout: "archives"
url: "/archives/"
summary: archives
---
```

**Step 2: Create search page**

Write to `content/search.md`:
```markdown
---
title: "Search"
layout: "search"
url: "/search/"
summary: search
placeholder: "Search posts..."
---
```

**Step 3: Test locally**

```bash
hugo server -D 2>&1 | head -10
```
Expected: Server starts at localhost:1313. Open in browser, verify archives and search work.

**Step 4: Commit**

```bash
git add content/archives.md content/search.md
git commit -m "feat: add archives and search pages for PaperMod"
```

---

### Task 5: Clean Up Old Static Assets

**Files:**
- Remove: `static/css/semantic.min.css`, `static/css/icomoon.css`, `static/css/OverlayScrollbars.min.css`, `static/css/github-markdown.css`, `static/css/site.css`
- Remove: `static/js/` (jQuery, Semantic UI JS, Masonry, html2canvas, OverlayScrollbars, custom scripts)
- Keep: `static/css/custom.css` (will be rewritten)
- Keep: `static/img/` (all images)
- Keep: `CNAME`, `ads.txt`

**Step 1: Remove Dream-specific CSS files**

```bash
rm -f static/css/semantic.min.css static/css/icomoon.css static/css/OverlayScrollbars.min.css static/css/github-markdown.css static/css/site.css
```

**Step 2: Remove Dream-specific JS files**

```bash
rm -rf static/js/
```

**Step 3: Rewrite custom.css for PaperMod**

Replace `static/css/custom.css` with:
```css
/* Custom styles for classroom.anir0y.in */

/* Image sizing for inline images */
img[alt=crisis] { width: 200px; }
img[alt=tmux] { width: 200px; }
img[alt=logo] { width: 200px; }
img[alt=img] { width: 90%; }

.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}

/* Ad slot spacing */
.ad-container {
  margin: 1.5rem 0;
  text-align: center;
  min-height: 100px;
}

/* Buy Me Coffee positioning */
.bmc-container {
  margin: 2rem 0;
  text-align: center;
}
```

**Step 4: Update config to load custom CSS**

Add to `config.toml` under `[params.assets]`:
```toml
  [params.assets]
    # ... existing favicon entries ...
    customCSS = ["css/custom.css"]
```

Note: PaperMod uses `params.assets.customCSS` (array of paths relative to `/static/`). This is different from Dream's `params.advanced.customCSS`.

**Step 5: Verify build**

```bash
hugo --minify 2>&1 | head -10
```
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add -A static/css/ static/js/
git commit -m "chore: remove Dream static assets, rewrite custom.css for PaperMod"
```

---

### Task 6: Test Theme Migration Locally

**Step 1: Start Hugo dev server**

```bash
hugo server -D
```
Expected: Server starts at `http://localhost:1313/`

**Step 2: Manual verification checklist**

Open browser and verify:
- [ ] Homepage loads with post list
- [ ] Dark/light mode toggle works
- [ ] At least 3 different posts render correctly (check code blocks, images, tables)
- [ ] Search page works at `/search/`
- [ ] Archives page works at `/archives/`
- [ ] Categories page works at `/categories/`
- [ ] Tags page works at `/tags/`
- [ ] About page works at `/about/me/`
- [ ] Cover images display on post cards
- [ ] Mobile responsive (resize browser window)
- [ ] TOC appears on posts with headings
- [ ] Reading time shows on posts

**Step 3: Fix any rendering issues**

If posts use Dream-specific shortcodes or CSS classes, they may need adjustment. Most common issue: Semantic UI grid classes in markdown (e.g., `class="ui segment"`) will render as plain text — these are harmless.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve post rendering issues after theme migration"
```

---

## Phase 2: Ad Placement System

### Task 7: Create Ad Partial Templates

**Files:**
- Create: `layouts/partials/ads-top.html`
- Create: `layouts/partials/ads-mid.html`
- Create: `layouts/partials/ads-bottom.html`
- Create: `layouts/partials/ads-head.html`

**Step 1: Create the head-level AdSense loader**

Write to `layouts/partials/ads-head.html`:
```html
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3526678290068011" crossorigin="anonymous"></script>
```

**Step 2: Create top ad partial**

Write to `layouts/partials/ads-top.html`:
```html
<!-- Ad: Below Title -->
<div class="ad-container">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-3526678290068011"
       data-ad-slot="7160066188"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Step 3: Create mid-article ad partial**

Write to `layouts/partials/ads-mid.html`:
```html
<!-- Ad: Mid-Article -->
<div class="ad-container">
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-layout="in-article"
       data-ad-format="fluid"
       data-ad-client="ca-pub-3526678290068011"
       data-ad-slot="7160066188"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Step 4: Create bottom ad partial**

Write to `layouts/partials/ads-bottom.html`:
```html
<!-- Ad: Bottom -->
<div class="ad-container">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-3526678290068011"
       data-ad-slot="7160066188"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

Note: All 3 slots use the same ad slot ID (`7160066188`) for now. The user should create separate ad slots in their AdSense dashboard and update `data-ad-slot` values for better reporting.

**Step 5: Commit**

```bash
git add layouts/partials/ads-*.html
git commit -m "feat: create ad partial templates (top, mid, bottom)"
```

---

### Task 8: Override single.html to Inject Ads

**Files:**
- Create: `layouts/_default/single.html` (overrides PaperMod's single.html)

We need to override PaperMod's single post template to inject our ad partials. The approach:
1. Copy PaperMod's `single.html` as our base
2. Add top ad after post header
3. Add mid-article ad via content splitting (for posts > 500 words)
4. Add bottom ad after content, before comments
5. Add Buy Me a Coffee widget
6. Add Utterances comments

**Step 1: Copy PaperMod's single.html as base**

```bash
mkdir -p layouts/_default
cp themes/PaperMod/layouts/_default/single.html layouts/_default/single.html
```

**Step 2: Modify the copied single.html**

Read the copied file first, then make these modifications:

After the post header section (after `{{- partial "post_meta.html" .}}` or the post header block), insert:
```html
{{- partial "ads-top.html" . -}}
```

Replace the content rendering line. Find where `.Content` is rendered (usually something like `<div class="post-content">{{- .Content -}}</div>`). Replace it with mid-article ad injection:

```html
<div class="post-content">
  {{- if gt .WordCount 500 -}}
    {{- $content := .Content -}}
    {{- $paragraphs := split $content "</p>" -}}
    {{- $insertAfter := 3 -}}
    {{- if lt (len $paragraphs) 6 -}}
      {{- $insertAfter = div (len $paragraphs) 2 -}}
    {{- end -}}
    {{- range $i, $p := $paragraphs -}}
      {{- if $p -}}
        {{ $p | safeHTML }}</p>
        {{- if eq $i $insertAfter -}}
          {{- partial "ads-mid.html" $ -}}
        {{- end -}}
      {{- end -}}
    {{- end -}}
  {{- else -}}
    {{- .Content -}}
  {{- end -}}
</div>
```

After the content div, before any comment sections, insert:
```html
{{- partial "ads-bottom.html" . -}}

<!-- Buy Me a Coffee -->
<div class="bmc-container">
  <script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>
</div>
```

**Step 3: Add Utterances comments section**

After the BMC widget, add:
```html
<!-- Utterances Comments -->
<div class="utterances-container" style="margin-top: 2rem;">
  <script src="https://utteranc.es/client.js"
    repo="anir0y/classroom"
    issue-term="pathname"
    theme="preferred-color-scheme"
    crossorigin="anonymous"
    async>
  </script>
</div>
```

**Step 4: Verify build**

```bash
hugo --minify 2>&1 | head -10
```
Expected: Build succeeds.

**Step 5: Test locally**

```bash
hugo server -D
```
Open a post in browser. Verify:
- [ ] Top ad placeholder appears below title
- [ ] Mid-article ad appears after ~3rd paragraph (on long posts)
- [ ] No mid-article ad on short posts (<500 words)
- [ ] Bottom ad appears after content
- [ ] Buy Me a Coffee widget loads
- [ ] Utterances comments section appears

**Step 6: Commit**

```bash
git add layouts/_default/single.html
git commit -m "feat: override single.html with 3-slot ads, BMC, and Utterances"
```

---

### Task 9: Add AdSense Script to Head

**Files:**
- Create: `layouts/partials/extend_head.html` (PaperMod's extension point for `<head>`)

PaperMod provides `extend_head.html` as a hook to inject content into `<head>` without overriding the entire base template.

**Step 1: Create extend_head.html**

Write to `layouts/partials/extend_head.html`:
```html
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3526678290068011" crossorigin="anonymous"></script>

<!-- Google tag (gtag.js) - GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SPD6BXK0P5"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-SPD6BXK0P5');
</script>

<!-- Microsoft Clarity -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "it10lq8bk1");
</script>

<!-- Preconnect for ad performance -->
<link rel="preconnect" href="https://pagead2.googlesyndication.com" />
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
```

**Step 2: Commit**

```bash
git add layouts/partials/extend_head.html
git commit -m "feat: add AdSense, GA4, and Clarity to head via PaperMod extend_head"
```

---

## Phase 3: Bulk Post Cleanup

### Task 10: Strip Hardcoded Ads from All Posts

**Files:**
- Modify: All 148 files in `content/post/` (remove embedded ad HTML)

The current posts have 3 types of hardcoded ad/widget blocks that need removal:
1. Google AdSense blocks (109 posts)
2. Buy Me a Coffee widget scripts (113 posts)
3. Amazon ad scripts (24 posts)

These are now handled by Hugo partials in `single.html`, so the hardcoded versions must be removed to avoid duplication.

**Step 1: Create cleanup script**

Write to `scripts/strip-ads.sh`:
```bash
#!/bin/bash
# Strip hardcoded ads and widgets from Hugo markdown posts
# Run with: bash scripts/strip-ads.sh [--dry-run]

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo "=== DRY RUN MODE ==="
fi

CONTENT_DIR="content/post"
MODIFIED=0

for file in "$CONTENT_DIR"/*.md; do
  [ -f "$file" ] || continue

  ORIGINAL=$(cat "$file")
  CLEANED="$ORIGINAL"

  # Remove Google AdSense blocks (with surrounding --- separators and comments)
  CLEANED=$(echo "$CLEANED" | perl -0777 -pe 's/\n---\n<!-- Google Ads[^>]*-->.*?<!-- END -->\n//gs')
  CLEANED=$(echo "$CLEANED" | perl -0777 -pe 's/<!-- Google Ads[^>]*-->.*?<!-- END -->\n//gs')

  # Remove Buy Me Coffee widget + EOF comment
  CLEANED=$(echo "$CLEANED" | perl -0777 -pe 's/\n*<script data-name="BMC-Widget"[^>]*><\/script>\n*//gs')
  CLEANED=$(echo "$CLEANED" | perl -0777 -pe 's/\n*<!-- EOF -->\n*//gs')

  # Remove Amazon ads blocks
  CLEANED=$(echo "$CLEANED" | perl -0777 -pe 's/\n*<!-- Ads code-->.*?<\/script>\n*//gs')

  # Remove trailing whitespace and excessive blank lines
  CLEANED=$(echo "$CLEANED" | sed -e :a -e '/^\n*$/{$d;N;ba}')

  if [ "$ORIGINAL" != "$CLEANED" ]; then
    MODIFIED=$((MODIFIED + 1))
    if [ "$DRY_RUN" = true ]; then
      echo "WOULD MODIFY: $file"
    else
      echo "$CLEANED" > "$file"
      echo "MODIFIED: $file"
    fi
  fi
done

echo ""
echo "Total files modified: $MODIFIED"
```

**Step 2: Run in dry-run mode first**

```bash
bash scripts/strip-ads.sh --dry-run
```
Expected: Lists ~120+ files that would be modified. Review the list.

**Step 3: Run for real**

```bash
bash scripts/strip-ads.sh
```

**Step 4: Spot-check 3 modified files**

Read 3 random posts and verify:
- Ad blocks are removed
- Post content is intact
- No broken markdown

**Step 5: Build and verify**

```bash
hugo --minify 2>&1 | head -10
```
Expected: Build succeeds with no errors.

**Step 6: Commit**

```bash
git add content/post/ scripts/strip-ads.sh
git commit -m "feat: strip hardcoded ads from all posts (now template-managed)"
```

---

### Task 11: Fix Typos Across All Posts

**Files:**
- Modify: Multiple files in `content/post/`

**Step 1: Fix "walkthough" → "walkthrough" globally**

```bash
grep -rl "walkthough" content/post/ | xargs sed -i '' 's/walkthough/walkthrough/g'
```

**Step 2: Verify the fix**

```bash
grep -r "walkthough" content/post/ | wc -l
```
Expected: 0

**Step 3: Fix "draft: falser" in traverse.md**

```bash
sed -i '' 's/draft: falser/draft: false/' content/post/traverse.md
```

**Step 4: Fix "wehre" → "where" in traverse.md**

```bash
sed -i '' 's/wehre/where/g' content/post/traverse.md
```

**Step 5: Verify build**

```bash
hugo --minify 2>&1 | head -10
```
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add content/post/
git commit -m "fix: correct typos across posts (walkthrough, draft, where)"
```

---

### Task 12: Update Archetype Template for New Posts

**Files:**
- Modify: `archetypes/default.md`

The archetype defines the template for new posts created with `hugo new`. It should follow PaperMod conventions and NOT include hardcoded ads.

**Step 1: Rewrite archetype**

Replace `archetypes/default.md` with:
```markdown
---
title: {{ replace .TranslationBaseName "-" " " | title }}
date: {{ .Date }}
lastmod: {{ .Date }}
author: Animesh Roy
cover:
  image: /img/thm.gif
  alt: "cover image"
categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
draft: true
description: ""
keywords: []
ShowToc: true
TocOpen: false
---

## Overview

## Task 01

## Summary
```

Note: No hardcoded ads, no BMC widget, no TryHackMe badge scripts. Ads and widgets are injected by the template.

**Step 2: Commit**

```bash
git add archetypes/default.md
git commit -m "feat: update archetype for PaperMod (no hardcoded ads)"
```

---

## Phase 4: SEO Enhancements

### Task 13: Add JSON-LD Structured Data

**Files:**
- Create: `layouts/partials/extend_footer.html`

PaperMod provides `extend_footer.html` as a hook to inject content before `</body>`.

**Step 1: Create extend_footer.html with JSON-LD**

Write to `layouts/partials/extend_footer.html`:
```html
{{- if .IsPage -}}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": {{ .Title | jsonify }},
  "description": {{ with .Description }}{{ . | jsonify }}{{ else }}{{ .Summary | plainify | truncate 160 | jsonify }}{{ end }},
  "author": {
    "@type": "Person",
    "name": {{ with .Params.author }}{{ . | jsonify }}{{ else }}"Animesh Roy"{{ end }},
    "url": "https://classroom.anir0y.in/about/me/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Classroom",
    "logo": {
      "@type": "ImageObject",
      "url": "https://classroom.anir0y.in/img/avatar.jpeg"
    }
  },
  "datePublished": {{ .Date.Format "2006-01-02T15:04:05Z07:00" | jsonify }},
  "dateModified": {{ .Lastmod.Format "2006-01-02T15:04:05Z07:00" | jsonify }},
  {{- with .Params.cover }}
  "image": {{ if .image }}{{ (printf "%s%s" $.Site.BaseURL .image) | jsonify }}{{ else }}"https://classroom.anir0y.in/img/avatar.jpeg"{{ end }},
  {{- else }}
  "image": "https://classroom.anir0y.in/img/avatar.jpeg",
  {{- end }}
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": {{ .Permalink | jsonify }}
  }
}
</script>
{{- end -}}

{{- if .IsHome -}}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Classroom",
  "url": "https://classroom.anir0y.in/",
  "description": "Cybersecurity blog by Animesh Roy",
  "author": {
    "@type": "Person",
    "name": "Animesh Roy"
  }
}
</script>
{{- end -}}
```

**Step 2: Verify structured data renders**

```bash
hugo --minify
grep -l "application/ld+json" public/post/traverse/index.html | head -1
```
Expected: File found (confirms JSON-LD is being injected).

**Step 3: Commit**

```bash
git add layouts/partials/extend_footer.html
git commit -m "feat: add JSON-LD Article schema to all posts"
```

---

### Task 14: Enhance robots.txt

**Files:**
- Create: `layouts/robots.txt` (overrides Hugo's default)

**Step 1: Create custom robots.txt template**

Write to `layouts/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: {{ .Site.BaseURL }}sitemap.xml

# Block crawling of admin/API paths
Disallow: /page/
```

**Step 2: Verify**

```bash
hugo --minify
cat public/robots.txt
```
Expected: Shows the custom robots.txt with sitemap URL.

**Step 3: Commit**

```bash
git add layouts/robots.txt
git commit -m "feat: enhance robots.txt with sitemap and crawl directives"
```

---

### Task 15: Update Post Front Matter (cover image format for PaperMod)

**Files:**
- Modify: All files in `content/post/` that use `cover:` parameter

PaperMod expects cover images in a different format than Dream:
- Dream: `cover: /img/thm.gif`
- PaperMod: `cover:\n  image: /img/thm.gif`

**Step 1: Create migration script**

Write to `scripts/fix-cover-images.sh`:
```bash
#!/bin/bash
# Convert Dream-style cover params to PaperMod format
# Dream:    cover: /img/foo.png
# PaperMod: cover:\n  image: /img/foo.png

CONTENT_DIR="content/post"
MODIFIED=0

for file in "$CONTENT_DIR"/*.md; do
  [ -f "$file" ] || continue

  # Only process files with simple `cover: /path` format (not already nested)
  if grep -qP '^cover: /' "$file"; then
    COVER_PATH=$(grep -oP '^cover: \K.*' "$file")
    sed -i '' "s|^cover: ${COVER_PATH}|cover:\n  image: ${COVER_PATH}\n  alt: \"cover image\"|" "$file"
    MODIFIED=$((MODIFIED + 1))
    echo "MODIFIED: $file"
  fi
done

echo "Total files modified: $MODIFIED"
```

**Step 2: Run**

```bash
bash scripts/fix-cover-images.sh
```

**Step 3: Also handle `simg` parameter**

PaperMod doesn't use `simg`. We can keep it in front matter (Hugo ignores unknown params), or map it to PaperMod's `images` param for Open Graph. For now, leave `simg` as-is — it's harmless.

**Step 4: Verify a post renders with cover image**

```bash
hugo server -D
```
Open a post that had a cover image. Verify it displays.

**Step 5: Commit**

```bash
git add content/post/ scripts/fix-cover-images.sh
git commit -m "feat: convert cover image format to PaperMod structure"
```

---

## Phase 5: Final Integration & Deploy

### Task 16: Update GitHub Actions Workflow

**Files:**
- Modify: `.github/workflows/gh-pages.yml`

The workflow needs `submodules: true` (already set) and may need `extended: true` for PaperMod if using SCSS features.

**Step 1: Read current workflow**

Read `.github/workflows/gh-pages.yml` and verify:
- `submodules: true` is set (needed for PaperMod theme)
- Hugo version is `latest`

**Step 2: Enable extended Hugo (PaperMod may need it)**

Uncomment `extended: true` in the workflow:
```yaml
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'
          extended: true
```

**Step 3: Commit**

```bash
git add .github/workflows/gh-pages.yml
git commit -m "feat: enable extended Hugo in CI for PaperMod compatibility"
```

---

### Task 17: Full Local Verification

**Step 1: Clean build**

```bash
rm -rf public/
hugo --minify
```
Expected: Build succeeds, no errors.

**Step 2: Check build output stats**

```bash
hugo --minify 2>&1 | tail -5
```
Expected: Shows page count (~150+ pages), build time.

**Step 3: Start dev server and verify all pages**

```bash
hugo server
```

Manual verification checklist:
- [ ] Homepage loads with post list and social icons
- [ ] Dark/light mode toggle works
- [ ] Search page works (`/search/`)
- [ ] Archives page works (`/archives/`)
- [ ] Categories and tags pages work
- [ ] Post pages show: TOC, reading time, breadcrumbs, share buttons
- [ ] Ad placeholders render in correct positions (top, mid for long posts, bottom)
- [ ] Buy Me a Coffee widget loads
- [ ] Utterances comments section loads
- [ ] Cover images display on posts
- [ ] Code blocks render with syntax highlighting
- [ ] Mobile responsive layout works
- [ ] About page loads
- [ ] RSS feed works (`/index.xml`)
- [ ] JSON-LD appears in page source
- [ ] No broken images or 404 links on sampled posts

**Step 4: Fix any remaining issues**

Address any problems found during verification.

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup after PaperMod migration"
```

---

### Task 18: Deploy

**Step 1: Push to master**

```bash
git push origin master
```

GitHub Actions will automatically build and deploy to GitHub Pages.

**Step 2: Verify deployment**

Wait 2-3 minutes for GitHub Actions to complete, then verify:
```bash
curl -s -o /dev/null -w "%{http_code}" https://classroom.anir0y.in/
```
Expected: `200`

**Step 3: Verify live site**

Open `https://classroom.anir0y.in/` in browser and run through the same verification checklist from Task 17.

---

## Phase 6: Bulk SEO Metadata Enhancement (Post-Deploy)

### Task 19: Generate Unique Descriptions for THM Posts

**Files:**
- Modify: ~80+ THM walkthrough posts in `content/post/`

This task generates unique, keyword-rich meta descriptions for each TryHackMe walkthrough that currently has the generic template description.

**Step 1: Identify posts with generic descriptions**

```bash
grep -l "Try Hack Me Room.*solved by Animesh Roy" content/post/*.md
```

**Step 2: For each post, read the content and write a unique description**

This is a manual/AI-assisted task. For each post:
1. Read the post title and first few paragraphs
2. Write a unique 150-160 character description that includes:
   - The room name
   - Key topics covered (e.g., "privilege escalation", "SQL injection", "forensics")
   - A call-to-action or value proposition

Example transformations:
- Before: `Try Hack Me Room Kenobi solved by Animesh Roy. this is a walkthrough.`
- After: `TryHackMe Kenobi walkthrough — exploit Samba shares, SSH key enumeration, and Linux privilege escalation via path variable manipulation.`

**Step 3: Update descriptions in bulk**

Use sed or manual editing per post. This is the most time-intensive task and should be done iteratively.

**Step 4: Commit in batches**

```bash
git add content/post/
git commit -m "seo: add unique descriptions to THM walkthrough posts (batch N)"
```

---

### Task 20: Add Alt-Text to Generic Images

**Files:**
- Modify: Posts with `![img](...)` pattern

**Step 1: Find posts with generic alt-text**

```bash
grep -rn '!\[img\](' content/post/ | head -20
```

**Step 2: For each occurrence, replace with descriptive alt-text**

This requires reading each post to understand what the image shows. Example:
- Before: `![img](/img/benign/1.png)`
- After: `![Splunk search results showing benign process analysis](/img/benign/1.png)`

**Step 3: Commit**

```bash
git add content/post/
git commit -m "seo: add descriptive alt-text to images across posts"
```

---

## Summary of All Tasks

| Phase | Task | Description | Estimated Effort |
|-------|------|-------------|-----------------|
| 1 | 1 | Install PaperMod theme | 2 min |
| 1 | 2 | Rewrite config.toml | 5 min |
| 1 | 3 | Remove old layout overrides | 2 min |
| 1 | 4 | Create archives + search pages | 2 min |
| 1 | 5 | Clean up old static assets | 3 min |
| 1 | 6 | Test theme migration locally | 10 min |
| 2 | 7 | Create ad partial templates | 3 min |
| 2 | 8 | Override single.html for ads | 10 min |
| 2 | 9 | Add AdSense/GA4/Clarity to head | 3 min |
| 3 | 10 | Strip hardcoded ads from posts | 5 min |
| 3 | 11 | Fix typos across posts | 2 min |
| 3 | 12 | Update archetype template | 2 min |
| 4 | 13 | Add JSON-LD structured data | 5 min |
| 4 | 14 | Enhance robots.txt | 2 min |
| 4 | 15 | Fix cover image format | 5 min |
| 5 | 16 | Update GitHub Actions | 2 min |
| 5 | 17 | Full local verification | 15 min |
| 5 | 18 | Deploy | 5 min |
| 6 | 19 | Unique descriptions (bulk) | 60+ min |
| 6 | 20 | Alt-text improvements (bulk) | 30+ min |
