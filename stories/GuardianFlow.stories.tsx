import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { GuardianFlow, type GuardianApi } from "../src";

const api: GuardianApi = {
  start: async ({ method }) => ({ id: "gv_1", method, status: "pending", redirect_url: "https://verifier.example/start" }),
  callback: async ({ verification_id }) => ({ id: verification_id, method: "digilocker_token", status: "verified" }),
};

const meta = {
  title: "Components/GuardianFlow",
  component: GuardianFlow,
  args: { api, onVerified: fn() },
  parameters: {
    docs: {
      description: {
        component:
          "Hands a child's account to verifiable guardian consent: choose a method, start verification, " +
          "follow the verifier's link, then complete with the returned token. You pass the two guardian endpoints as `api`.",
      },
    },
  },
} satisfies Meta<typeof GuardianFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Offer only some verification methods. */
export const LimitedMethods: Story = { args: { methods: ["digilocker_token", "partner_token"] } };
