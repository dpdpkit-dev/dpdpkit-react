import { useId } from "react";
import { useDpdp } from "../context";
import { useNotice } from "../hooks";

function languageName(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Offers every language the current notice is published in. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { labels, setLocale } = useDpdp();
  const { notice } = useNotice();
  const id = useId();
  if (!notice || notice.available_locales.length < 2) return null;
  return (
    <div className={["dpdp", "dpdp-language", className].filter(Boolean).join(" ")}>
      <label htmlFor={id}>{labels.language}</label>{" "}
      <select id={id} value={notice.locale} onChange={(e) => setLocale(e.target.value)}>
        {notice.available_locales.map((code) => (
          <option key={code} value={code} lang={code}>
            {languageName(code)}
          </option>
        ))}
      </select>
    </div>
  );
}
