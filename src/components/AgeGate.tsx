import { useId, useState, type FormEvent } from "react";
import { useDpdp } from "../context";

export interface AgeResult {
  /** Age in whole years today. */
  age: number;
  /** True when the age is below `minAge`: verifiable guardian consent is needed (DPDP s.9). */
  isChild: boolean;
}

export interface AgeGateProps {
  /** Age of majority (default 18). */
  minAge?: number;
  onResult: (result: AgeResult) => void;
  className?: string;
}

/** Whole years between `birth` (YYYY-MM-DD) and `today`; undefined for an invalid or future date. */
export function ageOn(birth: string, today: Date = new Date()): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return undefined;
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1;
  return age >= 0 ? age : undefined;
}

/**
 * Asks for a date of birth and reports whether the person is a child. The date is used in the browser only:
 * it is never stored or sent, and only the resulting age and verdict reach `onResult`.
 */
export function AgeGate({ minAge = 18, onResult, className }: AgeGateProps) {
  const { labels } = useDpdp();
  const [birth, setBirth] = useState("");
  const [invalid, setInvalid] = useState(false);
  const id = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const age = ageOn(birth);
    if (age === undefined) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onResult({ age, isChild: age < minAge });
  }

  return (
    <section className={["dpdp", "dpdp-agegate", className].filter(Boolean).join(" ")} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{labels.ageGateTitle}</h2>
      <form onSubmit={submit}>
        <div className="dpdp-field">
          <label htmlFor={`${id}-dob`}>{labels.birthDate}</label>
          <input
            id={`${id}-dob`}
            type="date"
            required
            value={birth}
            aria-describedby={`${id}-hint`}
            aria-invalid={invalid || undefined}
            onChange={(e) => setBirth(e.target.value)}
          />
          <small id={`${id}-hint`}>{labels.ageGateHint}</small>
        </div>
        <div className="dpdp-actions">
          <button type="submit" className="dpdp-button">
            {labels.continue}
          </button>
        </div>
        <p role="status" aria-live="polite" className="dpdp-status">
          {invalid ? labels.error : ""}
        </p>
      </form>
    </section>
  );
}
