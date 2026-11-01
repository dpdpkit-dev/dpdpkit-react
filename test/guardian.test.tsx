import type { DpdpClient } from "@dpdpkit/client";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgeGate, ageOn, DpdpProvider, GuardianFlow, type GuardianApi } from "../src";

afterEach(cleanup);

const client = {} as unknown as DpdpClient;
const wrap = (ui: React.ReactNode) => <DpdpProvider client={client}>{ui}</DpdpProvider>;

async function expectAccessible(container: HTMLElement) {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

describe("ageOn", () => {
  const today = new Date(2027, 5, 15);
  it("counts whole years", () => {
    expect(ageOn("2009-06-15", today)).toBe(18);
    expect(ageOn("2009-06-16", today)).toBe(17);
  });
  it("rejects invalid and future dates", () => {
    expect(ageOn("2027-02-30", today)).toBeUndefined();
    expect(ageOn("2030-01-01", today)).toBeUndefined();
    expect(ageOn("", today)).toBeUndefined();
  });
});

describe("AgeGate", () => {
  it("reports a child without sending the date anywhere", async () => {
    const onResult = vi.fn();
    const { container } = render(wrap(<AgeGate onResult={onResult} />));
    const year = new Date().getFullYear() - 10;
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: `${year}-01-01` } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ isChild: true }));
    await expectAccessible(container);
  });

  it("reports an adult", () => {
    const onResult = vi.fn();
    render(wrap(<AgeGate onResult={onResult} />));
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ isChild: false }));
  });
});

describe("GuardianFlow", () => {
  function fakeApi(): GuardianApi {
    return {
      start: vi.fn(async ({ method }) => ({ id: "gv_1", method, status: "pending" as const, redirect_url: "https://verify.example/x" })),
      callback: vi.fn(async ({ verification_id }) => ({
        id: verification_id,
        method: "digilocker_token" as const,
        status: "verified" as const,
        verified_at: "2027-06-01T09:00:00Z",
      })),
    };
  }

  it("starts, redirects and completes verification", async () => {
    const api = fakeApi();
    const onVerified = vi.fn();
    const { container } = render(wrap(<GuardianFlow api={api} guardianRef="g-1" onVerified={onVerified} />));
    fireEvent.change(screen.getByLabelText("How will the guardian be verified?"), { target: { value: "digilocker_token" } });
    fireEvent.click(screen.getByRole("button", { name: "Start verification" }));
    const link = await screen.findByRole("link", { name: "Continue to the verifier" });
    expect(link.getAttribute("href")).toBe("https://verify.example/x");
    expect(api.start).toHaveBeenCalledWith({ method: "digilocker_token", guardian_ref: "g-1" });
    expect(screen.getByRole("status").textContent).toContain("Waiting");
    await expectAccessible(container);

    fireEvent.change(screen.getByLabelText("Code or token from the verifier"), { target: { value: "tok" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete verification" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Guardian verified."));
    expect(api.callback).toHaveBeenCalledWith({ verification_id: "gv_1", token: "tok" });
    expect(onVerified).toHaveBeenCalledOnce();
  });

  it("shows an error when the backend fails", async () => {
    const api = fakeApi();
    api.start = vi.fn().mockRejectedValue(new Error("boom"));
    render(wrap(<GuardianFlow api={api} />));
    fireEvent.click(screen.getByRole("button", { name: "Start verification" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Something went wrong"));
  });
});
