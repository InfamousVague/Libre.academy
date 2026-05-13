/// Top-level achievement-presentation surface. App.tsx renders one
/// of these at the document root and feeds it the queue of newly-
/// unlocked achievements from `useAchievements.checkAfterCompletion`.
///
/// Behaviour:
///   - Every unlock currently routes through `meta.presentation` ===
///     "modal" (all four tiers — bronze through platinum — were
///     promoted on 2026-05-11 so every unlock gets the centred badge
///     + coin-shower mask treatment that was previously gold/platinum-
///     only). Modals show one at a time; multiple unlocks coming in
///     the same beat (rare — usually a streak hit + a level milestone
///     simultaneously) chain: the first modal dismisses to reveal
///     the next one.
///   - The toast path (`presentation === "toast"`, top-right column,
///     up to 3 visible at once) is retained because it's still a
///     valid presentation option in the schema — if a future tier
///     wants the lighter affordance (e.g. low-stakes "you opened
///     Settings" type unlocks), flipping `presentation: "toast"` in
///     TIER_META reactivates the column without further wiring.
///
/// The component is purely presentational. The owning hook decides
/// which achievements to enqueue + when. The renderer handles
/// timing, exit transitions, and the queue mechanics.

import { useEffect, useState } from "react";

import type { Achievement } from "../../data/achievements";
import { TIER_META } from "../../data/achievements";
import AchievementToast from "./AchievementToast";
import AchievementModal from "./AchievementModal";
import "./Achievements.css";

interface Props {
  /// Append-only queue of unlocks to present. Adding an item here
  /// triggers the renderer to surface it (in tier order); removing
  /// items is a no-op (keeps re-renders cheap when the parent diffs
  /// the array).
  pending: readonly Achievement[];
  /// Called once an item has been fully presented (toast dismissed
  /// OR modal closed). The parent uses this to drop the item from
  /// the pending queue so it doesn't re-render.
  onPresented: (id: string) => void;
}

const MAX_VISIBLE_TOASTS = 3;

export default function AchievementOverlay({ pending, onPresented }: Props) {
  // Local mirror of the parent's pending array, partitioned into
  // toasts (visible) + queued (waiting). We track the visible set
  // here because the parent's array can grow asynchronously, and
  // moving items "from queued to visible" is an internal scheduling
  // concern.
  const [visibleToasts, setVisibleToasts] = useState<Achievement[]>([]);
  const [activeModal, setActiveModal] = useState<Achievement | null>(null);

  useEffect(() => {
    // Reconcile: any pending items not already shown go in the back
    // of the queue. We never duplicate.
    const seen = new Set<string>([
      ...visibleToasts.map((a) => a.id),
      ...(activeModal ? [activeModal.id] : []),
    ]);
    const next: Achievement[] = [];
    for (const a of pending) {
      if (!seen.has(a.id)) {
        next.push(a);
        seen.add(a.id);
      }
    }
    if (next.length === 0) return;

    // Bronze + silver: enqueue toast, ensuring at most
    // MAX_VISIBLE_TOASTS at once. If we're already at the max, the
    // remaining ones wait in the parent's queue and re-flow next
    // tick when a toast dismisses — we don't try to manage two
    // separate queues here.
    const newToasts: Achievement[] = [];
    let modalCandidate: Achievement | null = activeModal;
    for (const a of next) {
      const meta = TIER_META[a.tier];
      if (meta.presentation === "modal") {
        if (!modalCandidate) {
          modalCandidate = a;
        }
        // If a modal is already showing, the next gold/platinum
        // waits in the parent queue until the current one
        // dismisses. Don't drop it here — it'll come back in the
        // next reconcile pass.
      } else if (visibleToasts.length + newToasts.length < MAX_VISIBLE_TOASTS) {
        newToasts.push(a);
      }
      // else: stays in the parent queue for next pass
    }

    if (newToasts.length > 0) {
      setVisibleToasts((prev) => [...prev, ...newToasts]);
    }
    if (modalCandidate && !activeModal) {
      setActiveModal(modalCandidate);
    }
    // The hook contract: we report items as presented only when the
    // user actually sees them. So toasts get reported on dismiss
    // (below), modals on close (below). Items that fall through to
    // the parent queue stay there and we'll see them next pass.
    // Items we DID schedule (toast or modal) get marked as "in our
    // hands now" — we'll fire onPresented when they finish their
    // run.
    // Intentionally not calling onPresented here.
  }, [pending, visibleToasts, activeModal]);

  const dismissToast = (id: string) => {
    setVisibleToasts((prev) => prev.filter((a) => a.id !== id));
    onPresented(id);
  };

  const dismissModal = () => {
    if (!activeModal) return;
    const id = activeModal.id;
    setActiveModal(null);
    onPresented(id);
  };

  return (
    <>
      {visibleToasts.length > 0 ? (
        <div className="libre-ach-toast-column" aria-live="polite">
          {visibleToasts.map((a) => (
            <AchievementToast
              key={a.id}
              achievement={a}
              onDismiss={() => dismissToast(a.id)}
            />
          ))}
        </div>
      ) : null}
      {activeModal ? (
        <AchievementModal
          key={activeModal.id}
          achievement={activeModal}
          onDismiss={dismissModal}
        />
      ) : null}
    </>
  );
}
