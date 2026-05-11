/// One-shot "reset account to default state" orchestrator.
///
/// Wipes every piece of progress + achievement state across both
/// local stores AND the cloud relay so the learner can start fresh
/// from a clean slate without having to delete + re-create their
/// account. Designed to be safe to call from a button click — never
/// throws, always returns a structured report describing what
/// landed and what didn't.
///
/// What it WIPES (account state — earned, not chosen):
///   - Tauri SQLite / IndexedDB completions (lesson progress)
///   - localStorage["fb:achievements:unlocked"]        (badges)
///   - localStorage["fb:achievements:freezes-used"]    (counter)
///   - localStorage["fb:streak-shields:v1"]            (per-week budget)
///   - localStorage["fb:streak-frozen-days:v1"]        (frozen day keys)
///   - localStorage["fishbones-practice-history-v1"]   (SRS records)
///   - localStorage["fishbones:practice:records:v1"]   (newer practice store)
///   - localStorage["fishbones:practice:today:v1"]     (today's practice
///                                                      session counters)
///   - localStorage["fishbones:recent-courses:v1"]     (recents row)
///   - localStorage["fishbones:notifications:last-seen-at"] (drawer marker)
///   - Relay: DELETE /fishbones/progress (best-effort; falls back to
///     local-only if the relay doesn't ship the route)
///
/// What it KEEPS (preferences — chosen, not earned):
///   - Sign-in token + cached user (the account itself isn't deleted —
///     `cloud.deleteAccount()` is the heavier door; this just wipes
///     PROGRESS data on it)
///   - Theme, locale, library view mode, sfx volume, dev console flag
///   - AI host config, install/update banner dismissals
///   - Open tabs / playground files (workbench state, not progress)
///
/// The split exists because the user asked for "back to default state
/// to start fresh" — that's about the gameified earned-progress layer,
/// not their UI choices. If they want a full nuke they can use
/// `cloud.deleteAccount()` and re-onboard.

import { storage } from "./storage";
import type { UseFishbonesCloud } from "../hooks/useFishbonesCloud";

/// localStorage keys that carry account-state-shaped data. Kept here
/// (not imported from the constituent modules) because most of those
/// modules expose the key only as a private `const STORAGE_KEY` —
/// duplicating the literal at this single coordinator gives us a
/// scannable list of "what counts as progress" without exporting
/// internals from a dozen call sites. If a new persisted progress
/// surface ships, add its key here.
const ACCOUNT_STATE_KEYS: readonly string[] = [
  // Achievements
  "fb:achievements:unlocked",
  "fb:achievements:freezes-used",
  // Streak shields + frozen-day registry
  "fb:streak-shields:v1",
  "fb:streak-frozen-days:v1",
  // Practice history (two key generations — the older flat-history
  // hook + the newer per-record store both persist independently;
  // wipe both so the SRS schedule starts from scratch)
  "fishbones-practice-history-v1",
  "fishbones:practice:records:v1",
  "fishbones:practice:today:v1",
  // Recents row + notification drawer marker
  "fishbones:recent-courses:v1",
  "fishbones:notifications:last-seen-at",
];

export interface ResetAccountReport {
  /// True when local completions + every account-state localStorage
  /// key were successfully cleared.
  localCleared: boolean;
  /// True when the relay confirmed it wiped the user's progress
  /// rows. False when the user wasn't signed in OR the relay route
  /// isn't implemented OR the network call failed — the local wipe
  /// still went through, but other devices won't sync the empty
  /// state automatically until they manually reset too.
  relayCleared: boolean;
  /// Human-readable summary the UI can surface as a toast. Always
  /// populated, even on success.
  message: string;
}

export async function resetAccount(
  cloud: Pick<UseFishbonesCloud, "resetProgress" | "signedIn">,
): Promise<ResetAccountReport> {
  let localCleared = true;
  let relayCleared = false;

  // Wipe completions in the active backend (Tauri SQLite or IDB).
  try {
    await storage.clearAllCompletions();
  } catch (e) {
    localCleared = false;
    // eslint-disable-next-line no-console
    console.warn("[reset] clearAllCompletions failed:", e);
  }

  // Wipe each progress-shaped localStorage key. Each removeItem is
  // independent — a failure on one key (quota, private mode) doesn't
  // strand the rest. We dispatch a synthetic StorageEvent for keys
  // the live UI subscribes to so the React tree re-renders without
  // a reload (same trick the existing "Reset unlocked achievements"
  // button uses for the achievements key).
  if (typeof localStorage !== "undefined") {
    for (const key of ACCOUNT_STATE_KEYS) {
      try {
        localStorage.removeItem(key);
        // Synthetic storage event lets cross-tab listeners and the
        // useAchievements/useStreakShields hooks pick up the wipe in
        // this tab too (the native storage event only fires in OTHER
        // tabs).
        if (typeof window !== "undefined") {
          try {
            window.dispatchEvent(new StorageEvent("storage", { key }));
          } catch {
            /* SSR / older browsers — ignore */
          }
        }
      } catch (e) {
        localCleared = false;
        // eslint-disable-next-line no-console
        console.warn(`[reset] removeItem(${key}) failed:`, e);
      }
    }
  }

  // Best-effort relay wipe. The cloud helper handles its own error
  // surfaces — we just translate the boolean into our report.
  if (cloud.signedIn) {
    try {
      relayCleared = await cloud.resetProgress();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[reset] resetProgress threw:", e);
      relayCleared = false;
    }
  }

  const parts: string[] = [];
  if (localCleared) parts.push("local progress wiped");
  else parts.push("local wipe partially failed (see console)");
  if (cloud.signedIn) {
    parts.push(
      relayCleared
        ? "cloud progress wiped — other devices will sync the empty state on next pull"
        : "cloud wipe didn't go through (relay route missing or offline) — sign out + back in on each device to force-pull the local state",
    );
  } else {
    parts.push("not signed in, so cross-device sync was skipped");
  }
  return {
    localCleared,
    relayCleared,
    message: parts.join(". ") + ".",
  };
}
