# @dpdpkit/react

React 18+ components and hooks for [dpdpkit](https://github.com/dpdpkit-dev): an itemised consent notice,
a preference centre with one-click withdrawal, a rights request form and a language switcher. They
work with any dpdpkit backend (FastAPI or Django adapter, `dpdpkit-server`, dpdpkit Cloud).

> **Disclaimer.** dpdpkit is software that helps you implement obligations under India's Digital Personal
> Data Protection Act, 2023 and the DPDP Rules, 2025. It does not provide legal advice and does not
> guarantee compliance.

```bash
npm i @dpdpkit/react @dpdpkit/client
```

```tsx
import { ConsentNotice, DpdpProvider, LanguageSwitcher, PreferenceCenter, RightsRequestForm } from "@dpdpkit/react";
import "@dpdpkit/react/styles.css";

<DpdpProvider options={{ baseUrl: "/dpdp" }} locale="hi">
  <LanguageSwitcher />
  <ConsentNotice onSaved={() => closeBanner()} />
  <PreferenceCenter />
  <RightsRequestForm />
</DpdpProvider>
```

## Design rules the components follow

- **Legal text comes from the API.** Titles, purposes, data items and links come from the notice in the
  principal's language. Only interface labels (button text) live in the package; override them with
  `labels`.
- **Nothing pre-ticked.** A box is ticked only if the principal previously gave that consent.
- **Equal choices.** "Accept all", "Reject all" and "Save my choices" share one style.
- **Withdrawal is one click**, never more steps than granting.
- **Always linked:** withdraw, your rights, and complaining to the Data Protection Board.
- **Accessible:** WCAG 2.1 AA target; axe-core runs on every component in CI.

## Hooks for your own UI

```tsx
const { notice } = useNotice();
const { consents, record, withdraw } = useConsent();
const { requests, open } = useRequests();
```

## Theming

Override CSS variables on `.dpdp` or any parent: `--dpdp-accent`, `--dpdp-text`, `--dpdp-bg`,
`--dpdp-border`, `--dpdp-radius`, `--dpdp-font`. Dark mode follows `prefers-color-scheme`.

## Storybook

Every component and state (first visit, returning visitor, Hindi, loading and error states, theming,
custom labels) has a story. The stories run against an in-memory backend (`stories/mockClient.ts`), so no
server is needed. The Storybook is published on the docs site under *Reference → React components*.

```bash
npm run storybook         # dev server on http://localhost:6006
npm run build-storybook   # static build in storybook-static/, staged by dpdpkit-docs
```

## Tests

```bash
npm test          # unit tests with Testing Library and axe-core (jsdom), plus every story rendered and checked with axe
npm run e2e       # Playwright: the components in Chromium against examples/fastapi_shop
```

`npm run e2e` starts fastapi-shop from a `dpdpkit-fastapi` checkout next to this one
(`DPDPKIT_FASTAPI_DIR`) using `DPDPKIT_PYTHON`, plus a Vite harness page (`e2e/harness`), then checks
consent, withdrawal, rights requests and accessibility end to end. Run `npx playwright install chromium`
once first.

## Licence

Apache-2.0.
