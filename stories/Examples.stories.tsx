import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { ConsentNotice, LanguageSwitcher, PreferenceCenter, RightsRequestForm } from "../src";

function PrivacyPage() {
  return (
    <div style={{ display: "grid", gap: "2rem", maxWidth: "44rem" }}>
      <LanguageSwitcher />
      <ConsentNotice />
      <PreferenceCenter />
      <RightsRequestForm />
    </div>
  );
}

const meta = {
  title: "Examples/Privacy page",
  component: PrivacyPage,
  parameters: { docs: { description: { component: "All the components on one page, sharing one `DpdpProvider`." } } },
} satisfies Meta<typeof PrivacyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Saving in the notice updates the preference centre, and the other way round. */
export const AllComponents: Story = {
  parameters: { dpdp: { requests: [{ kind: "access", status: "completed" }] } },
};

const brand = {
  "--dpdp-accent": "#7a1f5c",
  "--dpdp-focus": "#a3307c",
  "--dpdp-radius": "2px",
  "--dpdp-font": "Georgia, serif",
} as CSSProperties;

/** The theme is CSS variables on `.dpdp` or any parent: `--dpdp-accent`, `--dpdp-radius`, `--dpdp-font`… */
export const Themed: Story = {
  render: () => (
    <div style={brand}>
      <PrivacyPage />
    </div>
  ),
};

/** Interface labels (button text and similar) can be overridden; legal text always comes from the notice. */
export const CustomLabels: Story = {
  parameters: {
    dpdp: {
      labels: { acceptAll: "Allow everything", rejectAll: "Decline all", saveChoices: "Confirm", preferencesTitle: "Privacy settings" },
    },
  },
};
