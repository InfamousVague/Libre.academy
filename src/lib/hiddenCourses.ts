/// Runtime allow-listing for courses that should NEVER appear in
/// the public Library or Discover surfaces, regardless of what's
/// stored locally. Single source of truth on the TS side; mirrors
/// `HIDDEN_PACK_IDS` in `scripts/course-tiers.mjs` (which controls
/// what gets stamped onto the catalog manifest at build time).
///
/// Why a runtime set in addition to the manifest flag: the manifest
/// flag covers FRESH seeds (a course saved to IndexedDB or Tauri
/// SQLite for the first time picks up `hidden: true` in the saved
/// record). But existing installs that had the course before the
/// flag flipped — laptop opened the app two months ago, course
/// extracted to disk, app closed — still have the flag-less record,
/// and the per-record `c.hidden` filter never fires for them.
/// Layering this runtime set on top means the filter trips off the
/// id alone, no matter what state the local copy is in.
///
/// Keep this in lockstep with `HIDDEN_PACK_IDS` in
/// `scripts/course-tiers.mjs`. Adding a new id here without adding
/// it there means the next manifest regen won't carry the flag, and
/// future fresh installs will leak it briefly (between manifest
/// fetch and the next runtime filter pass — usually invisible, but
/// worth keeping the two in sync).
export const HIDDEN_COURSE_IDS: ReadonlySet<string> = new Set<string>([
  // (empty — hellotrade graduated to Discover with the public BETA.
  // Add a pack id here AND in `HIDDEN_PACK_IDS` in
  // `scripts/course-tiers.mjs` AND in `HIDDEN_DESKTOP_PACK_IDS` in
  // `src/lib/catalog.ts` to fully hide a course from public browse
  // surfaces — all three sets need to carry the id or the course
  // leaks back into one of them.)
]);

/// Predicate for filtering a Course / CatalogEntry / id-bearing
/// shape. Returns true when the course should NOT appear in
/// public-facing browse surfaces (Library, Discover, mobile grid,
/// search palette). Direct-link install + `.fishbones` import paths
/// don't go through this filter — they continue to work for the
/// hidden ids.
export function isHiddenCourse(id: string): boolean {
  return HIDDEN_COURSE_IDS.has(id);
}
