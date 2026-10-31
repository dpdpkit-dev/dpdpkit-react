// Mounts the published components against a real dpdpkit backend (fastapi-shop, proxied at /dpdp).
// ?user=<principal> stands in for the app login; fastapi-shop reads it from the X-User header.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConsentNotice, DpdpProvider, LanguageSwitcher, PreferenceCenter, RightsRequestForm } from "../../src";
import "../../src/styles.css";

const params = new URLSearchParams(location.search);
const options = { baseUrl: "/dpdp", headers: { "X-User": params.get("user") ?? "anonymous" } };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DpdpProvider options={options} locale={params.get("locale") ?? undefined}>
      <h1>Privacy</h1>
      <LanguageSwitcher />
      <ConsentNotice />
      <PreferenceCenter />
      <RightsRequestForm />
    </DpdpProvider>
  </StrictMode>,
);
