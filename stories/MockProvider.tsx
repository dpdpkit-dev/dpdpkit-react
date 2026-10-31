import { useState, type ReactNode } from "react";
import { DpdpProvider, type Labels } from "../src";
import { mockClient, type MockOptions } from "./mockClient";

export interface MockProviderProps extends MockOptions {
  /** Initial locale for the provider. */
  locale?: string;
  labels?: Partial<Labels>;
  children: ReactNode;
}

/** `DpdpProvider` wired to a fresh in-memory backend. Story parameters (`parameters.dpdp`) land here. */
export function MockProvider({ locale, labels, children, ...options }: MockProviderProps) {
  const [client] = useState(() => mockClient(options));
  return (
    <DpdpProvider client={client} locale={locale} labels={labels}>
      {children}
    </DpdpProvider>
  );
}
