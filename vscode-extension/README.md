# Libre.academy for VSCode

Take [Libre.academy](https://libre.academy) courses inside Visual Studio Code. Pairs with the Libre desktop app — pick a lesson there, do the work here, both clients share the same progress.

## What this does

- Opens lessons via a `vscode://libre-academy.libre/open?course=<id>&lesson=<id>` URL — the desktop app's "Open in VSCode" button fires this, or you can craft the URL yourself.
- Renders the lesson's prose, objectives, and hints in a side panel.
- For exercise lessons, writes the starter file to a per-lesson workspace and opens it in a native editor tab.
- Runs the lesson's hidden tests against your code via the language's native toolchain (`cargo`, `node`, `python`).
- Marks lessons complete in the shared `progress.sqlite` — the desktop app sees the same checkmarks.

## MVP language support

| Language       | Toolchain                                  | Status |
| -------------- | ------------------------------------------ | ------ |
| **Rust**       | `cargo`                                    | ✓      |
| **TypeScript** | `node` 22.6+ (with `--experimental-strip-types`) | ✓      |
| **JavaScript** | `node` 22.6+                               | ✓      |
| **Python**     | `python3` / `python` (uses stdlib `unittest`) | ✓      |

Other Libre-supported languages (Zig, Go, Java, Swift, …) fall back to a "use the desktop app for this language" message. We add runners in order of demand — file an issue.

## How it talks to the desktop app

```
~/Library/Application Support/com.mattssoftware.libre/   (macOS)
  ├── courses/<courseId>/course.json    ← read-only
  ├── progress.sqlite                   ← shared read/write
  └── vscode-workspaces/<courseId>/<lessonId>/
        ├── solution.<ext>              ← your editable file
        └── .libre/                     ← runner scratch (rewritten on open)
```

- **Courses**: read-only here. Install / uninstall / update via the desktop app.
- **Progress**: shared SQLite, WAL mode, written by both clients. Whichever app marks the lesson complete first wins (and the timestamp stays put).
- **Exercise workspace**: lives outside the course folder so your in-progress edits survive course re-installs.

## Commands

| Command                       | Default keybinding (macOS) | When                                |
| ----------------------------- | -------------------------- | ----------------------------------- |
| **Libre: Open Lesson…**       | —                          | Always; opens a quick-pick of courses. |
| **Libre: Run Tests**          | <kbd>⌘⇧↩</kbd>             | Exercise lesson is current.         |
| **Libre: Mark Lesson Complete** | —                        | Reading lesson is current.          |
| **Libre: Next Lesson**        | <kbd>⌘⇧→</kbd>             | Any lesson is current.              |
| **Libre: Reveal Solution**    | —                          | Exercise lesson; behind a confirm.  |
| **Libre: Show Next Hint**     | —                          | Exercise lesson with hints.         |
| **Libre: Refresh Course Outline** | —                      | The outline view's title bar.       |

## Settings

| Key                  | Default                                            | Notes |
| -------------------- | -------------------------------------------------- | ----- |
| `libre.coursesDir`   | `<libreData>/courses`                              | Override if you keep courses outside the default data dir. |
| `libre.progressDb`   | `<libreData>/progress.sqlite`                      | Override if you keep progress somewhere else (CI runner, sandbox VM, etc.). |

`<libreData>` is `~/Library/Application Support/com.mattssoftware.libre` on macOS, `%APPDATA%/com.mattssoftware.libre` on Windows, `~/.local/share/com.mattssoftware.libre` (or `$XDG_DATA_HOME`) on Linux.

## Development

This extension lives in the [Libre.academy monorepo](https://github.com/libre-academy/libre) as `vscode-extension/`.

```bash
cd vscode-extension
npm install
npm run build           # one-shot esbuild → dist/extension.js
npm run watch           # rebuild on save
npm run typecheck       # tsc --noEmit
```

To debug the extension:

1. Open `vscode-extension/` in VSCode.
2. Press <kbd>F5</kbd> — launches a Development Host window with the extension loaded.
3. In the dev-host window, try the URL handler:
   ```
   ⌘⇧P → "Open Settings (UI)" → search "URI handler"
   ```
   Or paste `vscode://libre-academy.libre/open?course=rustlings&lesson=intro1` into a terminal:
   ```bash
   open "vscode://libre-academy.libre/open?course=rustlings&lesson=intro1"
   ```

To package a `.vsix` for the marketplace:

```bash
npm run package
```

Outputs `libre-0.1.0.vsix`. Upload via the [VS Marketplace publisher page](https://marketplace.visualstudio.com/manage).

## Architecture

```
src/
├── extension.ts              activate() — wires URI handler, outline, commands
├── data/
│   ├── types.ts              minimal subset of the desktop app's data types
│   ├── paths.ts              platform-aware libre data dir resolution
│   ├── courseStore.ts        reads course.json files
│   └── progressStore.ts      reads/writes progress.sqlite via better-sqlite3
├── uri/
│   └── handler.ts            routes vscode://libre-academy.libre/open URLs
├── views/
│   ├── lessonPanel.ts        markdown webview side panel
│   └── outline.ts            chapters → lessons tree view
├── exercise/
│   ├── workbench.ts          writes starter file to disk, opens in editor
│   └── runners/
│       ├── types.ts          per-language runner interface
│       ├── util.ts           spawn + which helpers
│       ├── rust.ts           cargo test runner
│       ├── typescript.ts     node --experimental-strip-types runner
│       ├── python.ts         python -m unittest runner
│       └── registry.ts       language id → runner lookup
└── commands/
    ├── runTests.ts           dispatches to a runner, renders results
    ├── markComplete.ts       writes to progress.sqlite
    └── nextLesson.ts         advances to next lesson in reading order
```

## License

MIT. Same as the rest of Libre.academy.
