/// Aspirational Discover tiles that point at content not yet shipped.
///
/// HISTORY: this list used to carry ~20 placeholder entries for books
/// in `cover-overrides/` whose `.fishbones` archive hadn't been
/// authored yet. The Discover grid would render the cover so the
/// shelf read as aspirational rather than empty; clicking install
/// attempted a CDN download that 404'd, surfacing a generic error
/// alert. By design — once the archive shipped, the matching local
/// catalog entry would win via `dedupeById` and the placeholder row
/// would drop out automatically.
///
/// CURRENT STATE: the static CDN at `mattssoftware.com/fishbones/
/// courses/` is gone — every `.fishbones` URL 404s, including the
/// books that have local archives shipping in the bundle (those work
/// via the Tauri `localPath` install path, not the CDN). All ~20
/// placeholders here pointed at dead URLs and produced "couldn't
/// install: HTTP 404" toasts on every click.
///
/// Wiped 2026-05-10 as part of the catalog cleanup. The two consumers
/// (`fetchCatalog` in lib/catalog.ts, the App.tsx install handler's
/// `isRemoteFallbackId` check) keep working against an empty list:
/// `fetchCatalog` just merges nothing, `isRemoteFallbackId` always
/// returns false. Re-add a seed here if we ever stand the CDN back
/// up AND have an archive to point at.

import type { CatalogEntry } from "./catalog";

interface FallbackSeed {
  id: string;
  title: string;
  author: string;
  language: CatalogEntry["language"];
  packType?: CatalogEntry["packType"];
  /// Rough archive size hint for the Discover tile's "X MB to
  /// download" label. Real value lands once the archive ships.
  archiveSizeBytes?: number;
}

/// CDN base for remote `.fishbones` archives — kept in lockstep with
/// `REMOTE_ARCHIVE_BASE` in `scripts/course-tiers.mjs`. Currently
/// unused (the seed list is empty) but retained so re-adding a seed
/// is a one-line change rather than a recompose.
const REMOTE_ARCHIVE_BASE = "https://mattssoftware.com/fishbones/courses";

const FALLBACK_SEEDS: FallbackSeed[] = [];

/// Resolve a fallback seed to a full CatalogEntry. Currently unused
/// (FALLBACK_SEEDS is empty) — kept so re-adding a seed is a single
/// push without re-deriving the URL math.
function seedToEntry(seed: FallbackSeed): CatalogEntry {
  return {
    id: seed.id,
    packId: seed.id,
    title: seed.title,
    author: seed.author,
    language: seed.language,
    file: `${seed.id}.json`,
    cover: `${seed.id}.jpg`,
    sizeBytes: seed.archiveSizeBytes ?? 0,
    archiveSizeBytes: seed.archiveSizeBytes ?? 0,
    archiveUrl: `${REMOTE_ARCHIVE_BASE.replace(/\/$/, "")}/${seed.id}.fishbones`,
    tier: "remote",
    packType: seed.packType ?? "course",
    releaseStatus: "UNREVIEWED",
  };
}

export const REMOTE_CATALOG_FALLBACK: CatalogEntry[] =
  FALLBACK_SEEDS.map(seedToEntry);

/// True when an id corresponds to one of the fallback placeholders.
/// With the seed list empty this always returns false; the App.tsx
/// install handler's pre-check still calls it so re-introducing a
/// seed automatically activates the friendly "coming soon" toast.
export function isRemoteFallbackId(id: string): boolean {
  return FALLBACK_SEEDS.some((s) => s.id === id);
}
