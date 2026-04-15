# PaperMod Reapply Design

## Problem

The site currently runs on the Blowfish Hugo theme, but the desired direction is to reapply PaperMod while preserving the newer SEO, advertising, and site-level customizations that were added after the Blowfish migration.

## Proposed Approach

Use a hybrid migration:

1. Install a fresh PaperMod theme source.
2. Point Hugo at PaperMod.
3. Port the current repo-owned customizations into PaperMod-compatible overrides.
4. Keep monetization and SEO logic in the repository rather than inside the theme.

This avoids dragging old PaperMod-era theme files back into the project while keeping the recent site behavior intact.

## Scope

In scope:

- Add PaperMod as a fresh Hugo theme source.
- Update theme selection and theme-specific Hugo configuration.
- Preserve current site metadata, analytics, schema, and ad-related customizations.
- Rework theme-coupled layout overrides so they integrate with PaperMod.
- Validate core pages and post rendering under PaperMod.

Out of scope:

- Content rewrites.
- URL or permalink restructuring.
- New monetization features.
- Unrelated refactors outside the theme migration path.

## Architecture

The migration should separate theme-owned concerns from site-owned concerns:

- **Theme-owned:** PaperMod templates, assets, and defaults.
- **Site-owned:** content, static assets, SEO metadata, schema partials, ad partials, analytics hooks, and targeted layout overrides.

Hugo should render the site through this flow:

`content + PaperMod defaults + repo overrides`

This keeps the theme replaceable later while preserving the repo's business logic and SEO/monetization behavior.

## Components

### 1. Theme Source

Add PaperMod as the active theme source under `themes/` and configure Hugo to use it.

### 2. Theme Configuration

Align Hugo configuration with PaperMod's expected parameters while retaining current site metadata and any non-theme-specific configuration already in use.

### 3. Repo-Owned Customizations

Preserve and reconnect:

- Ad partials
- Schema / structured data partials
- Head / footer extension hooks
- Analytics or publisher integrations that live in repo-owned templates

These should remain outside the theme whenever possible.

### 4. Template Overrides

Update only the overrides needed to bridge current custom behavior into PaperMod, especially for:

- Single post rendering
- Shared page chrome
- Partial insertion points required by ads or SEO hooks

## Migration Flow

1. Install fresh PaperMod.
2. Switch active theme configuration from Blowfish to PaperMod.
3. Compare current overrides against PaperMod's template structure.
4. Reconnect repo-owned partials through PaperMod-compatible overrides.
5. Remove or stop using Blowfish-specific assumptions in active templates/config.
6. Build and inspect key pages.

## Error Handling

The main failure mode is template incompatibility between Blowfish and PaperMod.

Rules for handling this:

- Do not rely on silent fallbacks when a current partial no longer has a valid hook point.
- Add explicit repo-owned overrides when PaperMod needs a different insertion path.
- Keep migration changes localized to theme config and layout integration points.
- Prefer visible, maintainable template wiring over fragile hacks.

## Validation

The migration is considered correct when:

- Hugo builds successfully with PaperMod active.
- Homepage, list pages, and single post pages render without missing-template errors.
- Ad, schema, and extension partials still appear in the intended places.
- Existing content continues to render without requiring Blowfish-specific front matter.

## Testing Strategy

Run existing project verification relevant to the Hugo site and inspect rendered output for:

- Homepage
- A list page
- A representative single article page

Testing should focus on behavior preservation rather than visual perfection during the migration step.

## Risks

- PaperMod may not expose the same insertion points as Blowfish.
- Some current overrides may be tightly coupled to Blowfish markup.
- Theme config keys may need reshaping to match PaperMod expectations.

## Risk Mitigation

- Start from a fresh PaperMod install instead of reviving stale theme files.
- Keep SEO and monetization behavior in repo-owned partials and overrides.
- Limit changes to the migration surface so regressions are easier to isolate.

## Success Criteria

- The site runs on PaperMod.
- Current SEO and ad integrations remain functional.
- The migration leaves a clean separation between theme code and repo-owned customizations.
