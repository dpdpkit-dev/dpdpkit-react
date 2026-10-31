// An in-memory stand-in for a dpdpkit backend, so the published Storybook runs without a server.
// It keeps state per client instance: consents, history and requests change as you click.
import type { ConsentState, DpdpClient, Notice, PrincipalExport, RequestKind, RightsRequest } from "@dpdpkit/client";

const NOTICES: Record<string, Omit<Notice, "version" | "locale" | "content_hash" | "published_at" | "links" | "available_locales">> = {
  en: {
    title: "How Example Shop uses your data",
    body: "Choose what you agree to. You can change your mind at any time from your privacy settings.",
    purposes: [
      {
        id: "account",
        title: "Run your account and deliver orders",
        description: "Sign-in, order tracking and delivery updates.",
        data_items: ["Name", "Email address", "Phone number", "Delivery address"],
        legal_basis: "consent",
        required: true,
      },
      {
        id: "marketing",
        title: "Send you offers",
        description: "Emails about sales and new products, at most once a week.",
        data_items: ["Email address", "Order history"],
        legal_basis: "consent",
        required: false,
      },
      {
        id: "analytics",
        title: "Improve the shop",
        description: "Which pages you visit, so we can fix what is hard to use.",
        data_items: ["Pages visited", "Device type"],
        legal_basis: "consent",
        required: false,
      },
      { id: "invoices", title: "Keep tax invoices", data_items: ["Name", "Billing address"], legal_basis: "s7_d", required: false },
    ],
  },
  hi: {
    title: "Example Shop आपके डेटा का उपयोग कैसे करता है",
    body: "चुनें कि आप किस बात के लिए सहमति देते हैं। आप अपनी गोपनीयता सेटिंग में कभी भी अपना निर्णय बदल सकते हैं।",
    purposes: [
      {
        id: "account",
        title: "आपका खाता चलाना और ऑर्डर पहुँचाना",
        data_items: ["नाम", "ईमेल पता", "फ़ोन नंबर", "डिलीवरी का पता"],
        legal_basis: "consent",
        required: true,
      },
      { id: "marketing", title: "आपको ऑफ़र भेजना", data_items: ["ईमेल पता", "ऑर्डर इतिहास"], legal_basis: "consent", required: false },
      { id: "analytics", title: "दुकान को बेहतर बनाना", data_items: ["देखे गए पेज", "डिवाइस का प्रकार"], legal_basis: "consent", required: false },
      { id: "invoices", title: "टैक्स इनवॉइस रखना", data_items: ["नाम", "बिलिंग पता"], legal_basis: "s7_d", required: false },
    ],
  },
};

export interface MockOptions {
  /** Consents the principal already has, by purpose. */
  consents?: Record<string, ConsentState["status"]>;
  /** Rights requests the principal already opened. */
  requests?: Array<Pick<RightsRequest, "kind" | "status">>;
  /** Languages the notice is published in (default English and Hindi). */
  locales?: string[];
  /** `load`: every read fails. `save`: reads work, every write fails. `never`: reads never finish. */
  fail?: "load" | "save" | "never";
}

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

export function mockClient({ consents = {}, requests = [], locales = ["en", "hi"], fail }: MockOptions = {}): DpdpClient {
  const start = Date.now() - 20 * DAY;
  let events = 0;
  const state = new Map<string, ConsentState>();
  const history: Array<{ purpose: string; action: string; occurred_at: string; notice_version: number | null }> = [];
  for (const [purpose, status] of Object.entries(consents)) {
    const at = iso(start + 7 * DAY);
    state.set(purpose, { purpose, status, notice_version: 3, updated_at: at, event_id: `ev_${++events}` });
    if (status === "withdrawn") history.push({ purpose, action: "granted", occurred_at: iso(start), notice_version: 3 });
    history.push({ purpose, action: status, occurred_at: at, notice_version: status === "withdrawn" ? null : 3 });
  }
  const opened: RightsRequest[] = requests.map((r, i) => ({
    id: `rq_${1000 + i}`,
    kind: r.kind,
    status: r.status,
    opened_at: iso(start + i * DAY),
    due_at: iso(start + (i + 30) * DAY),
    max_due_at: iso(start + (i + 90) * DAY),
    overdue: false,
  }));

  const read = async <T>(value: () => T): Promise<T> => {
    if (fail === "never") return new Promise<T>(() => {});
    await new Promise((r) => setTimeout(r, 150));
    if (fail === "load") throw new Error("Service unavailable (mock)");
    return value();
  };
  const write = async <T>(value: () => T): Promise<T> => {
    await new Promise((r) => setTimeout(r, 300));
    if (fail === "save") throw new Error("Service unavailable (mock)");
    return value();
  };
  const set = (purpose: string, status: ConsentState["status"], version: number | null) => {
    const s: ConsentState = { purpose, status, notice_version: version, updated_at: iso(Date.now()), event_id: `ev_${++events}` };
    state.set(purpose, s);
    history.push({ purpose, action: status, occurred_at: s.updated_at, notice_version: version });
    return s;
  };

  const client = {
    getNotice: (locale?: string) =>
      read((): Notice => {
        const code = locale && locales.includes(locale) && NOTICES[locale] ? locale : (locales[0] ?? "en");
        return {
          ...(NOTICES[code] ?? NOTICES.en!),
          version: 3,
          locale: code,
          content_hash: "0".repeat(64),
          published_at: iso(start),
          links: { withdraw: "#privacy-settings", rights: "#your-rights", board_complaint: "#data-protection-board" },
          available_locales: locales,
        };
      }),
    myConsents: () => read(() => [...state.values()]),
    recordConsents: (decisions: Array<{ purpose: string; granted: boolean }>) =>
      write(() => decisions.map((d) => set(d.purpose, d.granted ? "granted" : "denied", 3))),
    withdraw: (purpose: string) => write(() => set(purpose, "withdrawn", null)),
    myRequests: () => read(() => [...opened]),
    openRequest: (kind: RequestKind, details: Record<string, unknown> = {}) =>
      write(() => {
        const now = Date.now();
        const req: RightsRequest = {
          id: `rq_${1000 + opened.length}`,
          kind,
          status: "received",
          opened_at: iso(now),
          due_at: iso(now + 30 * DAY),
          max_due_at: iso(now + 90 * DAY),
          details,
          overdue: false,
        };
        opened.push(req);
        return req;
      }),
    exportMyData: () =>
      read(
        (): PrincipalExport => ({
          principal: "storybook-user",
          generated_at: iso(Date.now()),
          consents: [...state.values()],
          consent_history: [...history],
          requests: [],
          purposes: [],
        }),
      ),
  };
  return client as unknown as DpdpClient;
}
