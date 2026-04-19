# PowerLift Live (PLL App)

## Stack
- Static client-side web app
- HTML + Bootstrap 5 + Font Awesome
- Vanilla JavaScript, no build step
- Uses localStorage for config/state
- Reads live meet data from Google Sheets via cache proxy

## Purpose
- Unofficial companion app for Michigan high school powerlifting meets
- Supports coaches, athletes, spectators, and meet directors
- Hosted at pllv4.streamwaveprod.com
- Auto-deployed with GitHub Actions

## Core rules
- Keep pages focused on one role/view.
- Prefer Bootstrap utility classes over heavy custom styling.
- Keep changes minimal and localized.
- Do not add a build step or framework unless explicitly requested.
- Preserve browser-only operation unless explicitly requested.
- Do not break localStorage-based config flow.
- Do not change cache/API/deploy behavior without approval.

## Data assumptions
- Setup stores config in localStorage under `trplConfig`.
- Sheet detection is substring-based and case-insensitive.
- Platform, Varsity, JV, Results, and Team sheets are auto-detected by name.
- Most pages parse CSV directly, so column order assumptions matter.
- Public Google Sheet access is required.

## Important behavior
- Auto-refresh state is stored per page in localStorage.
- Cache proxy may return HIT, MISS, or STALE data.
- Stale cache behavior is intentional for resilience.
- localStorage config is browser/device-specific.

## Key files
- `setup.html` handles spreadsheet setup and sheet detection.
- `coaches.html`, `platform.html`, `display.html`, `results.html`, `team.html` are key user-facing pages.
- `director.html` controls director features including state meet behavior.
- `state-records-data.js` contains state record logic/data.
- `.github/workflows/deploy.yml` handles deployment.

## Guardrails
- Ask before changing sheet-detection logic globally.
- Ask before changing localStorage keys or config shape.
- Ask before changing cache TTL behavior, proxy endpoints, or deployment workflow.
- Ask before changing director/state-meet logic.

## Validation
- Test with a real public Google Sheet when behavior depends on live data.
- Check affected page(s) and whether issue is parsing, display, or refresh-related.
- Check cache headers when debugging stale or missing data.
- Verify mobile behavior for coach-facing pages.