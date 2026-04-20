import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { textToCourse } from "../../ingest/pdfParser";
import type { LanguageId } from "../../data/types";
import "./ImportDialog.css";

interface Props {
  onDismiss: () => void;
  onImported: (courseId: string) => void;
}

/// In-app "Import PDF" wizard. Three steps:
///   1. Pick a PDF via the native dialog.
///   2. Fill in title / language / id.
///   3. Click import — we shell out to pdftotext, parse the text, and save
///      the course via the existing save_course Tauri command.
export default function ImportDialog({ onDismiss, onImported }: Props) {
  const [step, setStep] = useState<"pick" | "meta" | "running">("pick");
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [courseId, setCourseId] = useState("");
  const [language, setLanguage] = useState<LanguageId>("javascript");
  const [error, setError] = useState<string | null>(null);

  async function pickFile() {
    setError(null);
    try {
      const picked = await open({
        multiple: false,
        filters: [
          { name: "Books", extensions: ["pdf"] },
        ],
      });
      if (typeof picked !== "string") return;
      setPdfPath(picked);
      const base = basename(picked).replace(/\.pdf$/i, "");
      setTitle((t) => t || toTitle(base));
      setCourseId((id) => id || slug(base));
      setStep("meta");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function runImport() {
    if (!pdfPath) return;
    setStep("running");
    setError(null);
    try {
      const res = await invoke<{ text: string; error: string | null }>("extract_pdf_text", {
        path: pdfPath,
      });
      if (res.error) throw new Error(res.error);

      const finalId = courseId || slug(title);
      const course = textToCourse(res.text, {
        courseId: finalId,
        title,
        author: author || undefined,
        language,
      });

      await invoke("save_course", { courseId: finalId, body: course });
      onImported(finalId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("meta");
    }
  }

  return (
    <div className="kata-import-backdrop" onClick={onDismiss}>
      <div className="kata-import-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kata-import-header">
          <span className="kata-import-title">Import course from PDF</span>
          <button className="kata-import-close" onClick={onDismiss}>
            ×
          </button>
        </div>

        <div className="kata-import-body">
          {step === "pick" && (
            <>
              <p className="kata-import-blurb">
                Pick an O'Reilly-style PDF. We'll extract the text, split it by chapter +
                section, and save it as a new course you can browse in the sidebar.
              </p>
              <button className="kata-import-primary" onClick={pickFile}>
                Choose PDF…
              </button>
            </>
          )}

          {step === "meta" && (
            <>
              <Field label="PDF">
                <code className="kata-import-path">{pdfPath}</code>
              </Field>
              <Field label="Title">
                <input
                  className="kata-import-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript: The Definitive Guide"
                />
              </Field>
              <Field label="Author">
                <input
                  className="kata-import-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                />
              </Field>
              <Field label="Course id">
                <input
                  className="kata-import-input"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder="short slug"
                />
              </Field>
              <Field label="Primary language">
                <select
                  className="kata-import-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageId)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                  <option value="swift">Swift</option>
                </select>
              </Field>

              <div className="kata-import-actions">
                <button className="kata-import-secondary" onClick={() => setStep("pick")}>
                  Back
                </button>
                <button
                  className="kata-import-primary"
                  onClick={runImport}
                  disabled={!title || !courseId}
                >
                  Import
                </button>
              </div>
            </>
          )}

          {step === "running" && (
            <div className="kata-import-running">
              <div className="kata-import-spinner" />
              <span>Extracting text and splitting into lessons…</span>
            </div>
          )}

          {error && <div className="kata-import-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="kata-import-field">
      <span className="kata-import-label">{label}</span>
      {children}
    </label>
  );
}

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] ?? path;
}

function slug(s: string): string {
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "course";
}

function toTitle(s: string): string {
  return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
