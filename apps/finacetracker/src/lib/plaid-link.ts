export const PLAID_LINK_TOKEN_KEY = "plaid_link_token";
export const PLAID_UPDATE_ITEM_KEY = "finacetracker.plaid-update-item";
const SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

export interface PlaidLinkHandler {
  open: () => void;
  destroy?: () => void;
}

interface PlaidLinkOptions {
  token: string;
  receivedRedirectUri?: string;
  onSuccess: (publicToken: string) => void;
  onExit: () => void;
}

declare global {
  interface Window {
    Plaid?: { create: (options: PlaidLinkOptions) => PlaidLinkHandler };
  }
}

let loading: Promise<void> | null = null;

/** Both initial Link and OAuth resume share one bounded script load. */
export function loadPlaidScript(): Promise<void> {
  if (window.Plaid) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      if (error) {
        script.remove();
        reject(error);
      } else resolve();
    };
    const loaded = () => {
      if (window.Plaid) finish();
    };
    const failed = () => finish(new Error("Failed to load Plaid. Try again."));
    const poll = setInterval(loaded, 100);
    const timeout = setTimeout(() => finish(new Error("Plaid did not load. Try again.")), 10_000);
    script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    if (!existing) {
      script.src = SCRIPT_SRC;
      document.body.appendChild(script);
    }
  }).finally(() => {
    loading = null;
  });
  return loading;
}

/** Clear the resumable token only after the server confirms the link is saved. */
export async function exchangePlaidToken(publicToken: string): Promise<{ institutionName: string; warning?: string }> {
  const response = await fetch("/api/plaid/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_token: publicToken }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Could not link your bank. Try again from Settings.");
  try {
    localStorage.removeItem(PLAID_LINK_TOKEN_KEY);
  } catch {
    // A saved connection remains valid when browser storage is unavailable.
  }
  return {
    institutionName: typeof data?.institutionName === "string" ? data.institutionName : "bank",
    ...(typeof data?.warning === "string" ? { warning: data.warning } : {}),
  };
}

/** Complete update mode without exchanging or replacing the existing item. */
export async function completePlaidUpdate(itemId: string): Promise<{ institutionName: string; warning?: string }> {
  const response = await fetch("/api/plaid/reconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId }) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Could not refresh the existing connection. Retry from Settings.");
  try { localStorage.removeItem(PLAID_LINK_TOKEN_KEY); localStorage.removeItem(PLAID_UPDATE_ITEM_KEY); } catch {}
  return data;
}
