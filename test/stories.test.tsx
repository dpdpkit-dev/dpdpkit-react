// Every story must render and pass axe, so the published Storybook never shows a broken or inaccessible example.
import { composeStories, setProjectAnnotations } from "@storybook/react-vite";
import { act, cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import preview from "../.storybook/preview";
import * as ageGate from "../stories/AgeGate.stories";
import * as guardianFlow from "../stories/GuardianFlow.stories";
import * as consentNotice from "../stories/ConsentNotice.stories";
import * as examples from "../stories/Examples.stories";
import * as languageSwitcher from "../stories/LanguageSwitcher.stories";
import * as preferenceCenter from "../stories/PreferenceCenter.stories";
import * as rightsRequestForm from "../stories/RightsRequestForm.stories";

setProjectAnnotations(preview);
afterEach(cleanup);

type Composed = Record<string, ((props: object) => ReactElement) & { parameters: { dpdp?: { fail?: string } } }>;

function suite(file: string, stories: Composed) {
  describe(file, () => {
    for (const [name, Story] of Object.entries(stories)) {
      it(name, async () => {
        const { container } = render(<Story />);
        await act(() => new Promise((r) => setTimeout(r, 250))); // the mock backend answers after 150 ms
        const fail = Story.parameters.dpdp?.fail;
        if (fail === "load") expect(container.querySelector('[role="alert"]')).not.toBeNull();
        else expect(container.querySelector('[role="alert"]')).toBeNull();
        const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
        expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });
    }
  });
}

suite("ConsentNotice", composeStories(consentNotice));
suite("PreferenceCenter", composeStories(preferenceCenter));
suite("RightsRequestForm", composeStories(rightsRequestForm));
suite("LanguageSwitcher", composeStories(languageSwitcher));
suite("AgeGate", composeStories(ageGate));
suite("GuardianFlow", composeStories(guardianFlow));
suite("Examples", composeStories(examples));
