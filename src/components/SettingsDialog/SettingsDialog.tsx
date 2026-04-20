import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./SettingsDialog.css";

interface Props {
  onDismiss: () => void;
}

interface Settings {
  anthropic_api_key: string | null;
}

/// The only setting for now is an Anthropic API key for LLM-assisted course
/// ingest. Stored locally at <app_data_dir>/settings.json — never synced.
export default function SettingsDialog({ onDismiss }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearingCourses, setClearingCourses] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [confirmClearCourses, setConfirmClearCourses] = useState(false);

  useEffect(() => {
    invoke<Settings>("load_settings")
      .then((s) => setApiKey(s.anthropic_api_key ?? ""))
      .catch(() => { /* not in tauri — ignore */ });
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await invoke("save_settings", {
        settings: { anthropic_api_key: apiKey.trim() || null },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function clearAllCourses() {
    setClearingCourses(true);
    setError(null);
    try {
      // list_courses + delete_course each (delete_course prunes progress too).
      const entries = await invoke<Array<{ id: string }>>("list_courses");
      for (const e of entries) {
        await invoke("delete_course", { courseId: e.id });
      }
      // Reload to reflect the empty state.
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setClearingCourses(false);
    }
  }

  async function clearIngestCache() {
    setClearingCache(true);
    setError(null);
    try {
      await invoke("cache_clear", { bookId: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setClearingCache(false);
    }
  }

  return (
    <div className="kata-settings-backdrop" onClick={onDismiss}>
      <div className="kata-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kata-settings-header">
          <span className="kata-settings-title">Settings</span>
          <button className="kata-settings-close" onClick={onDismiss}>×</button>
        </div>

        <div className="kata-settings-body">
          <section>
            <h3 className="kata-settings-section">AI-assisted ingest</h3>
            <p className="kata-settings-blurb">
              Paste an Anthropic API key to enable Claude-powered structuring when
              you import a book. Without a key, the import falls back to the
              deterministic splitter (chapter/section breaks only).
            </p>
            <label className="kata-settings-field">
              <span className="kata-settings-label">Anthropic API key</span>
              <input
                type="password"
                className="kata-settings-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                spellCheck={false}
                autoComplete="off"
              />
            </label>
            <p className="kata-settings-note">
              Stored at <code>&lt;app_data_dir&gt;/settings.json</code>. Never leaves your machine
              except in requests to api.anthropic.com.
            </p>
          </section>

          <section>
            <h3 className="kata-settings-section">Data</h3>
            <p className="kata-settings-blurb">
              Clears local content. Your API key and preferences stay.
            </p>
            <div className="kata-settings-data-row">
              <div>
                <div className="kata-settings-data-label">Ingest cache</div>
                <div className="kata-settings-data-hint">
                  Clearing forces the next AI import to re-call Claude for every stage.
                </div>
              </div>
              <button
                className="kata-settings-danger"
                onClick={clearIngestCache}
                disabled={clearingCache}
              >
                {clearingCache ? "…" : "Clear cache"}
              </button>
            </div>
            <div className="kata-settings-data-row">
              <div>
                <div className="kata-settings-data-label">All courses + progress</div>
                <div className="kata-settings-data-hint">
                  Deletes every course from disk and resets lesson completion. Cannot be undone.
                </div>
              </div>
              {confirmClearCourses ? (
                <div className="kata-settings-confirm">
                  <button
                    className="kata-settings-secondary"
                    onClick={() => setConfirmClearCourses(false)}
                    disabled={clearingCourses}
                  >
                    Cancel
                  </button>
                  <button
                    className="kata-settings-danger"
                    onClick={clearAllCourses}
                    disabled={clearingCourses}
                  >
                    {clearingCourses ? "Clearing…" : "Really clear"}
                  </button>
                </div>
              ) : (
                <button
                  className="kata-settings-danger"
                  onClick={() => setConfirmClearCourses(true)}
                >
                  Clear all courses
                </button>
              )}
            </div>
          </section>

          {error && <div className="kata-settings-error">{error}</div>}

          <div className="kata-settings-actions">
            {saved && <span className="kata-settings-saved">✓ saved</span>}
            <button
              className="kata-settings-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
