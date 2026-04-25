# PaperMod + Pretext Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reapply PaperMod and ship the first Pretext enhancement pass, focused on consistent homepage/list excerpt height and layout without sacrificing the static HTML baseline.

**Architecture:** PaperMod becomes the base Hugo theme, while repo-owned partials and overrides preserve SEO, ads, comments, schema, and publisher integrations. A small repo-owned Pretext runtime is loaded through PaperMod hook partials and only enhances marked excerpt regions after load; the underlying HTML remains the canonical source of truth.

**Tech Stack:** Hugo, TOML config, Go HTML templates, npm, @chenglou/pretext, JavaScript, CSS

---

## Scope Check

The approved spec covers three enhancement surfaces: excerpts, titles, and article body text. This plan intentionally implements **Phase 1 only**:

- PaperMod migration
- preservation of current repo-owned integrations
- Pretext runtime wiring
- excerpt enhancement on homepage/list cards

Follow-up plans should cover title balancing and article-body enhancement separately.

## File Map

- Modify: `.gitmodules` — add the PaperMod submodule entry.
- Create: `themes/PaperMod` — fresh PaperMod theme source.
- Modify: `config/_default/hugo.toml` — activate PaperMod and keep site-wide Hugo settings.
- Modify: `config/_default/params.toml` — translate Blowfish theme settings into PaperMod-compatible params.
- Modify: `config/_default/menus.en.toml` — restore a PaperMod-compatible menu including search.
- Create: `content/search.md` — PaperMod search page route.
- Create: `layouts/partials/extend_head.html` — PaperMod head hook bridge for repo-owned head behavior and schema.
- Create: `layouts/partials/extend_footer.html` — PaperMod footer hook bridge plus Pretext runtime loader.
- Modify: `layouts/_default/single.html` — PaperMod single-post override that preserves ads and comments.
- Create: `assets/css/extended/site-overrides.css` — PaperMod-safe site overrides (TOC + ad wrapper styles).
- Create: `package.json` — repo-owned npm dependency manifest for Pretext.
- Create: `package-lock.json` — lockfile for reproducible installs.
- Create: `assets/js/pretext-targets.js` — shared selector and metric helpers for Pretext enhancement.
- Create: `assets/js/pretext-enhance.js` — runtime entrypoint that enhances excerpt regions.
- Modify: `layouts/_default/list.html` — add stable excerpt markers to homepage/list cards.
- Create: `assets/css/extended/pretext.css` — styles that activate only after excerpt enhancement succeeds.

### Task 1: Add the PaperMod source and search route

**Files:**
- Modify: `.gitmodules`
- Create: `themes/PaperMod`
- Create: `content/search.md`
- Test: `git submodule status`, `test -f content/search.md`

- [ ] **Step 1: Verify the current repo does not already have a PaperMod submodule**

```bash
test -d themes/PaperMod && echo "unexpected: themes/PaperMod already exists" || echo "ok: themes/PaperMod missing"
git config -f .gitmodules --get-regexp '^submodule\..*\.path$'
```

Expected:

- First command prints `ok: themes/PaperMod missing`
- Second command lists only the currently tracked theme paths

- [ ] **Step 2: Add the PaperMod submodule**

```bash
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
git submodule sync --recursive
git submodule update --init --recursive themes/PaperMod
```

- [ ] **Step 3: Create the PaperMod search page**

```markdown
+++
title = "Search"
layout = "search"
summary = "Search the Classroom archive"
+++
```

Save that as `content/search.md`.

- [ ] **Step 4: Verify the task stays green**

```bash
git submodule status -- themes/PaperMod
test -f content/search.md
hugo --cleanDestinationDir --destination "$(mktemp -d)"
```

Expected:

- `git submodule status` prints a resolved commit for `themes/PaperMod`
- `test -f` exits 0
- `hugo` exits 0 because the active theme has not switched yet

- [ ] **Step 5: Commit**

```bash
git add .gitmodules themes/PaperMod content/search.md
git commit -m "chore: add PaperMod source and search page"
```

### Task 2: Switch to PaperMod and restore repo-owned integrations

