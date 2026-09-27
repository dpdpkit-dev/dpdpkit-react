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

## Licence

Apache-2.0.
