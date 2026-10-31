/// <reference types="vite/client" />
import type { Preview } from "@storybook/react-vite";
import { MockProvider } from "../stories/MockProvider";
import "../src/styles.css";

const preview: Preview = {
  // Every story gets its own DpdpProvider and in-memory backend, configured by `parameters.dpdp`.
  decorators: [
    (Story, { parameters }) => (
      <MockProvider {...parameters.dpdp}>
        <Story />
      </MockProvider>
    ),
  ],
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    // Contrast is checked too: the default theme targets WCAG 2.1 AA.
    a11y: { test: "error" },
    options: { storySort: { order: ["Introduction", "Components", "Examples"] } },
  },
  tags: ["autodocs"],
};

export default preview;
