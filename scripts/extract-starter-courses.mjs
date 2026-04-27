#!/usr/bin/env node
/// Extract a curated subset of the bundled .fishbones packs into
/// `public/starter-courses/` so the web build can fetch them at
/// first-launch and seed IndexedDB.
///
/// We only ship packs whose primary language has a browser-native
/// runtime — anything that needs a system compiler (C / C++ / Java /
/// Kotlin / C# / Assembly / Swift) gets skipped because the web
/// build can't run those lessons anyway. SvelteKit is also skipped
/// (Node sidecar required); plain Svelte 5 CSR works in-browser via
/// the vendored compiler.
///
/// Output:
///   public/starter-courses/manifest.json   — list of {id,title,language,file,size}
///   public/starter-courses/<id>.json       — the full course JSON
///
/// Idempotent: deletes + recreates the directory each run so a pack
/// removed from PACK_IDS doesn't ghost in production. Run once before
/// `vite build` for the web variant; chained automatically by
/// `npm run vendor:web`.

import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PACKS_DIR = join(ROOT, "src-tauri", "resources", "bundled-packs");
const OUT = join(ROOT, "public", "starter-courses");

/// Curated browser-compatible starter set. IDs match the .fishbones
/// filenames (without the extension). Order here is the order the
/// library renders them in on first launch.
///
/// Curation rules for what makes the cut:
///   - Primary language is browser-runnable (per platform.ts canRun)
///     — JS, TS, Python, web, three.js, React, RN, Svelte, Solid,
///     HTMX, Astro, Bun, Tauri-as-Rust, Solidity. Rust + Go are
///     also OK because their runtimes proxy to the public playgrounds
///     over HTTP.
///   - Excluded: anything needing a system compiler (C, C++, Java,
///     Kotlin, C#, Assembly, Swift, SvelteKit's Node sidecar). Those
///     stay desktop-only.
const PACK_IDS = [
  // Languages-as-a-foundation books
  "javascript-crash-course",
  "python-crash-course",
  "javascript-the-definitive-guide",

  // Frameworks + libraries
  "svelte-5-complete",
  "solidjs-fundamentals",
  "fluent-react",
  "htmx-fundamentals",
  "astro-fundamentals",
  "bun-fundamentals",
  "bun-complete",
  "learning-react-native",
  "react-native",
  "interactive-web-development-with-three-js-and-a-frame",

  // Smart-contract / web3
  "solidity-complete",
  "solana-programs",
  "viem-ethers",

  // Languages-via-playground (no local toolchain needed)
  "learning-go",

  // Challenge packs — one per browser-runnable language
  "challenges-javascript-handwritten",
  "challenges-typescript-mo9c9k2o",
  "challenges-python-handwritten",
  "challenges-go-handwritten",
  "challenges-rust-handwritten",
  "challenges-reactnative-handwritten",
  "challenges-reactnative-visual",
];

async function main() {
  if (!existsSync(PACKS_DIR)) {
    console.error(
      `[starter-courses] expected packs dir at ${PACKS_DIR} — is the kata repo intact?`,
    );
    process.exit(1);
  }

  // Fresh slate each run.
  if (existsSync(OUT)) {
    await rm(OUT, { recursive: true, force: true });
  }
  await mkdir(OUT, { recursive: true });

  const manifest = [];
  for (const id of PACK_IDS) {
    const packPath = join(PACKS_DIR, `${id}.fishbones`);
    if (!existsSync(packPath)) {
      console.warn(`[starter-courses] missing pack: ${packPath}, skipping`);
      continue;
    }

    // .fishbones is a zip — use the system `unzip` (BSD on macOS,
    // InfoZIP on Linux; both ship by default on the GitHub Actions
    // ubuntu image). Avoids pulling in a JS zip library just for
    // five files at build time.
    const work = await mkdtemp(join(tmpdir(), "fb-starter-"));
    try {
      execFileSync("unzip", ["-q", packPath, "-d", work], { stdio: "pipe" });
      const courseJsonPath = join(work, "course.json");
      if (!existsSync(courseJsonPath)) {
        console.warn(
          `[starter-courses] no course.json inside ${id}.fishbones, skipping`,
        );
        continue;
      }
      const courseJson = await readFile(courseJsonPath, "utf-8");
      const course = JSON.parse(courseJson);

      const outFile = join(OUT, `${id}.json`);
      await writeFile(outFile, courseJson, "utf-8");
      const info = await stat(outFile);

      // Cover art DELIBERATELY skipped — the bundled cover.png files
      // are unoptimised 4MB originals, and shipping 24 of them would
      // bloat the static deploy by ~85MB. The library renders a
      // language-tinted glyph as the fallback when `cover` is absent
      // from the manifest, which is good enough for the web variant.
      // Re-enable here (resized to ~400px wide) if covers become
      // worth the bandwidth later.
      const coverFile = undefined;

      manifest.push({
        id: course.id || id,
        title: course.title || id,
        language: course.language,
        file: `${id}.json`,
        cover: coverFile,
        sizeBytes: info.size,
        packType: course.packType || "course",
      });
      console.log(
        `[starter-courses] staged ${id} (${(info.size / 1024).toFixed(0)} KB)` +
          (coverFile ? " + cover.png" : ""),
      );
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  }

  await writeFile(
    join(OUT, "manifest.json"),
    JSON.stringify({ version: 1, courses: manifest }, null, 2),
    "utf-8",
  );
  console.log(
    `[starter-courses] wrote manifest with ${manifest.length} courses`,
  );
}

main().catch((err) => {
  console.error("[starter-courses] failed:", err);
  process.exit(1);
});
