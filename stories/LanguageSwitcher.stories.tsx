import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConsentNotice, LanguageSwitcher } from "../src";

const meta = {
  title: "Components/LanguageSwitcher",
  component: LanguageSwitcher,
  parameters: {
    docs: {
      description: {
        component:
          "Offers every language the current notice is published in and switches the provider's locale. " +
          "It renders nothing when the notice has only one language.",
      },
    },
  },
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Switching the language reloads the notice in that language. */
export const WithNotice: Story = {
  render: (args) => (
    <>
      <LanguageSwitcher {...args} />
      <ConsentNotice />
    </>
  ),
};

/** Nothing to switch between, so nothing is rendered. */
export const SingleLanguage: Story = {
  parameters: { dpdp: { locales: ["en"] } },
};
