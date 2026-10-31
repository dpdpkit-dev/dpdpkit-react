import type { Meta, StoryObj } from "@storybook/react-vite";
import { PreferenceCenter } from "../src";

const meta = {
  title: "Components/PreferenceCenter",
  component: PreferenceCenter,
  parameters: {
    docs: {
      description: {
        component:
          "Current consent per purpose with one-click withdrawal (never more steps than granting) and the principal's consent history, " +
          "loaded when the history is opened.",
      },
    },
  },
} satisfies Meta<typeof PreferenceCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NothingDecided: Story = {};

/** Open "History of your choices" to see the ledger entries behind each state. */
export const MixedChoices: Story = {
  parameters: { dpdp: { consents: { account: "granted", marketing: "withdrawn", analytics: "denied" } } },
};

/** The backend rejects the change: press Withdraw to see the error message. */
export const WithdrawFailed: Story = {
  parameters: { dpdp: { consents: { account: "granted", marketing: "granted" }, fail: "save" } },
};

export const LoadFailed: Story = {
  parameters: { dpdp: { fail: "load" } },
};
