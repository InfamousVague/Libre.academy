import type { FileLanguage, LanguageId, WorkbenchFile } from "../data/types";

/// Starter snippets shown when the learner first opens the playground
/// for a given language. Kept short and "it prints Hello, world!" so the
/// first click of Run always produces something, not a compile error.

interface Template {
  /// Default workbench filename — e.g. `main.go`, `user.py`. Matches the
  /// single-file-lesson conventions in `src/lib/workbenchFiles.ts`.
  filename: string;
  /// Monaco / syntax-highlight language id. Usually matches the primary
  /// language but split out so we could, say, drop in an HTML file for
  /// a future `web` entry.
  fileLanguage: FileLanguage;
  content: string;
}

export const PLAYGROUND_TEMPLATES: Record<LanguageId, Template> = {
  javascript: {
    filename: "main.js",
    fileLanguage: "javascript",
    content: `console.log("Hello, world!");\n`,
  },
  typescript: {
    filename: "main.ts",
    fileLanguage: "typescript",
    content: `const greet = (name: string): string => \`Hello, \${name}!\`;\n\nconsole.log(greet("world"));\n`,
  },
  python: {
    filename: "main.py",
    fileLanguage: "python",
    content: `print("Hello, world!")\n`,
  },
  rust: {
    filename: "src/main.rs",
    fileLanguage: "rust",
    content: `fn main() {\n    println!("Hello, world!");\n}\n`,
  },
  swift: {
    filename: "main.swift",
    fileLanguage: "swift",
    content: `print("Hello, world!")\n`,
  },
  go: {
    filename: "main.go",
    fileLanguage: "go",
    content: `package main

import "fmt"

func main() {
\tfmt.Println("Hello, world!")
}
`,
  },
};

/// Build a one-element WorkbenchFile array from a template. The
/// playground edit-run loop uses the same multi-file contract as
/// lesson exercises, so everything downstream just works.
export function templateFiles(language: LanguageId): WorkbenchFile[] {
  const t = PLAYGROUND_TEMPLATES[language];
  return [
    {
      name: t.filename,
      language: t.fileLanguage,
      content: t.content,
    },
  ];
}