**Files:**
- Create: `layouts/partials/extend_head.html`
- Create: `layouts/partials/extend_footer.html`
- Modify: `config/_default/hugo.toml`
- Modify: `config/_default/params.toml`
- Modify: `config/_default/menus.en.toml`
- Modify: `layouts/_default/single.html`
- Create: `assets/css/extended/site-overrides.css`
- Test: `hugo --cleanDestinationDir`, generated article HTML grep

- [ ] **Step 1: Switch the active theme and params to PaperMod**

Replace `config/_default/hugo.toml` with:

```toml
theme = "PaperMod"
baseURL = "https://classroom.anir0y.in/"
defaultContentLanguage = "en"

enableRobotsTXT = true
enableEmoji = true
summaryLength = 0

buildDrafts = false
buildFuture = false
buildExpired = false

[pagination]
  pagerSize = 10

[taxonomies]
  tag = "tags"
  category = "categories"

[outputs]
  home = ["HTML", "RSS", "JSON"]

[minify]
  disableXML = true
  minifyOutput = true
```

Replace `config/_default/params.toml` with:

```toml
env = "production"
defaultTheme = "auto"
disableThemeToggle = false
ShowReadingTime = true
ShowShareButtons = true
ShowPostNavLinks = true
ShowBreadCrumbs = true
ShowCodeCopyButtons = true
ShowRssButtonInSectionTermList = true
UseHugoToc = true
disableScrollToTop = false
hidemeta = false
hideSummary = false
showtoc = true
tocopen = false

[assets]
  favicon = "/img/avatar.jpeg"
  favicon16x16 = "/img/avatar.jpeg"
  favicon32x32 = "/img/avatar.jpeg"
  apple_touch_icon = "/img/avatar.jpeg"

[label]
  text = "Classroom"
  icon = "/img/avatar.jpeg"
  iconHeight = 35

[homeInfoParams]
  Title = "Animesh Roy's Classroom"
  Content = "Cybersecurity expertise - CTF walkthroughs, malware analysis, penetration testing, and security research."

[cover]
  hidden = false
  hiddenInList = false
  hiddenInSingle = false

[editPost]
  URL = "https://github.com/anir0y/classroom/tree/master/content"
  Text = "Suggest Changes"
  appendFilePath = true

[fuseOpts]
  isCaseSensitive = false
  shouldSort = true
  location = 0
  distance = 1000
  threshold = 0.4
  minMatchCharLength = 0
  keys = ["title", "permalink", "summary", "content"]
```

Replace `config/_default/menus.en.toml` with:

```toml
[[main]]
  name = "Posts"
  pageRef = "post"
  weight = 10

[[main]]
  name = "Categories"
  pageRef = "categories"
  weight = 20

[[main]]
  name = "Tags"
  pageRef = "tags"
  weight = 30

[[main]]
  name = "Archives"
  pageRef = "archives"
  weight = 40

[[main]]
  name = "Search"
  url = "/search/"
  weight = 50

[[main]]
  name = "About"
  url = "/about/me/"
  weight = 60
```

- [ ] **Step 2: Confirm the config switch fails before the PaperMod hooks are restored**

Run:

```bash
OUT="$(mktemp -d)"
hugo --cleanDestinationDir --destination "$OUT"
```

Expected:

- The command fails because the repo does not yet provide the PaperMod hook bridges and the current single-post override is still Blowfish-specific

- [ ] **Step 3: Create the PaperMod head hook bridge**

```html
{{ partial "extend-head.html" . }}
{{ partial "schema.html" . }}
```

Save that as `layouts/partials/extend_head.html`.

- [ ] **Step 4: Create the PaperMod footer hook bridge with a placeholder for the JS runtime**

```html
{{ partial "extend-footer.html" . }}
```

Save that as `layouts/partials/extend_footer.html`.

- [ ] **Step 5: Replace `layouts/_default/single.html` with the PaperMod-compatible single-post override**

