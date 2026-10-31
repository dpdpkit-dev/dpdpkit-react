// Storybook for the components, built statically and published on the docs site under /<version>/storybook/.
// Stories run against stories/mockClient.ts, an in-memory backend, so the published build needs no server.
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    // Not the root vite.config.ts: its library build externalises React, which a static site cannot do.
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
  // dpdpkit never calls home; neither does its tooling.
  core: { disableTelemetry: true },
};

export default config;
