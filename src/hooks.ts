import type { ConsentState, Decision, Notice, RequestKind, RightsRequest } from "@dpdpkit/client";
import { useCallback, useEffect, useState } from "react";
import { useDpdp } from "./context";

// Stable empties: a fresh [] on every render would retrigger effects that depend on these lists.
const NO_CONSENTS: ConsentState[] = [];
const NO_REQUESTS: RightsRequest[] = [];

interface Async<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
}

function useAsync<T>(load: () => Promise<T>, deps: unknown[]): Async<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    load().then(
      (value) => {
        if (!live) return;
        setData(value);
        setError(undefined);
        setLoading(false);
      },
      (err: unknown) => {
        if (!live) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      },
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}

/** The current notice in the provider's locale. */
export function useNotice() {
  const { client, locale } = useDpdp();
  const state = useAsync(() => client.getNotice(locale), [client, locale]);
  return { notice: state.data as Notice | undefined, loading: state.loading, error: state.error, reload: state.reload };
}

/** The principal's current consents, with grant/withdraw actions that refresh every consumer. */
export function useConsent() {
  const { client, version, bump } = useDpdp();
  const state = useAsync(() => client.myConsents(), [client, version]);
  const record = useCallback(
    async (decisions: Decision[], noticeVersion?: number, locale?: string) => {
      const result = await client.recordConsents(decisions, { noticeVersion, locale });
      bump();
      return result;
    },
    [client, bump],
  );
  const withdraw = useCallback(
    async (purpose: string) => {
      const result = await client.withdraw(purpose);
      bump();
      return result;
    },
    [client, bump],
  );
  return {
    consents: state.data ?? NO_CONSENTS,
    loading: state.loading,
    error: state.error,
    record,
    withdraw,
    reload: state.reload,
  };
}

/** The principal's rights requests, with an action to open a new one. */
export function useRequests() {
  const { client } = useDpdp();
  const state = useAsync(() => client.myRequests(), [client]);
  const open = useCallback(
    async (kind: RequestKind, details: Record<string, unknown> = {}) => {
      const created = await client.openRequest(kind, details);
      state.reload();
      return created;
    },
    [client, state.reload],
  );
  return {
    requests: state.data ?? NO_REQUESTS,
    loading: state.loading,
    error: state.error,
    open,
    reload: state.reload,
  };
}
