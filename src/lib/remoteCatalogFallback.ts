/// Hardcoded catalog placeholders for books that exist in
/// `ALL_PACK_IDS` (and have artwork in `cover-overrides/`) but
/// don't yet have a `.fishbones` archive shipping in
/// `src-tauri/resources/bundled-packs/`.
///
/// Background: the desktop catalog is built by enumerating the
/// bundled-packs directory at runtime (see `fetchDesktopCatalog`
/// in `lib/catalog.ts`). That returns ONLY books we ship the
/// archive for — every entry it produces has a `localPath` and
/// installs offline. Any pack id in `ALL_PACK_IDS` whose archive
/// hasn't been authored yet is invisible to Discover, so the
/// shelf empties out as soon as the user has installed everything
/// we ship.
///
/// To keep Discover populated with the next-up books (so cover
/// artwork actually surfaces and the shelf reads as an aspirational
/// catalog rather than "you've finished everything"), we merge in
/// these synthetic placeholder entries. They render on the Discover
/// grid via the standard `placeholderCourseFromCatalog` path; clicking
/// install attempts the remote download from `archiveUrl` on
/// mattssoftware.com — which 404s today, surfacing the existing
/// "install failed" toast cleanly. Once the .fishbones is authored
/// and uploaded to the CDN (or dropped into bundled-packs/), the
/// matching local catalog entry wins via `dedupeById` and this
/// fallback row drops out automatically.
///
/// Keep IDs aligned with `cover-overrides/<id>.{jpg,png}` and the
/// prompt headings in `prompts.md`. Drop a row when its archive
/// lands in bundled-packs/ — leaving a duplicate is harmless (the
/// dedupe layer prefers the live entry) but the file stays cleaner.

import type { CatalogEntry } from "./catalog";

/// CDN base for remote `.fishbones` archives — kept in lockstep with
/// `REMOTE_ARCHIVE_BASE` in `scripts/course-tiers.mjs` (which is .mjs
/// for the build script and so can't be imported from runtime TS).
/// If we ever move the catalog hosting elsewhere, change both.
const REMOTE_ARCHIVE_BASE = "https://mattssoftware.com/fishbones/courses";

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

const FALLBACK_SEEDS: FallbackSeed[] = [
  // ── Long-form Rust deep dives ─────────────────────────────────
  {
    id: "rust-by-example",
    title: "Rust by Example",
    author: "The Rust Project",
    language: "rust",
  },
  {
    id: "the-async-book-rust",
    title: "The Async Book (Rust)",
    author: "The Rust Project",
    language: "rust",
  },
  // NOTE: "The Rustonomicon" not listed here — it ships under the
  // `rustonomicon` short-form id in bundled-packs, so the live local
  // catalog entry already covers it. Adding `the-rustonomicon` here
  // too would produce a duplicate Discover tile for the same book.

  // ── CS fundamentals ───────────────────────────────────────────
  {
    id: "algorithms-erickson",
    title: "Algorithms",
    author: "Jeff Erickson",
    language: "python",
  },
  {
    id: "open-data-structures",
    title: "Open Data Structures",
    author: "Pat Morin",
    language: "java",
  },
  {
    id: "pro-git",
    title: "Pro Git",
    author: "Scott Chacon, Ben Straub",
    language: "web",
  },
  {
    id: "composing-programs",
    title: "Composing Programs",
    author: "John DeNero",
    language: "python",
  },

  // ── Frameworks + libraries ────────────────────────────────────
  {
    id: "learning-svelte",
    title: "Learning Svelte",
    author: "svelte.dev",
    language: "svelte",
  },
  {
    id: "svelte-5-complete",
    title: "Svelte 5 Complete",
    author: "Libre.academy",
    language: "svelte",
  },
  {
    id: "solidjs-fundamentals",
    title: "SolidJS Fundamentals",
    author: "Libre.academy",
    language: "solid",
  },
  {
    id: "htmx-fundamentals",
    title: "HTMX Fundamentals",
    author: "Libre.academy",
    language: "htmx",
  },
  {
    id: "astro-fundamentals",
    title: "Astro Fundamentals",
    author: "Libre.academy",
    language: "astro",
  },
  {
    id: "react-native",
    title: "React Native",
    author: "Libre.academy",
    language: "reactnative",
  },
  {
    id: "learning-react-native",
    title: "Learning React Native",
    author: "Bonnie Eisenman",
    language: "reactnative",
  },
  {
    id: "tauri-2-fundamentals",
    title: "Tauri 2 Fundamentals",
    author: "Libre.academy",
    language: "tauri",
  },
  {
    id: "bun-complete",
    title: "Bun: The Complete Runtime",
    author: "Libre.academy",
    language: "bun",
  },

  // ── Smart-contract / web3 / crypto ────────────────────────────
  {
    id: "mastering-lightning-network",
    title: "Mastering Lightning Network",
    author: "Andreas M. Antonopoulos, Olaoluwa Osuntokun, René Pickhardt",
    language: "javascript",
  },
  {
    id: "vyper-fundamentals-pythonic-smart-contracts",
    title: "Vyper Fundamentals: Pythonic Smart Contracts",
    author: "Libre.academy",
    language: "vyper",
  },
  // NOTE: "Solana Programs" ships as `solana-programs` in bundled-packs
  // (not `solana-programs-rust-on-the-svm`), so the live local entry
  // covers it. Same alias-vs-inner-id story as the-rustonomicon above.
  {
    id: "viem-and-ethers-js-talking-to-ethereum-from-typescript",
    title: "viem and ethers.js: Talking to Ethereum from TypeScript",
    author: "Libre.academy",
    language: "typescript",
  },
  {
    id: "cryptography-fundamentals-hashes-to-zk",
    title: "Cryptography Fundamentals: Hashes to ZK",
    author: "Libre.academy",
    language: "javascript",
  },
  {
    id: "solidity-smart-contracts-from-first-principles",
    title: "Solidity: Smart Contracts from First Principles",
    author: "Libre.academy",
    language: "solidity",
  },
];

/// Resolve a fallback seed to a full CatalogEntry. The web build
/// serves covers from `/starter-courses/<id>.jpg`, the desktop
/// binary's `load_course_cover` IPC reads from the same per-id
/// path on the CDN — both paths land on the JPEG produced by
/// `extract-starter-courses.mjs` from the cover-override master.
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

/// True when an id corresponds to one of the fallback placeholders
/// (i.e. has no real archive yet). Surfaces in the install-click
/// handler so the UI can show a friendlier "coming soon" toast
/// instead of a generic 404 if we want to differentiate later.
export function isRemoteFallbackId(id: string): boolean {
  return FALLBACK_SEEDS.some((s) => s.id === id);
}
