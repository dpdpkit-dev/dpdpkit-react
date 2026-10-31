# Changelog

All code packages in the dpdpkit release train share one version number.

## Unreleased

### Fixed
- `ConsentNotice` and `PreferenceCenter` on one page no longer render two navigation landmarks with the same
  name (axe `landmark-unique`). `NoticeLinks` takes an optional `section` to name its landmark.

### Changed
- Built with TypeScript 7, vite 8, vitest 5 and @vitejs/plugin-react 6; type declarations unchanged.
  CI tests on Node 22 and 24.
- Development and CI use the published `@dpdpkit/client` instead of a sibling checkout, so Dependabot can
  update npm dependencies again.

### Added
- Storybook (`npm run storybook`, `npm run build-storybook`) with a story for every component and state,
  run against an in-memory backend and published on the docs site. Every story is also rendered and
  checked with axe-core in `npm test`.
- Playwright widget tests against `examples/fastapi_shop` (`npm run e2e`, CI job `e2e`).
- Bundle-size budget in CI (`npm run size`): 6 kB gzip for the JS entry points, 2 kB for `styles.css`.

## 0.1.0-alpha.1 - 2026-09-27

### Added
- `DpdpProvider`, `useNotice`, `useConsent`, `useRequests`.
- `ConsentNotice`, `PreferenceCenter` (one-click withdrawal, history), `RightsRequestForm`, `LanguageSwitcher`.
- Default theme with CSS variables and dark mode; axe-core accessibility tests.
