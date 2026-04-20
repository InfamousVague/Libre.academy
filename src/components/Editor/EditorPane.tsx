import Editor, { loader } from "@monaco-editor/react";
import type { LanguageId } from "../../data/types";
import "./EditorPane.css";

// Point Monaco's loader at a CDN so Vite doesn't try to bundle the workers.
// Tauri's webview will fetch them on first load.
loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });

interface Props {
  language: LanguageId;
  value: string;
  onChange: (next: string) => void;
  onRun: () => void;
}

const MONACO_LANGUAGES: Record<LanguageId, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  rust: "rust",
  swift: "swift",
};

/// Left half of the workbench. Wraps Monaco with a small header (language +
/// Run / Reset buttons).
export default function EditorPane({ language, value, onChange, onRun }: Props) {
  return (
    <div className="kata-editor">
      <div className="kata-editor-header">
        <span className="kata-editor-language">{language}</span>
        <div className="kata-editor-actions">
          <button className="kata-editor-button kata-editor-run" onClick={onRun}>
            run
          </button>
        </div>
      </div>

      <div className="kata-editor-host">
        <Editor
          height="100%"
          language={MONACO_LANGUAGES[language]}
          value={value}
          theme="vs-dark"
          onChange={(v) => onChange(v ?? "")}
          options={{
            fontSize: 13,
            fontFamily: '"SF Mono", ui-monospace, Menlo, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbersMinChars: 3,
            tabSize: 2,
            automaticLayout: true,
            renderLineHighlight: "gutter",
          }}
        />
      </div>
    </div>
  );
}
