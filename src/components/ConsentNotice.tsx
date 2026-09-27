import type { ConsentState, Notice } from "@dpdpkit/client";
import { useEffect, useId, useState } from "react";
import { useDpdp } from "../context";
import { useConsent, useNotice } from "../hooks";

export function NoticeLinks({ notice }: { notice: Notice }) {
  const { labels } = useDpdp();
  const links: Array<[string, string]> = [
    ["withdraw", labels.withdrawLink],
    ["rights", labels.rightsLink],
    ["board_complaint", labels.boardLink],
  ];
  return (
    <nav className="dpdp-links" aria-label={labels.rightsLink}>
      <ul>
        {links.map(([key, text]) =>
          notice.links[key] ? (
            <li key={key}>
              <a href={notice.links[key]}>{text}</a>
            </li>
          ) : null,
        )}
      </ul>
    </nav>
  );
}

export interface ConsentNoticeProps {
  /** Called with the recorded states after the principal saves their choices. */
  onSaved?: (states: ConsentState[]) => void;
  className?: string;
}

/**
 * Itemised notice with one toggle per consent purpose. Nothing is pre-ticked: a box is ticked only if
 * the principal previously gave that consent. "Accept all", "Reject all" and "Save my choices" have
 * equal weight.
 */
export function ConsentNotice({ onSaved, className }: ConsentNoticeProps) {
  const { labels } = useDpdp();
  const { notice, loading, error } = useNotice();
  const { consents, record } = useConsent();
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const headingId = useId();
  const baseId = useId();

  useEffect(() => {
    setChoices(Object.fromEntries(consents.map((c) => [c.purpose, c.status === "granted"])));
  }, [consents]);

  if (loading && !notice) return <p role="status">{labels.loading}</p>;
  if (error || !notice) return <p role="alert">{labels.error}</p>;

  const consentPurposes = notice.purposes.filter((p) => p.legal_basis === "consent");
  const otherPurposes = notice.purposes.filter((p) => p.legal_basis !== "consent");

  async function save(values: Record<string, boolean>) {
    if (!notice) return;
    setStatus("saving");
    try {
      const states = await record(
        consentPurposes.map((p) => ({ purpose: p.id, granted: values[p.id] === true })),
        notice.version,
        notice.locale,
      );
      setStatus("saved");
      onSaved?.(states);
    } catch {
      setStatus("error");
    }
  }

  const all = (granted: boolean) => Object.fromEntries(consentPurposes.map((p) => [p.id, granted]));
  const busy = status === "saving";

  return (
    <section className={["dpdp", "dpdp-notice", className].filter(Boolean).join(" ")} aria-labelledby={headingId} lang={notice.locale}>
      <h2 id={headingId}>{notice.title}</h2>
      {notice.body ? <p className="dpdp-body">{notice.body}</p> : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(choices);
        }}
      >
        <fieldset className="dpdp-purposes">
          <legend className="dpdp-visually-hidden">{notice.title}</legend>
          {consentPurposes.map((p) => {
            const inputId = `${baseId}-${p.id}`;
            return (
              <div className="dpdp-purpose" key={p.id}>
                <input
                  type="checkbox"
                  id={inputId}
                  name={p.id}
                  checked={choices[p.id] === true}
                  aria-describedby={`${inputId}-desc`}
                  onChange={(e) => setChoices({ ...choices, [p.id]: e.target.checked })}
                />
                <label htmlFor={inputId}>
                  <span className="dpdp-purpose-title">{p.title}</span>
                  {p.required ? <span className="dpdp-badge">{labels.neededForService}</span> : null}
                </label>
                <div id={`${inputId}-desc`} className="dpdp-purpose-desc">
                  {p.description ? <p>{p.description}</p> : null}
                  <p className="dpdp-data-items">
                    {labels.dataUsed}: {p.data_items.join(", ")}
                  </p>
                </div>
              </div>
            );
          })}
        </fieldset>
        {otherPurposes.length > 0 ? (
          <details className="dpdp-other">
            <summary>{labels.noConsentNeeded}</summary>
            <ul>
              {otherPurposes.map((p) => (
                <li key={p.id}>
                  {p.title} ({p.data_items.join(", ")})
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <div className="dpdp-actions">
          <button type="button" className="dpdp-button" disabled={busy} onClick={() => void save(all(false))}>
            {labels.rejectAll}
          </button>
          <button type="button" className="dpdp-button" disabled={busy} onClick={() => void save(all(true))}>
            {labels.acceptAll}
          </button>
          <button type="submit" className="dpdp-button" disabled={busy}>
            {labels.saveChoices}
          </button>
        </div>
        <p className="dpdp-status" role="status" aria-live="polite">
          {status === "saved" ? labels.saved : status === "error" ? labels.error : ""}
        </p>
      </form>
      <NoticeLinks notice={notice} />
    </section>
  );
}
