/// Cross-device library-list sync (bidirectional, last-write-wins,
/// gated against accidental seed-clobbers).
///
/// Background: progress / solutions / settings already round-trip
/// across devices via `useRealtimeSync`, but the LIBRARY (which
/// courses each device has locally) was never synced. Desktop seeds
/// from `bundled-packs/` (a curated set the Tauri shell extracts on
/// first launch) and the user installs / removes books over time;
/// mobile (web build, IndexedDB) seeds from
/// `/starter-courses/manifest.json` (a default ~19-course set baked
/// into the deployed website). The two sets diverge — and once they
/// diverge, mobile shows books the user never installed on their
/// "real" library, which feels broken.
///
/// Fix: piggyback on the existing settings sync. Both desktop and
/// mobile publish their installed-course-id list under a well-known
/// settings key whenever the local list changes; both pull + apply
/// the cloud's value into a per-device "perception" set; the visible
/// library on each device is the intersection of perception + local
/// content store.
///
/// Seed-clobber guard: mobile's first-launch seed is a generic 19-
/// course default that the user didn't explicitly pick. Pushing that
/// seed unconditionally would overwrite a desktop user's curated
/// list with mobile's defaults whenever mobile signs in fresh. So
/// mobile only publishes once it has received a cloud baseline — the
/// caller checks `allowlist !== null` before pushing on local
/// changes. Desktop has no such gate: its bundled-packs seed IS the
/// user's explicit choice (they installed the desktop app to get
/// those books), so every local change pushes.
///
/// "Desktop priority" semantics: when a fresh account is in play,
/// desktop's first push wins because it fires immediately on the
/// first-launch seed; mobile defers until it sees the cloud value.
/// After both devices have synced, last-write-wins applies.
///
/// The key is namespaced + versioned so we can evolve the payload
/// shape without colliding with any future preference key the
/// settings store grows.

/// Reserved settings key for the user's installed-course-id list.
/// Value is a JSON-encoded sorted `string[]`. Reading code MUST
/// tolerate a missing key (no allowlist published yet) and parse
/// defensively (older versions might have written a different shape).
export const LIBRARY_INSTALLED_IDS_KEY = "fishbones.library.installedIds";

/// Parse the JSON-encoded library allowlist. Returns null when the
/// value is absent / unparseable / not an array of strings — null
/// means "no published allowlist, render every local course" so the
/// pre-sync first-launch path works without special-casing.
export function parseLibraryAllowlist(raw: string | null | undefined): Set<string> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const ids = parsed.filter((v): v is string => typeof v === "string");
    return new Set(ids);
  } catch {
    return null;
  }
}

/// Serialise an installed-course-id list into the wire format
/// (sorted JSON array). Sorting yields a deterministic string so
/// the "did this change since last push?" check is a trivial
/// string compare instead of a set diff.
export function serializeLibraryAllowlist(ids: Iterable<string>): string {
  const out = Array.from(new Set(ids));
  out.sort();
  return JSON.stringify(out);
}

/// Apply a local-course-list change to a perception set. Used by the
/// mobile push effect to compute "what should the cloud allowlist
/// look like after the user just installed F" — we don't replace the
/// allowlist with the local list (that would drop desktop-only IDs
/// the device doesn't have content for), we union+diff so additions
/// and removals propagate without clobbering the other device's
/// portion of the union.
export function reconcilePerception(
  perception: Set<string>,
  localIds: Iterable<string>,
  previousLocalIds: Iterable<string>,
): Set<string> {
  const local = new Set(localIds);
  const previous = new Set(previousLocalIds);
  const next = new Set(perception);
  // Newly-added local courses: extend the allowlist.
  for (const id of local) {
    if (!previous.has(id)) next.add(id);
  }
  // Removed local courses: contract the allowlist.
  for (const id of previous) {
    if (!local.has(id)) next.delete(id);
  }
  return next;
}