```html
{{- define "main" }}
<article class="post-single">
  <header class="post-header">
    {{ partial "breadcrumbs.html" . }}
    <h1 class="post-title">{{ .Title }}</h1>
    {{- if .Description }}
    <div class="post-description">{{ .Description }}</div>
    {{- end }}
    {{- if not (.Param "hideMeta") }}
    <div class="post-meta">
      {{- partial "post_meta.html" . -}}
      {{- partial "translation_list.html" . -}}
      {{- partial "edit_post.html" . -}}
      {{- partial "post_canonical.html" . -}}
    </div>
    {{- end }}
  </header>

  {{- $isHidden := (.Param "cover.hiddenInSingle") | default (.Param "cover.hidden") | default false }}
  {{- partial "cover.html" (dict "cxt" . "IsSingle" true "isHidden" $isHidden) }}

  {{- if templates.Exists "partials/ads-top.html" }}
  <div class="post-ads post-ads-top">
    {{ partial "ads-top.html" . }}
  </div>
  {{- end }}

  {{- if (.Param "ShowToc") }}
  {{- partial "toc.html" . }}
  {{- end }}

  {{- if .Content }}
  <div class="post-content md-content">
    {{- if not (.Param "disableAnchoredHeadings") }}
    {{- partial "anchored_headings.html" .Content -}}
    {{- else }}{{ .Content }}{{ end }}
  </div>
  {{- end }}

  {{- if templates.Exists "partials/ads-bottom.html" }}
  <div class="post-ads post-ads-bottom">
    {{ partial "ads-bottom.html" . }}
  </div>
  {{- end }}

  <footer class="post-footer">
    {{- $tags := .Language.Params.Taxonomies.tag | default "tags" }}
    <ul class="post-tags">
      {{- range ($.GetTerms $tags) }}
      <li><a href="{{ .Permalink }}">{{ .LinkTitle }}</a></li>
      {{- end }}
    </ul>
    {{- if (.Param "ShowPostNavLinks") }}
    {{- partial "post_nav_links.html" . }}
    {{- end }}
    {{- if (and site.Params.ShowShareButtons (ne .Params.disableShare true)) }}
    {{- partial "share_icons.html" . -}}
    {{- end }}
  </footer>

  {{- if (.Param "comments") }}
  {{- partial "comments.html" . }}
  {{- end }}
</article>
{{- end }}
```

- [ ] **Step 6: Add PaperMod-safe site overrides**

```css
#TableOfContents {
  font-size: 0.85rem;
  line-height: 1.5;
}

#TableOfContents ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

#TableOfContents ul ul {
  padding-left: 0.75rem;
  border-left: 1px solid var(--border);
  margin-left: 0.5rem;
}

#TableOfContents li {
  margin: 0.15rem 0;
}

#TableOfContents a {
  display: block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--secondary);
  text-decoration: none;
  font-size: 0.8rem;
  line-height: 1.4;
  transition: all 0.15s ease;
  border-left: 2px solid transparent;
}

#TableOfContents a:hover,
#TableOfContents a.active {
  color: var(--primary);
  background: var(--tertiary);
  border-left-color: var(--primary);
}

.post-ads {
  margin: 1.5rem 0;
}
```

Save that as `assets/css/extended/site-overrides.css`.

- [ ] **Step 7: Run the Hugo build again**

Run:

```bash
OUT="$(mktemp -d)"
hugo --cleanDestinationDir --destination "$OUT"
test -f "$OUT/index.html"
test -f "$OUT/post/index.html"
test -f "$OUT/post/healthgpt/index.html"
rg -n 'adsbygoogle|utteranc\\.es|application/ld\\+json|swg-basic' "$OUT/post/healthgpt/index.html"
```

Expected:

- `hugo` exits 0
- The three `test -f` checks succeed
- `rg` finds ad markup, comments, schema, and SWG output in the rendered article page

- [ ] **Step 8: Commit**

```bash
git add config/_default/hugo.toml config/_default/params.toml config/_default/menus.en.toml layouts/partials/extend_head.html layouts/partials/extend_footer.html layouts/_default/single.html assets/css/extended/site-overrides.css
git commit -m "feat: migrate site to PaperMod baseline"
```

### Task 3: Add the repo-owned Pretext runtime pipeline

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `assets/js/pretext-targets.js`
- Create: `assets/js/pretext-enhance.js`
- Modify: `layouts/partials/extend_footer.html`
- Test: `npm install`, `hugo --cleanDestinationDir`, generated HTML script tag grep

- [ ] **Step 1: Create the npm manifest and install Pretext**

Run:

