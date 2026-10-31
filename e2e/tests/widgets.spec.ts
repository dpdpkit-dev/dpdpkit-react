import { createRequire } from "node:module";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// A fresh principal per test keeps tests independent against the shared backend.
let counter = 0;
const newUser = () => `e2e_${Date.now().toString(36)}_${counter++}`;
const as = (user: string) => ({ headers: { "X-User": user } });

async function open(page: Page, user: string) {
  await page.goto(`/?user=${user}`);
  await expect(page.locator(".dpdp-notice h2")).toBeVisible();
}

async function consentStatus(request: APIRequestContext, user: string, purpose: string) {
  const body = await (await request.get("/dpdp/consents/me", as(user))).json();
  return body.consents.find((c: { purpose: string }) => c.purpose === purpose)?.status;
}

test("notice comes from the API, nothing is pre-ticked, and it switches language", async ({ page }) => {
  await open(page, newUser());
  const notice = page.locator(".dpdp-notice");
  await expect(notice.getByRole("heading", { name: "How we use your personal data" })).toBeVisible();
  const boxes = notice.getByRole("checkbox");
  await expect(boxes).toHaveCount(2);
  for (const box of await boxes.all()) await expect(box).not.toBeChecked();
  await expect(notice.getByRole("link", { name: "Complain to the Data Protection Board" })).toHaveAttribute(
    "href",
    /board-complaint/,
  );

  await page.getByLabel("Language").selectOption("hi");
  await expect(notice.getByRole("heading", { name: "हम आपके व्यक्तिगत डेटा का उपयोग कैसे करते हैं" })).toBeVisible();
  await expect(notice).toHaveAttribute("lang", "hi");
});

test("saving choices records consent and unlocks the gated endpoint", async ({ page, request }) => {
  const user = newUser();
  expect((await request.post("/offers/send", as(user))).status()).toBe(403);
  await open(page, user);
  const notice = page.locator(".dpdp-notice");
  await notice.getByLabel("Send you offers").check();
  await notice.getByRole("button", { name: "Save my choices" }).click();
  await expect(notice.getByRole("status")).toHaveText("Your choices have been saved.");

  expect(await consentStatus(request, user, "marketing")).toBe("granted");
  expect(await consentStatus(request, user, "account")).toBe("denied"); // an unticked box is recorded as no
  expect((await request.post("/offers/send", as(user))).status()).toBe(200);
  await expect(page.locator(".dpdp-preferences").getByRole("button", { name: "Withdraw: Send you offers" })).toBeVisible();
});

test("withdrawing in the preference centre takes effect immediately", async ({ page, request }) => {
  const user = newUser();
  await open(page, user);
  await page.locator(".dpdp-notice").getByRole("button", { name: "Accept all" }).click();
  const prefs = page.locator(".dpdp-preferences");
  await prefs.getByRole("button", { name: "Withdraw: Send you offers" }).click();
  await expect(prefs.getByRole("button", { name: "Give consent: Send you offers" })).toBeVisible();
  await expect(prefs.locator(".dpdp-state-withdrawn")).toHaveText("Withdrawn");

  const blocked = await request.post("/offers/send", as(user));
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).error.code).toBe("consent_required");

  await prefs.getByText("History of your choices").click();
  await expect(prefs.locator(".dpdp-history li")).toHaveCount(3); // grant account, grant marketing, withdraw
  await expect(prefs.locator(".dpdp-history li").last()).toContainText("withdraw");
});

test("a rights request reaches the admin queue with its deadline", async ({ page, request }) => {
  const user = newUser();
  await open(page, user);
  const form = page.locator("form", { has: page.getByRole("button", { name: "Submit request" }) });
  await form.getByLabel("What would you like to do?").selectOption("erasure");
  await form.getByLabel("Details").fill("Please delete my account.");
  await form.getByRole("button", { name: "Submit request" }).click();
  const status = form.getByRole("status");
  await expect(status).toContainText("Request received. Reference:");
  const reference = (await status.textContent())?.match(/rq_[0-9a-f]+/)?.[0];
  expect(reference).toBeTruthy();

  const queue = await (await request.get("/dpdp/admin/requests?open=true", as("staff"))).json();
  const item = queue.items.find((r: { id: string }) => r.id === reference);
  expect(item).toMatchObject({ principal: user, kind: "erasure", status: "received" });
  expect(new Date(item.due_at).getTime()).toBeGreaterThan(Date.now());
});

test("no accessibility violations in a real browser (axe-core)", async ({ page }) => {
  await open(page, newUser());
  await page.getByText("History of your choices").click();
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve("axe-core/axe.min.js") });
  const violations = await page.evaluate(async () => {
    type Axe = { run: (ctx: string) => Promise<{ violations: Array<{ id: string; help: string }> }> };
    const result = await (window as unknown as { axe: Axe }).axe.run("#root");
    return result.violations.map((v) => `${v.id}: ${v.help}`);
  });
  expect(violations).toEqual([]);
});
