import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ConsentNotice } from "../src";

const meta = {
  title: "Components/ConsentNotice",
  component: ConsentNotice,
  args: { onSaved: fn() },
  parameters: {
    docs: {
      description: {
        component:
          "The itemised notice: one toggle per consent purpose, nothing pre-ticked, three equal-weight buttons and the required links. " +
          "Purposes with another legal basis are listed but have no toggle.",
      },
    },
  },
} satisfies Meta<typeof ConsentNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A principal who has not decided anything yet: every box is empty. */
export const FirstVisit: Story = {};

/** A box is ticked only where the principal previously gave consent. */
export const ReturningVisitor: Story = {
  parameters: { dpdp: { consents: { account: "granted", marketing: "withdrawn", analytics: "denied" } } },
};

/** Legal text comes from the notice in the principal's language; only button text comes from `labels`. */
export const Hindi: Story = {
  parameters: { dpdp: { locale: "hi" } },
};

export const Loading: Story = {
  parameters: { dpdp: { fail: "never" } },
};

export const LoadFailed: Story = {
  parameters: { dpdp: { fail: "load" } },
};

/** The backend rejects the save: press any button to see the error message. */
export const SaveFailed: Story = {
  parameters: { dpdp: { fail: "save" } },
};