```bash
npm init -y
npm install @chenglou/pretext
```

Then replace `package.json` with:

```json
{
  "name": "classroom",
  "private": true,
  "type": "module",
  "dependencies": {
    "@chenglou/pretext": "^0.0.5"
  }
}
```

Immediately after writing `package.json`, run:

```bash
npm install
```

Expected:

- `package-lock.json` is created
- `node_modules/@chenglou/pretext` exists locally

- [ ] **Step 2: Create the shared Pretext helpers**

```js
export const PRETEXT_SCOPES = {
  excerpt: '[data-pretext-scope="excerpt"]',
}

export function readFont(element) {
  const style = window.getComputedStyle(element)
  return [
    style.fontStyle,
    style.fontWeight,
    style.fontSize,
    style.fontFamily,
  ].join(' ')
}

export function readLineHeight(element) {
  const style = window.getComputedStyle(element)
  const parsed = Number.parseFloat(style.lineHeight)

  if (!Number.isNaN(parsed)) {
    return parsed
  }

  return Number.parseFloat(style.fontSize) * 1.4
}

export function markReady(element, metrics) {
  element.dataset.pretextReady = 'true'
  element.style.setProperty('--pretext-height', `${metrics.height}px`)
  element.style.setProperty('--pretext-lines', `${metrics.lineCount}`)
}
```

Save that as `assets/js/pretext-targets.js`.

- [ ] **Step 3: Create the Pretext entrypoint**

```js
import { prepare, layout } from '@chenglou/pretext'
import { PRETEXT_SCOPES, markReady, readFont, readLineHeight } from './pretext-targets.js'

function enhanceExcerpt(element) {
  const width = element.clientWidth

  if (!width) {
    return
  }

  const text = element.textContent?.trim()

  if (!text) {
    return
  }

  const prepared = prepare(text, readFont(element))
  const metrics = layout(prepared, width, readLineHeight(element))

  markReady(element, metrics)
}

function runEnhancements() {
  document.querySelectorAll(PRETEXT_SCOPES.excerpt).forEach(enhanceExcerpt)
}

let resizeTimer = 0

window.addEventListener('load', runEnhancements, { once: true })
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(runEnhancements, 150)
})
```

Save that as `assets/js/pretext-enhance.js`.

- [ ] **Step 4: Load the built runtime from the PaperMod footer hook**

```html
{{ partial "extend-footer.html" . }}
{{ $pretext := resources.Get "js/pretext-enhance.js" | js.Build | fingerprint }}
<script defer src="{{ $pretext.RelPermalink }}" integrity="{{ $pretext.Data.Integrity }}"></script>
```

Replace the contents of `layouts/partials/extend_footer.html` with that block.

- [ ] **Step 5: Verify the runtime is bundled into the site**

Run:

```bash
OUT="$(mktemp -d)"
hugo --cleanDestinationDir --destination "$OUT"
rg -n 'pretext-enhance|assets/js' "$OUT/post/healthgpt/index.html" "$OUT/index.html"
```

Expected:

- `hugo` exits 0
- `rg` finds the fingerprinted script tag emitted from `extend_footer.html`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json assets/js/pretext-targets.js assets/js/pretext-enhance.js layouts/partials/extend_footer.html
git commit -m "feat: add Pretext runtime pipeline"
```

### Task 4: Tag list excerpts and ship the Phase 1 enhancement styles

**Files:**
- Modify: `layouts/_default/list.html`
- Create: `assets/css/extended/pretext.css`
- Test: `hugo --cleanDestinationDir`, local `hugo server`, browser console checks

- [ ] **Step 1: Copy PaperMod's list template into `layouts/_default/list.html` and add stable excerpt markers**

Use this content:

```html
{{- define "main" }}

{{- if (and site.Params.profileMode.enabled .IsHome) }}
{{- partial "index_profile.html" . }}
{{- else }}

{{- if not .IsHome | and .Title }}
<header class="page-header">
  {{- partial "breadcrumbs.html" . }}
  <h1>{{ .Title }}</h1>
  {{- if .Description }}
  <div class="post-description">{{ .Description | markdownify }}</div>
  {{- end }}
</header>
{{- end }}

