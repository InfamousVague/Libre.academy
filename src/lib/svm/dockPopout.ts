/// Popout-window plumbing for the SvmDock — mirrors `evm/dockPopout.ts`
/// so the two dock surfaces have an identical "open in own window"
/// affordance. The popped window re-loads the app at `?svmDock=1`
/// and `main.tsx` routes to a tiny `SvmDockPopoutView` (just the
/// dock in popout variant) — nothing else from the App tree mounts.
///
/// Same caveat as the EVM popout: in Tauri each WebviewWindow gets
/// its own JS realm, so the popout has its own LiteSVM singleton —
/// fine for now because we never DRIVE the chain from the popout,
/// only display it. The main window owns the runtime; the popout
/// reads it via the chainSyncBus that mirrors snapshots across
/// windows. (The bus isn't wired for SVM yet — Phase 4 — so the
/// popout will currently show an empty chain until a sync channel
/// exists. Acceptable for the initial cut.)

function isTauri(): boolean {
  return (
    typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__ !== "undefined"
  );
}

const POPOUT_LABEL = "svm-dock";
const POPOUT_TITLE = "Libre — Local SVM";

type StateListener = (popped: boolean) => void;
const listeners = new Set<StateListener>();
let isPopped = false;

function setPopped(next: boolean) {
  if (isPopped === next) return;
  isPopped = next;
  for (const l of listeners) {
    try {
      l(next);
    } catch (e) {
      console.warn("[svmDock] popout listener threw:", e);
    }
  }
}

/// Subscribe to popout open/close. Returns an unsubscribe handle.
/// Callbacks receive `true` when the popout is open, `false` when
/// it has closed. Fires immediately with the current state to match
/// the `useSyncExternalStore` contract.
export function subscribeSvmDockPopout(listener: StateListener): () => void {
  listeners.add(listener);
  try {
    listener(isPopped);
  } catch (e) {
    console.warn("[svmDock] popout listener threw on subscribe:", e);
  }
  return () => {
    listeners.delete(listener);
  };
}

export function isSvmDockPoppedOut(): boolean {
  return isPopped;
}

export async function openSvmDockPopout(): Promise<void> {
  const base = new URL(window.location.href);
  // Strip params that would route the popout into a lesson — we
  // only want the dock UI, nothing else.
  base.searchParams.delete("course");
  base.searchParams.delete("lesson");
  base.searchParams.delete("popped");
  base.searchParams.delete("phone");
  base.searchParams.delete("scope");
  base.searchParams.delete("files");
  base.searchParams.delete("evmDock");
  base.searchParams.delete("btcDock");
  base.searchParams.set("svmDock", "1");
  const url = base.toString();

  if (isTauri()) {
    try {
      const { WebviewWindow } = await import(
        "@tauri-apps/api/webviewWindow"
      );
      const existing = await WebviewWindow.getByLabel(POPOUT_LABEL);
      if (existing) {
        await existing.setFocus();
        // If we already had it open and the listener registry was
        // re-mounted (e.g. after HMR), reaffirm the popped state.
        setPopped(true);
        return;
      }
      const win = new WebviewWindow(POPOUT_LABEL, {
        url,
        title: POPOUT_TITLE,
        width: 720,
        height: 520,
        minWidth: 520,
        minHeight: 380,
        resizable: true,
        decorations: true,
      });
      setPopped(true);
      // `tauri://destroyed` fires after the OS window has been torn
      // down; flip our state back so the embedded banner re-mounts.
      // `once` so we don't leak the listener if the user re-pops.
      void win.once("tauri://destroyed", () => {
        setPopped(false);
      });
      return;
    } catch (e) {
      console.warn(
        "[svmDock] Tauri popout failed, falling back to window.open:",
        e,
      );
    }
  }

  // Web fallback. LiteSVM doesn't run in the browser so this path is
  // largely vestigial — kept for symmetry with the EVM popout in
  // case we ever ship a browser-friendly SVM stub.
  const features = "popup=yes,width=720,height=520,resizable=yes";
  const w = window.open(url, POPOUT_LABEL, features);
  if (!w) return;
  setPopped(true);
  const poll = window.setInterval(() => {
    if (w.closed) {
      window.clearInterval(poll);
      setPopped(false);
    }
  }, 600);
}

/// Close the popped SVM dock window if one is open. Symmetric with
/// `closeEvmDockPopout` so callers have a uniform API across the
/// two dock popouts.
export async function closeSvmDockPopout(): Promise<void> {
  if (isTauri()) {
    try {
      const { WebviewWindow } = await import(
        "@tauri-apps/api/webviewWindow"
      );
      const win = await WebviewWindow.getByLabel(POPOUT_LABEL);
      if (win) await win.close();
    } catch (e) {
      console.warn("[svmDock] Tauri close failed:", e);
    }
  }
  // Browser fallback: window.open() returns a handle, but we don't
  // hold it across calls. Best effort — the user can close the OS
  // window manually. The poll loop set up at open time will flip
  // the popped state back on its own.
  setPopped(false);
}
