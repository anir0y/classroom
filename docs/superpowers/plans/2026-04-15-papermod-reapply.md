# PaperMod Reapply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reapply PaperMod as a fresh Hugo theme while preserving the current SEO, ads, schema, comments, and publisher integrations.

**Architecture:** Keep PaperMod as the theme-owned layer and keep monetization / SEO behavior in repo-owned config, partials, and targeted layout overrides. Use PaperMod's `extend_head.html` and `extend_footer.html` hooks plus a repo-owned `layouts/_default/single.html` override to bridge the current custom behavior into the new theme.

**Tech Stack:** Hugo, TOML config, Go HTML templates, CSS, Git submodules

---

## File Map

- Modify: `.gitmodules` — add the fresh PaperMod submodule entry without disturbing the existing theme history.
- Create: `themes/PaperMod` — new active Hugo theme source as a git submodule.
- Modify: `config/_default/hugo.toml` — switch active theme and keep site-wide Hugo settings.
- Modify: `config/_default/params.toml` — translate Blowfish theme params into PaperMod params while preserving SEO and search behavior.
- Modify: `config/_default/menus.en.toml` — keep the current top-level navigation and restore the search entry for PaperMod.
- Review / preserve: `config/_default/languages.en.toml` — keep author, title, description, and social identity data.
- Create: `layouts/partials/extend_head.html` — PaperMod hook file that delegates to repo-owned head behavior.
- Create: `layouts/partials/extend_footer.html` — PaperMod hook file that delegates to repo-owned footer behavior.
- Keep: `layouts/partials/extend-head.html` — existing repo-owned head behavior (AdSense loader + SWG).
- Keep: `layouts/partials/extend-footer.html` — existing repo-owned footer extension point.
- Keep: `layouts/partials/schema.html` — repo-owned structured data partial.
- Keep: `layouts/partials/comments.html` — repo-owned utterances integration.
- Keep / reuse: `layouts/partials/ads-top.html`, `layouts/partials/ads-bottom.html`, `layouts/partials/ads-mid.html` — repo-owned ad partials.
- Modify: `layouts/_default/single.html` — replace the Blowfish-specific single template with a PaperMod-compatible override that re-inserts ads and comments.
- Modify: `assets/css/custom.css` — replace Blowfish-only CSS variables with PaperMod-compatible styling and add ad wrapper styling.

### Task 1: Add the fresh PaperMod theme source

**Files:**
- Modify: `.gitmodules`
- Create: `themes/PaperMod`
- Test: submodule state in `.gitmodules` and `git submodule status`

- [ ] **Step 1: Verify the starting state**

```bash
test -d themes/PaperMod && echo "unexpected: themes/PaperMod already exists" || echo "ok: themes/PaperMod missing"
git config -f .gitmodules --get-regexp '^submodule\..*\.path$'
```

Expected:

- First command prints `ok: themes/PaperMod missing`
- Second command lists only the existing theme paths

- [ ] **Step 2: Add the PaperMod submodule**

```bash
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
git submodule sync --recursive
git submodule update --init --recursive themes/PaperMod
```

- [ ] **Step 3: Ensure `.gitmodules` has the new entry**

```toml
[submodule "themes/PaperMod"]
	path = themes/PaperMod
	url = https://github.com/adityatelange/hugo-PaperMod.git
```

- [ ] **Step 4: Verify the new theme source is tracked**

```bash
git config -f .gitmodules --get-regexp '^submodule\..*\.path$'
git submodule status -- themes/PaperMod
```

Expected:

- `.gitmodules` now includes `themes/PaperMod`
- `git submodule status` prints a resolved commit for `themes/PaperMod`

- [ ] **Step 5: Commit**

```bash
git add .gitmodules themes/PaperMod
git commit -m "chore: add PaperMod theme source"
```

### Task 2: Add PaperMod hook bridges and theme-safe custom CSS

**Files:**
- Create: `layouts/partials/extend_head.html`
- Create: `layouts/partials/extend_footer.html`
- Modify: `assets/css/custom.css`
- Test: `hugo` build while Blowfish is still active

- [ ] **Step 1: Confirm the PaperMod hook files do not exist yet**

```bash
test -f layouts/partials/extend_head.html && echo "unexpected: extend_head exists" || echo "ok: extend_head missing"
test -f layouts/partials/extend_footer.html && echo "unexpected: extend_footer exists" || echo "ok: extend_footer missing"
```

Expected:

- Both commands print the `ok: ... missing` message

- [ ] **Step 2: Create the head hook bridge**

```html
{{ partial "extend-head.html" . }}
{{ partial "schema.html" . }}
```

Save that as `layouts/partials/extend_head.html`.

- [ ] **Step 3: Create the footer hook bridge**

```html
{{ partial "extend-footer.html" . }}
```

Save that as `layouts/partials/extend_footer.html`.

- [ ] **Step 4: Replace the Blowfish-only custom CSS variables with PaperMod-safe styles**

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

Use that as the new contents of `assets/css/custom.css`.

- [ ] **Step 5: Verify nothing regressed before the theme switch**

Run:

```bash
OUT="$(mktemp -d)"
hugo --cleanDestinationDir --destination "$OUT"
```

Expected:

- Command exits 0 while Blowfish is still active

- [ ] **Step 6: Commit**

```bash
git add layouts/partials/extend_head.html layouts/partials/extend_footer.html assets/css/custom.css
git commit -m "feat: add PaperMod hook bridges"
```

### Task 3: Switch Hugo to PaperMod and replace the single-post override

**Files:**
- Modify: `config/_default/hugo.toml`
- Modify: `config/_default/params.toml`
- Modify: `config/_default/menus.en.toml`
- Review / preserve: `config/_default/languages.en.toml`
- Modify: `layouts/_default/single.html`
- Test: `hugo` build plus generated HTML checks

- [ ] **Step 1: Switch the active theme in `config/_default/hugo.toml`**

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

- [ ] **Step 2: Translate `config/_default/params.toml` from Blowfish params to PaperMod params**

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

Keep `config/_default/languages.en.toml` as the source of title, description, copyright,
and `[params.author]`.

- [ ] **Step 3: Restore the Search menu entry in `config/_default/menus.en.toml`**

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

- [ ] **Step 4: Run the build once before fixing `layouts/_default/single.html`**

Run:

```bash
OUT="$(mktemp -d)"
hugo --cleanDestinationDir --destination "$OUT"
```

Expected:

- Command fails because the current `layouts/_default/single.html` still references Blowfish-only partials such as `article-meta/basic.html` or `series/series.html`

- [ ] **Step 5: Replace `layouts/_default/single.html` with a PaperMod-compatible override**

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

- [ ] **Step 6: Run the full build again and verify the generated pages**

Run:

```bash
OUT="$(mktemp -d)"
hugo --cleanDestinationDir --destination "$OUT"
test -f "$OUT/index.html"
test -f "$OUT/post/index.html"
test -f "$OUT/search/index.html"
test -f "$OUT/post/healthgpt/index.html"
rg -n 'adsbygoogle|utteranc\\.es|application/ld\\+json|swg-basic' "$OUT/post/healthgpt/index.html"
```

Expected:

- `hugo` exits 0
- All four `test -f` commands succeed
- `rg` finds the ad markup, comments embed, structured data, and SWG script on the rendered article page

- [ ] **Step 7: Commit**

```bash
git add config/_default/hugo.toml config/_default/params.toml config/_default/menus.en.toml layouts/_default/single.html
git commit -m "feat: reapply PaperMod theme"
```