{{- if .Content }}
<div class="md-content">
  {{- if not (.Param "disableAnchoredHeadings") }}
  {{- partial "anchored_headings.html" .Content -}}
  {{- else }}{{ .Content }}{{ end }}
</div>
{{- end }}

{{- $pages := union .RegularPages .Sections }}
{{- if .IsHome }}
{{- $pages = where site.RegularPages "Type" "in" site.Params.mainSections }}
{{- $pages = where $pages "Params.hiddenInHomeList" "!=" "true" }}
{{- end }}

{{- $paginator := .Paginate $pages }}
{{- if and .IsHome site.Params.homeInfoParams (eq $paginator.PageNumber 1) }}
{{- partial "home_info.html" . }}
{{- end }}

{{- range $index, $page := $paginator.Pages }}
<article class="post-entry" data-pretext-card="true">
  {{- $isHidden := (.Param "cover.hiddenInList") | default (.Param "cover.hidden") | default false }}
  {{- partial "cover.html" (dict "cxt" . "IsSingle" false "isHidden" $isHidden) }}
  <header class="entry-header">
    <h2 class="entry-hint-parent">{{ .Title }}</h2>
  </header>
  {{- if (ne (.Param "hideSummary") true) }}
  <div class="entry-content">
    <p data-pretext-scope="excerpt">{{ .Summary | plainify | htmlUnescape }}{{ if .Truncated }}...{{ end }}</p>
  </div>
  {{- end }}
  {{- if not (.Param "hideMeta") }}
  <footer class="entry-footer">
    {{- partial "post_meta.html" . -}}
  </footer>
  {{- end }}
  <a class="entry-link" aria-label="post link to {{ .Title | plainify }}" href="{{ .Permalink }}"></a>
</article>
{{- end }}

{{- if gt $paginator.TotalPages 1 }}
<footer class="page-footer">
  <nav class="pagination">
    {{- if $paginator.HasPrev }}
    <a class="prev" href="{{ $paginator.Prev.URL | absURL }}">«&nbsp;{{ i18n "prev_page" }}</a>
    {{- end }}
    {{- if $paginator.HasNext }}
    <a class="next" href="{{ $paginator.Next.URL | absURL }}">{{ i18n "next_page" }}&nbsp;»</a>
    {{- end }}
  </nav>
</footer>
{{- end }}

{{- end }}
{{- end }}
```

- [ ] **Step 2: Add the excerpt enhancement styles**

```css
[data-pretext-card="true"] {
  display: flex;
  flex-direction: column;
}

[data-pretext-card="true"] .entry-content {
  flex: 1;
}

[data-pretext-scope="excerpt"] {
  --pretext-height: auto;
}

[data-pretext-scope="excerpt"][data-pretext-ready="true"] {
  min-height: var(--pretext-height);
}
```

Save that as `assets/css/extended/pretext.css`.

- [ ] **Step 3: Verify the generated HTML includes the markers**

Run:

```bash
OUT="$(mktemp -d)"
hugo --cleanDestinationDir --destination "$OUT"
rg -n 'data-pretext-card|data-pretext-scope=\"excerpt\"' "$OUT/index.html" "$OUT/post/index.html"
```

Expected:

- `hugo` exits 0
- `rg` finds the marker attributes in the rendered homepage and post list HTML

- [ ] **Step 4: Verify the enhancement in a browser**

Run:

```bash
hugo server --bind 127.0.0.1 --port 1313
```

Then open `http://127.0.0.1:1313/` in a browser and run this in DevTools:

```js
document.querySelectorAll('[data-pretext-scope="excerpt"][data-pretext-ready="true"]').length
```

Expected:

- The expression returns a number greater than `0`

Then run:

```js
Array.from(document.querySelectorAll('[data-pretext-scope="excerpt"]')).slice(0, 3).map(node => ({
  text: node.textContent.trim().slice(0, 40),
  lines: node.style.getPropertyValue('--pretext-lines'),
  height: node.style.getPropertyValue('--pretext-height'),
}))
```

Expected:

- The objects show non-empty `lines` and `height` values for excerpt nodes

- [ ] **Step 5: Commit**

```bash
git add layouts/_default/list.html assets/css/extended/pretext.css
git commit -m "feat: enhance PaperMod excerpts with Pretext"
```
