"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Slice = { rice: number; nuruk: number };
type Settings = Record<string, Slice>;

type Ctx = {
  get: (id: string) => Slice | undefined;
  set: (id: string, v: Slice) => void;
  ready: boolean;
  saving: boolean;
};

const BrewCtx = createContext<Ctx | null>(null);
const LS_KEY = "brew.scaler.v1";

export function BrewProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Settings>({});
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load: localStorage first (instant), then the blob (source of truth).
  useEffect(() => {
    let alive = true;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setMap(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    fetch("/api/state")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: unknown) => {
        if (
          alive &&
          data &&
          typeof data === "object" &&
          Object.keys(data as object).length
        ) {
          setMap((prev) => ({ ...prev, ...(data as Settings) }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: Settings) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (timer.current) clearTimeout(timer.current);
    setSaving(true);
    timer.current = setTimeout(() => {
      fetch("/api/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      })
        .catch(() => {})
        .finally(() => setSaving(false));
    }, 700);
  }, []);

  const set = useCallback(
    (id: string, v: Slice) => {
      setMap((prev) => {
        const next = { ...prev, [id]: v };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const get = useCallback((id: string) => map[id], [map]);

  return (
    <BrewCtx.Provider value={{ get, set, ready, saving }}>
      {children}
    </BrewCtx.Provider>
  );
}

export function useBrew(id: string, defaults: Slice) {
  const ctx = useContext(BrewCtx);
  const slice = ctx?.get(id);
  return {
    rice: slice?.rice ?? defaults.rice,
    nuruk: slice?.nuruk ?? defaults.nuruk,
    ready: ctx?.ready ?? false,
    saving: ctx?.saving ?? false,
    customized: slice != null,
    setSlice: (v: Slice) => ctx?.set(id, v),
  };
}
