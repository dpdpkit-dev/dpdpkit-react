import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AgeGate } from "../src";

const meta = {
  title: "Components/AgeGate",
  component: AgeGate,
  args: { onResult: fn() },
  parameters: {
    docs: {
      description: {
        component:
          "Asks for a date of birth and reports the age and whether the person is a child. " +
          "The date stays in the browser; only the verdict reaches `onResult`.",
      },
    },
  },
} satisfies Meta<typeof AgeGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** `minAge` sets the age below which a person counts as a child. */
export const CustomMinimumAge: Story = { args: { minAge: 16 } };
