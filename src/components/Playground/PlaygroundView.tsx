import { useState } from "react";
import type { LanguageId } from "../../data/types";
import { usePlaygroundFiles } from "../../hooks/usePlaygroundFiles";
import { runFiles, isPassing, type RunResult } from "../../runtimes";
import EditorPane from "../Editor/EditorPane";
import OutputPane from "../Output/OutputPane";
import Workbench from "../Workbench/Workbench";
import "./PlaygroundView.css";

/// Languages the playground offers. The roster matches LanguageId —
/// the picker shows every supported runtime so a user can try anything
/// without hunting for it.
const LANGUAGE_OPTIONS: Array<{ id: LanguageId; label: string }> = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "rust", label: "Rust" },
  { id: "go", label: "Go" },
  { id: "swift", label: "Swift" },
];

/// jsfiddle-style free-form coding sandbox. No lesson prose, no "mark
/// complete" — just a language picker, editor, and output pane. Code
/// persists per-language in localStorage (see usePlaygroundFiles) so
/// switching Rust → Go → Rust restores what you were working on.
export default function PlaygroundView() {
  const { language, setLanguage, files, setFiles, resetToTemplate } =
    usePlaygroundFiles("javascript");
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const r = await runFiles(language, files);
      setResult(r);
      void isPassing; // silence unused import — the helper is part of
      // the public runtimes surface, we just don't need it for the
      // no-tests playground path.
    } finally {
      setRunning(false);
    }
  }

  function handleFileChange(index: number, next: string) {
    setFiles((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const copy = prev.slice();
      copy[index] = { ...copy[index], content: next };
      return copy;
    });
  }

  function handleLanguageChange(next: LanguageId) {
    setActiveFileIdx(0);
    setResult(null);
    setLanguage(next);
  }

  return (
    <div className="fishbones-playground">
      {/* Header: language picker on the left, reset to template on the
          right. Run stays in EditorPane's toolbar so the learner's
          muscle memory from course exercises carries over. */}
      <div className="fishbones-playground-header">
        <label className="fishbones-playground-lang-picker">
          <span className="fishbones-playground-lang-label">Language</span>
          <select
            className="fishbones-playground-lang-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageId)}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="fishbones-playground-spacer" />
        <div className="fishbones-playground-hint">
          Your code auto-saves per language.
        </div>
      </div>

      <div className="fishbones-playground-workbench">
        <Workbench
          storageKey="kata:playground-workbench-split"
          editor={
            <EditorPane
              language={language}
              files={files}
              activeIndex={activeFileIdx}
              onActiveIndexChange={setActiveFileIdx}
              onChange={handleFileChange}
              onRun={handleRun}
              onReset={resetToTemplate}
            />
          }
          output={<OutputPane result={result} running={running} />}
        />
      </div>
    </div>
  );
}
