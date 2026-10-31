import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { RightsRequestForm } from "../src";

const meta = {
  title: "Components/RightsRequestForm",
  component: RightsRequestForm,
  args: { onSubmitted: fn() },
  parameters: {
    docs: {
      description: {
        component:
          "Opens a rights request (access, correction, erasure, nomination, grievance…) and tracks the principal's requests. " +
          "Choosing a nomination asks for the nominee instead of free text.",
      },
    },
  },
} satisfies Meta<typeof RightsRequestForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithExistingRequests: Story = {
  parameters: {
    dpdp: {
      requests: [
        { kind: "access", status: "completed" },
        { kind: "correction", status: "in_progress" },
        { kind: "erasure", status: "received" },
      ],
    },
  },
};

/** Offer only some kinds of request with `kinds`. */
export const LimitedKinds: Story = {
  args: { kinds: ["access", "erasure", "grievance"] },
};

/** `showRequests={false}` hides the table, for example when the requests are listed elsewhere. */
export const WithoutRequestList: Story = {
  args: { showRequests: false },
  parameters: WithExistingRequests.parameters,
};

/** The backend rejects the request: press Submit to see the error message. */
export const SubmitFailed: Story = {
  parameters: { dpdp: { fail: "save" } },
};
