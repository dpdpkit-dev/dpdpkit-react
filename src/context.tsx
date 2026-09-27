import { createDpdpClient, type ClientOptions, type DpdpClient } from "@dpdpkit/client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultLabels, type Labels } from "./labels";

interface DpdpContextValue {
  client: DpdpClient;
  locale: string | undefined;
  setLocale: (locale: string) => void;
  labels: Labels;
  /** Bumped after any consent change so every mounted hook refetches. */
  version: number;
  bump: () => void;
}

const DpdpContext = createContext<DpdpContextValue | null>(null);

export interface DpdpProviderProps {
  /** A ready client, or options to create one (e.g. `{ baseUrl: "/dpdp" }`). */
  client?: DpdpClient;
  options?: ClientOptions;
  /** Initial locale; the notice falls back to the policy's default language. */
  locale?: string;
  /** Override interface labels (button text and similar). Legal text always comes from the notice. */
  labels?: Partial<Labels>;
  children: ReactNode;
}

export function DpdpProvider({ client, options, locale: initialLocale, labels, children }: DpdpProviderProps) {
  const [locale, setLocale] = useState(initialLocale);
  const [version, setVersion] = useState(0);
  const resolved = useMemo(() => {
    if (client) return client;
    if (!options) throw new Error("DpdpProvider needs a client or options");
    return createDpdpClient(options);
  }, [client, options]);
  const value = useMemo<DpdpContextValue>(
    () => ({
      client: resolved,
      locale,
      setLocale,
      labels: { ...defaultLabels, ...labels },
      version,
      bump: () => setVersion((v) => v + 1),
    }),
    [resolved, locale, labels, version],
  );
  return <DpdpContext.Provider value={value}>{children}</DpdpContext.Provider>;
}

export function useDpdp(): DpdpContextValue {
  const ctx = useContext(DpdpContext);
  if (!ctx) throw new Error("dpdpkit hooks and components must be inside <DpdpProvider>");
  return ctx;
}
