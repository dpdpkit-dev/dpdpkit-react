import type { RequestKind, RightsRequest } from "@dpdpkit/client";
import { useId, useState, type FormEvent } from "react";
import { useDpdp } from "../context";
import { useRequests } from "../hooks";

const KINDS: RequestKind[] = ["access", "correction", "completion", "updating", "erasure", "nomination", "grievance"];

export interface RightsRequestFormProps {
  /** Limit the kinds offered (all by default). */
  kinds?: RequestKind[];
  onSubmitted?: (request: RightsRequest) => void;
  /** Show the principal's existing requests under the form (default true). */
  showRequests?: boolean;
  className?: string;
}

export function RightsRequestForm({ kinds = KINDS, onSubmitted, showRequests = true, className }: RightsRequestFormProps) {
  const { labels, locale } = useDpdp();
  const { requests, open } = useRequests();
  const [kind, setKind] = useState<RequestKind>(kinds[0] ?? "access");
  const [details, setDetails] = useState("");
  const [nominee, setNominee] = useState({ name: "", contact: "", relationship: "" });
  const [created, setCreated] = useState<RightsRequest>();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFailed(false);
    try {
      const body =
        kind === "nomination"
          ? { name: nominee.name, contact: nominee.contact, relationship: nominee.relationship || undefined }
          : details
            ? { text: details }
            : {};
      const req = await open(kind, body);
      setCreated(req);
      setDetails("");
      onSubmitted?.(req);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale);

  return (
    <section className={["dpdp", "dpdp-rights", className].filter(Boolean).join(" ")} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{labels.requestTitle}</h2>
      <form onSubmit={(e) => void submit(e)}>
        <div className="dpdp-field">
          <label htmlFor={`${id}-kind`}>{labels.requestKind}</label>
          <select id={`${id}-kind`} value={kind} onChange={(e) => setKind(e.target.value as RequestKind)}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {labels.kinds[k]}
              </option>
            ))}
          </select>
        </div>
        {kind === "nomination" ? (
          <>
            <div className="dpdp-field">
              <label htmlFor={`${id}-nname`}>{labels.nomineeName}</label>
              <input id={`${id}-nname`} required value={nominee.name} onChange={(e) => setNominee({ ...nominee, name: e.target.value })} />
            </div>
            <div className="dpdp-field">
              <label htmlFor={`${id}-ncontact`}>{labels.nomineeContact}</label>
              <input
                id={`${id}-ncontact`}
                required
                value={nominee.contact}
                onChange={(e) => setNominee({ ...nominee, contact: e.target.value })}
              />
            </div>
            <div className="dpdp-field">
              <label htmlFor={`${id}-nrel`}>{labels.nomineeRelationship}</label>
              <input id={`${id}-nrel`} value={nominee.relationship} onChange={(e) => setNominee({ ...nominee, relationship: e.target.value })} />
            </div>
          </>
        ) : (
          <div className="dpdp-field">
            <label htmlFor={`${id}-details`}>{labels.requestDetails}</label>
            <textarea id={`${id}-details`} rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
        )}
        <div className="dpdp-actions">
          <button type="submit" className="dpdp-button" disabled={busy}>
            {labels.submitRequest}
          </button>
        </div>
        <p role="status" aria-live="polite" className="dpdp-status">
          {failed
            ? labels.error
            : created
              ? `${labels.requestSubmitted} ${created.id}. ${labels.dueBy} ${date(created.due_at)}.`
              : ""}
        </p>
      </form>
      {showRequests && requests.length > 0 ? (
        <>
          <h3>{labels.yourRequests}</h3>
          <table className="dpdp-requests">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">{labels.requestKind}</th>
                <th scope="col">{labels.status}</th>
                <th scope="col">{labels.dueBy}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{labels.kinds[r.kind]}</td>
                  <td>{r.status.replace("_", " ")}</td>
                  <td>
                    <time dateTime={r.due_at}>{date(r.due_at)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
