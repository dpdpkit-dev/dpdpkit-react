import type { ConsentState, DpdpClient, Notice, RightsRequest } from "@dpdpkit/client";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsentNotice, DpdpProvider, LanguageSwitcher, PreferenceCenter, RightsRequestForm } from "../src";

afterEach(cleanup);

function makeNotice(locale = "en"): Notice {
  return {
    version: 3,
    locale,
    content_hash: "a".repeat(64),
    published_at: "2027-01-01T00:00:00Z",
    title: locale === "hi" ? "हम आपके डेटा का उपयोग कैसे करते हैं" : "How we use your data",
    body: "Choose what you agree to.",
    purposes: [
      { id: "account", title: "Run your account", data_items: ["Email address"], legal_basis: "consent", required: true },
      { id: "marketing", title: "Send offers", data_items: ["Email address"], legal_basis: "consent", required: false },
      { id: "billing", title: "Tax invoices", data_items: ["Name"], legal_basis: "s7_d", required: false },
    ],
    links: { withdraw: "/privacy/prefs", rights: "/privacy/rights", board_complaint: "/privacy/board" },
    available_locales: ["en", "hi"],
  };
}

function fakeClient() {
  const consents = new Map<string, ConsentState>();
  const requests: RightsRequest[] = [];
  const now = "2027-06-01T09:00:00Z";
  const client = {
    getNotice: vi.fn(async (locale?: string) => makeNotice(locale === "hi" ? "hi" : "en")),
    myConsents: vi.fn(async () => [...consents.values()]),
    recordConsents: vi.fn(async (decisions: Array<{ purpose: string; granted: boolean }>) =>
      decisions.map((d) => {
        const s: ConsentState = { purpose: d.purpose, status: d.granted ? "granted" : "denied", notice_version: 3, updated_at: now, event_id: `e-${d.purpose}` };
        consents.set(d.purpose, s);
        return s;
      }),
    ),
    withdraw: vi.fn(async (purpose: string) => {
      const s: ConsentState = { purpose, status: "withdrawn", notice_version: null, updated_at: now, event_id: "w" };
      consents.set(purpose, s);
      return s;
    }),
    myRequests: vi.fn(async () => [...requests]),
    openRequest: vi.fn(async (kind: RightsRequest["kind"], details: Record<string, unknown>) => {
      const r: RightsRequest = { id: `rq_${requests.length + 1}`, kind, status: "received", opened_at: now, due_at: "2027-07-01T09:00:00Z", max_due_at: "2027-08-30T09:00:00Z", details, overdue: false };
      requests.push(r);
      return r;
    }),
    exportMyData: vi.fn(async () => ({ principal: "u1", generated_at: now, consents: [], requests: [], purposes: [], consent_history: [] })),
  };
  return { client: client as unknown as DpdpClient, raw: client, consents };
}

async function expectAccessible(container: HTMLElement) {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

describe("ConsentNotice", () => {
  it("itemises consent purposes with nothing pre-ticked and shows required links", async () => {
    const { client } = fakeClient();
    const { container } = render(
      <DpdpProvider client={client}>
        <ConsentNotice />
      </DpdpProvider>,
    );
    await screen.findByRole("heading", { name: "How we use your data" });
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(2); // billing relies on a legal basis other than consent: no toggle
    boxes.forEach((b) => expect((b as HTMLInputElement).checked).toBe(false));
    expect(screen.getByRole("link", { name: "Withdraw consent" }).getAttribute("href")).toBe("/privacy/prefs");
    expect(screen.getByRole("link", { name: "Complain to the Data Protection Board" })).toBeTruthy();
    await expectAccessible(container);
  });

  it("records one decision per purpose against the notice version", async () => {
    const { client, raw } = fakeClient();
    const onSaved = vi.fn();
    render(
      <DpdpProvider client={client}>
        <ConsentNotice onSaved={onSaved} />
      </DpdpProvider>,
    );
    fireEvent.click(await screen.findByLabelText(/Send offers/));
    fireEvent.click(screen.getByRole("button", { name: "Save my choices" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(raw.recordConsents).toHaveBeenCalledWith(
      [
        { purpose: "account", granted: false },
        { purpose: "marketing", granted: true },
      ],
      { noticeVersion: 3, locale: "en" },
    );
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Your choices have been saved."));
  });

  it("gives reject-all the same weight as accept-all", async () => {
    const { client, raw } = fakeClient();
    render(
      <DpdpProvider client={client}>
        <ConsentNotice />
      </DpdpProvider>,
    );
    const reject = await screen.findByRole("button", { name: "Reject all" });
    const accept = screen.getByRole("button", { name: "Accept all" });
    expect(reject.className).toBe(accept.className);
    fireEvent.click(reject);
    await waitFor(() => expect(raw.recordConsents).toHaveBeenCalled());
    expect(raw.recordConsents.mock.calls[0]![0].every((d: { granted: boolean }) => !d.granted)).toBe(true);
  });
});

describe("PreferenceCenter", () => {
  it("withdraws with one click", async () => {
    const { client, raw } = fakeClient();
    await client.recordConsents([{ purpose: "marketing", granted: true }]);
    const { container } = render(
      <DpdpProvider client={client}>
        <PreferenceCenter />
      </DpdpProvider>,
    );
    const button = await screen.findByRole("button", { name: "Withdraw: Send offers" });
    await expectAccessible(container);
    fireEvent.click(button);
    await waitFor(() => expect(raw.withdraw).toHaveBeenCalledWith("marketing"));
    expect(await screen.findByRole("button", { name: "Give consent: Send offers" })).toBeTruthy();
  });
});

describe("RightsRequestForm", () => {
  it("opens a request and shows its reference and due date", async () => {
    const { client, raw } = fakeClient();
    const { container } = render(
      <DpdpProvider client={client} locale="en-IN">
        <RightsRequestForm />
      </DpdpProvider>,
    );
    await expectAccessible(container);
    fireEvent.change(screen.getByLabelText("What would you like to do?"), { target: { value: "erasure" } });
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "Please delete my account" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
    await waitFor(() => expect(raw.openRequest).toHaveBeenCalledWith("erasure", { text: "Please delete my account" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("rq_1"));
    expect(await screen.findByRole("table")).toBeTruthy();
  });

  it("asks for nominee details for a nomination", async () => {
    const { client, raw } = fakeClient();
    render(
      <DpdpProvider client={client}>
        <RightsRequestForm />
      </DpdpProvider>,
    );
    fireEvent.change(screen.getByLabelText("What would you like to do?"), { target: { value: "nomination" } });
    fireEvent.change(screen.getByLabelText("Nominee's name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Nominee's email or phone"), { target: { value: "asha@example.in" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
    await waitFor(() =>
      expect(raw.openRequest).toHaveBeenCalledWith("nomination", { name: "Asha", contact: "asha@example.in", relationship: undefined }),
    );
  });
});

describe("LanguageSwitcher", () => {
  it("switches the notice language", async () => {
    const { client, raw } = fakeClient();
    render(
      <DpdpProvider client={client}>
        <LanguageSwitcher />
        <ConsentNotice />
      </DpdpProvider>,
    );
    const select = await screen.findByLabelText("Language");
    await act(async () => {
      fireEvent.change(select, { target: { value: "hi" } });
    });
    expect(await screen.findByRole("heading", { name: "हम आपके डेटा का उपयोग कैसे करते हैं" })).toBeTruthy();
    expect(raw.getNotice).toHaveBeenLastCalledWith("hi");
  });
});
