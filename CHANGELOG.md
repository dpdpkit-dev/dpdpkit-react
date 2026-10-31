# Changelog

All code packages in the dpdpkit release train share one version number.

## Unreleased

### Changed
- Development and CI use the published `@dpdpkit/client` instead of a sibling checkout, so Dependabot can
  update npm dependencies again.

### Added
- Bundle-size budget in CI (`npm run size`): 6 kB gzip for the JS entry points, 2 kB for `styles.css`.

## 0.1.0-alpha.1 - 2026-09-27

### Added
- `DpdpProvider`, `useNotice`, `useConsent`, `useRequests`.
- `ConsentNotice`, `PreferenceCenter` (one-click withdrawal, history), `RightsRequestForm`, `LanguageSwitcher`.
- Default theme with CSS variables and dark mode; axe-core accessibility tests.
