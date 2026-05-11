/// One-shot localStorage key migration to the unified `libre:`
/// namespace.
///
/// History of prefixes used by this app, all of which carried real
/// user state at one point or another:
///   - `kata:*`         — the very first generation; the app was
///                        codenamed "Kata" before the rename to
///                        Fishbones in 2025.
///   - `fishbones:*`    — the long-form prefix introduced with the
///                        Fishbones brand. Used for cloud auth tokens,
///                        cached user object, tour state, install /
///                        update banner dismissals, etc.
///   - `fb:*`           — short-form prefix introduced later for
///                        newer state surfaces (achievements,
///                        streak shields, sfx settings, catalog
///                        cache). Picked short to keep the persisted
///                        JSON keys compact.
///
/// After the Libre rebrand the source code reads + writes a single
/// `libre:*` prefix. This module ports any value still sitting under
/// one of the three legacy prefixes over to the new prefix, then
/// removes the old key so the storage doesn't grow forever. Runs
/// exactly once per device (gated by a sentinel under `libre:
/// migrations:storage-keys-v1`) so subsequent boots are cheap O(1).
///
/// Idempotent: if a learner has BOTH the old and new keys somehow
/// (e.g., they ran a dev build that already wrote a `libre:` key
/// before the production sweep), the new key wins and the old is
/// dropped. This preserves the recency-of-write order users expect.
///
/// Called from `main.tsx` BEFORE React mounts, so any hook reading
/// localStorage during initial state computation already sees the
/// migrated value. Fail-soft — any individual key write that throws
/// (quota / private mode / parse error) is logged and skipped so
/// one bad row doesn't strand the rest of the migration.

const MIGRATION_SENTINEL = "libre:migrations:storage-keys-v1";

/// Legacy prefixes to rewrite. Order matters only in that the
/// migration walks every key once and rewrites whichever prefix
/// matches first — so a key like `kata:fishbones:nested` (which
/// shouldn't exist but isn't forbidden) would land at
/// `libre:fishbones:nested` rather than getting double-mapped.
/// Real keys use exactly one prefix; the order is just defensive.
const LEGACY_PREFIXES = ["fishbones:", "fb:", "kata:"] as const;

const NEW_PREFIX = "libre:";

export function migrateLegacyStorageKeys(): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (localStorage.getItem(MIGRATION_SENTINEL) === "1") return;
  } catch {
    // Private mode / quota / cookies disabled — bail. The migration
    // is best-effort; if storage is broken the app has bigger
    // problems anyway and re-running on a future boot when storage
    // works is fine.
    return;
  }

  // Snapshot the keys first because we'll be mutating the store
  // (setItem of the new key + removeItem of the old) inside the
  // loop and the live key list could shift under us.
  let keys: string[] = [];
  try {
    keys = Object.keys(localStorage);
  } catch {
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const oldKey of keys) {
    const matchedPrefix = LEGACY_PREFIXES.find((p) => oldKey.startsWith(p));
    if (!matchedPrefix) continue;
    const newKey = NEW_PREFIX + oldKey.slice(matchedPrefix.length);
    if (oldKey === newKey) continue;

    try {
      // If the new key already has a value, prefer it — the user has
      // already written under the new prefix in some path (recent
      // dev build, cross-tab race, etc.) and we don't want to clobber
      // it with the stale legacy value. Just drop the legacy row.
      const existingNew = localStorage.getItem(newKey);
      if (existingNew === null) {
        const value = localStorage.getItem(oldKey);
        if (value !== null) localStorage.setItem(newKey, value);
      }
      localStorage.removeItem(oldKey);
      migrated += 1;
    } catch (e) {
      skipped += 1;
      // eslint-disable-next-line no-console
      console.warn(
        `[storage-migration] failed to migrate "${oldKey}" → "${newKey}":`,
        e,
      );
    }
  }

  try {
    localStorage.setItem(MIGRATION_SENTINEL, "1");
  } catch {
    // If we can't write the sentinel, the migration will re-run on
    // next boot. That's a no-op because all the source keys are
    // already migrated, so the loop above just finds nothing to do.
  }

  if (migrated > 0 || skipped > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[storage-migration] libre rename: migrated ${migrated} legacy key(s), skipped ${skipped}.`,
    );
  }
}
