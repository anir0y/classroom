# PaperMod + Pretext Design

## Problem

The site should switch to PaperMod while also improving text rendering quality across article pages, homepage/list excerpts, and headings. The new typography layer must not sacrifice the site's static-site strengths such as SEO, accessibility, and readable no-JavaScript output.

## Proposed Approach

Use a hybrid architecture:

1. Reapply PaperMod as the base Hugo theme.
2. Keep Hugo-rendered HTML as the canonical text output.
3. Add a repo-owned Pretext enhancement layer that progressively improves selected text regions after page load.
4. Scope Pretext to marked regions only, so the baseline PaperMod site remains fully usable if the enhancement layer never runs.

## Scope

In scope:

- Install and activate PaperMod as the site theme.
- Preserve repo-owned SEO, schema, ad, comment, and publisher integrations.
- Add a repo-owned Pretext asset/module for progressive enhancement.
- Enhance three text surfaces over time: headings, homepage/list excerpts, and article body content.
- Add template hooks and CSS needed to opt specific regions into Pretext enhancement.

Out of scope:

- Replacing canonical article HTML with client-rendered text.
- Rewriting markdown content.
- Introducing a full SPA or app framework.
- Unrelated visual redesign beyond what PaperMod and the typography enhancement require.

## Architecture

The system should have three layers:

- **Theme layer:** PaperMod owns the base templates, assets, and default styling.
- **Content layer:** Hugo content, front matter, and repo-owned metadata remain the source of truth.
- **Enhancement layer:** A small repo-owned Pretext module progressively enhances selected rendered text regions in the browser.

The enhancement layer must sit on top of, not replace, the HTML produced by Hugo. This preserves search indexing, semantic markup, and a readable no-JavaScript baseline.

## Components

### 1. PaperMod Integration

PaperMod becomes the active theme source and base template set. Repo-owned hooks and overrides adapt current site behavior to PaperMod's structure.

### 2. Enhancement Asset Module

A repo-owned JavaScript entrypoint initializes Pretext only on pages that expose marked text regions. This module should avoid global rewrites and only touch the regions explicitly tagged for enhancement.

### 3. Template Hook Layer

Hugo partials and layout overrides should expose enhancement targets via stable classes or data attributes for:

- headings / titles
- homepage and list card excerpts
- article body content

These markers should be readable and safe even when no JavaScript runs.

### 4. Enhancement Styles

Repo-owned CSS should style enhanced regions only after successful initialization. The CSS must cooperate with PaperMod rather than fork the entire theme's typography stack.

## Data Flow

1. Hugo renders the site into normal HTML.
2. PaperMod styles the page and repo-owned template hooks mark eligible text regions.
3. The Pretext module scans only marked regions after load.
4. Pretext measures and applies enhancement behavior to those regions.
5. If enhancement fails or is skipped, the page continues using the original PaperMod-rendered HTML.

## Error Handling

Pretext must be non-critical. Failure cases should degrade to the default PaperMod output without:

- blank text
- hidden text that never reappears
- broken page flow
- dependency on client-side hydration for readable content

Enhancement should be opt-in by region and guarded by initialization checks so unsupported pages stay untouched.

## Validation

The implementation is correct when:

- Hugo builds successfully with PaperMod active.
- JS-disabled pages still render readable headings, excerpts, and article content.
- Marked regions enhance correctly when the Pretext module is present.
- SEO, schema, ad, comment, and publisher integrations still render in the intended places.
- Homepage, list pages, and single article pages remain readable and stable.

## Testing Strategy

Testing should cover both baselines:

1. **Static baseline:** Hugo build and rendered HTML checks with enhancement disabled or absent.
2. **Enhanced baseline:** browser-level verification that marked regions initialize cleanly and do not regress readability or layout stability.

Validation should focus first on titles/excerpts, then article body content.

## Risks

- Pretext introduces a repo-owned client-side asset path into a mostly static Hugo site.
- Theme migration and typography enhancement together increase integration complexity.
- Some article-body enhancements may be harder to make robust than title/excerpt enhancements.

## Risk Mitigation

- Roll out enhancement in phases instead of enabling every surface at once.
- Keep Hugo HTML as the fallback source of truth.
- Limit Pretext to explicitly marked regions.
- Keep theme migration and enhancement wiring separated in repo-owned files so failures are easier to isolate.

## Success Criteria

- The site runs on PaperMod.
- Repo-owned SEO and monetization integrations still work.
- Pretext progressively enhances headings, excerpts, and article text without becoming required for readability.
- The implementation leaves a clear separation between theme code and repo-owned enhancement code.
