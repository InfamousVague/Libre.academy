import { useEffect, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { copy as copyIcon } from "@base/primitives/icon/icons/copy";
import { check as checkIcon } from "@base/primitives/icon/icons/check";
import { readAiHost, writeAiHost } from "../../../lib/aiHost";

const MODEL_OPTIONS: Array<{ id: string; label: string; hint: string }> = [
  {
    id: "claude-sonnet-4-5",
    label: "Sonnet 4.5 (balanced)",
    hint: "Default. ~$3 in / $15 out per 1M tokens. Great for most books.",
  },
  {
    id: "claude-opus-4-5",
    label: "Opus 4.5 (top quality)",
    hint: "~$15 in / $75 out per 1M tokens. ~5× cost, best pedagogy + test design.",
  },
  {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5 (fastest)",
    hint: "~$1 in / $5 out per 1M tokens. Quick + cheap but weaker structured output.",
  },
];

interface AiPaneProps {
  apiKey: string;
  onApiKeyChange: (next: string) => void;
  openaiKey: string;
  onOpenaiKeyChange: (next: string) => void;
  model: string;
  onModelChange: (next: string) => void;
}

export default function AiPane({
  apiKey,
  onApiKeyChange,
  openaiKey,
  onOpenaiKeyChange,
  model,
  onModelChange,
}: AiPaneProps) {
  // Per-field "just copied" flash. Keyed so the Anthropic + OpenAI
  // copy buttons each get their own check-mark moment without
  // stomping each other.
  const [copiedKey, setCopiedKey] = useState<null | "anthropic" | "openai">(
    null,
  );

  const copy = async (which: "anthropic" | "openai", value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(which);
      window.setTimeout(() => {
        setCopiedKey((cur) => (cur === which ? null : cur));
      }, 1400);
    } catch {
      // Clipboard write may fail without user-gesture permission
      // (Tauri WebKit on macOS sometimes rejects). Silent — the
      // user can still select+copy from the input field manually.
    }
  };

  return (
    <section>
      <h3 className="fishbones-settings-section">AI-assisted ingest</h3>
      <p className="fishbones-settings-blurb">
        Paste an Anthropic API key to enable Claude-powered structuring
        when you import a book. Without a key, the import falls back to
        the deterministic splitter (chapter/section breaks only).
      </p>
      <label className="fishbones-settings-field">
        <span className="fishbones-settings-label">Anthropic API key</span>
        <div className="fishbones-settings-input-row">
          <input
            type="password"
            className="fishbones-settings-input"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-ant-..."
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="fishbones-settings-input-copy"
            onClick={() => void copy("anthropic", apiKey)}
            disabled={!apiKey}
            aria-label={
              copiedKey === "anthropic"
                ? "Copied"
                : "Copy Anthropic API key to clipboard"
            }
            title={
              apiKey
                ? copiedKey === "anthropic"
                  ? "Copied!"
                  : "Copy to clipboard"
                : "Add a key first"
            }
          >
            <Icon
              icon={copiedKey === "anthropic" ? checkIcon : copyIcon}
              size="xs"
              color="currentColor"
            />
          </button>
        </div>
      </label>
      <p className="fishbones-settings-note">
        Stored at <code>&lt;app_data_dir&gt;/settings.json</code>. Never
        leaves your machine except in requests to api.anthropic.com.
      </p>

      <label className="fishbones-settings-field">
        <span className="fishbones-settings-label">Model</span>
        <div className="fishbones-settings-model-group">
          {MODEL_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={`fishbones-settings-model ${model === opt.id ? "is-active" : ""}`}
            >
              <input
                type="radio"
                name="anthropic-model"
                value={opt.id}
                checked={model === opt.id}
                onChange={() => onModelChange(opt.id)}
              />
              <div>
                <div className="fishbones-settings-model-label">{opt.label}</div>
                <div className="fishbones-settings-model-hint">{opt.hint}</div>
              </div>
            </label>
          ))}
        </div>
      </label>

      {/* Separate second provider for AI cover-art generation.
          Anthropic doesn't ship image generation, so we use
          OpenAI's gpt-image-1. Optional — without a key the
          cover-art button in Course Settings surfaces a
          friendly "add a key" message instead of crashing. */}
      <h3 className="fishbones-settings-section fishbones-settings-section--sub">
        AI cover art
      </h3>
      <p className="fishbones-settings-blurb">
        Optional. When set, a <strong>Generate artwork with AI</strong>{" "}
        button appears in Course Settings → Appearance. Uses OpenAI's{" "}
        <code>gpt-image-1</code> model (~$0.04 per cover) with a fixed
        editorial style so every book in your library shares the same
        visual language.
      </p>
      <label className="fishbones-settings-field">
        <span className="fishbones-settings-label">OpenAI API key</span>
        <div className="fishbones-settings-input-row">
          <input
            type="password"
            className="fishbones-settings-input"
            value={openaiKey}
            onChange={(e) => onOpenaiKeyChange(e.target.value)}
            placeholder="sk-..."
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="fishbones-settings-input-copy"
            onClick={() => void copy("openai", openaiKey)}
            disabled={!openaiKey}
            aria-label={
              copiedKey === "openai"
                ? "Copied"
                : "Copy OpenAI API key to clipboard"
            }
            title={
              openaiKey
                ? copiedKey === "openai"
                  ? "Copied!"
                  : "Copy to clipboard"
                : "Add a key first"
            }
          >
            <Icon
              icon={copiedKey === "openai" ? checkIcon : copyIcon}
              size="xs"
              color="currentColor"
            />
          </button>
        </div>
      </label>
      <p className="fishbones-settings-note">
        Stored next to the Anthropic key in{" "}
        <code>&lt;app_data_dir&gt;/settings.json</code>. Only used for
        image requests to api.openai.com.
      </p>

      <AssistantHostField />
    </section>
  );
}

/// Inline section for the in-app chat assistant's HTTP host.
///
/// On desktop the assistant talks to a localhost Ollama daemon via
/// Tauri IPC and this field is unused (left visible so the user
/// remembers the field exists when they pick up their phone). On
/// mobile / web, the assistant uses this host directly: HTTP fetch
/// to `<host>:11434/api/chat` with `stream: true`. Typical value is
/// the user's own Mac on their Tailscale tailnet — that machine has
/// Ollama running, the phone reaches it over the encrypted tailnet
/// without exposing the daemon to the public internet.
///
/// State is read once on mount + persisted on blur (not on every
/// keystroke — saving partial hostnames triggers re-probes that
/// will all fail until the field is complete).
function AssistantHostField() {
  const [host, setHost] = useState<string>(() => readAiHost() ?? "");
  const [savedFlash, setSavedFlash] = useState(false);
  const persisted = readAiHost() ?? "";

  // Flash a brief "saved" affordance when the value commits. We
  // own the flash state locally; the Settings dialog's main "Save"
  // button doesn't gate this field because the assistant host is a
  // single-key localStorage write, not part of the settings.json
  // bundle.
  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 1400);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  const commit = () => {
    if (host.trim() === persisted) return;
    writeAiHost(host);
    // Custom event so the remote chat hook re-probes immediately
    // (storage events don't fire same-tab).
    window.dispatchEvent(new CustomEvent("fishbones:ai-host-changed"));
    setSavedFlash(true);
  };

  return (
    <>
      <h3 className="fishbones-settings-section fishbones-settings-section--sub">
        Assistant host (mobile / web)
      </h3>
      <p className="fishbones-settings-blurb">
        Hostname or IP of the machine running Ollama. The phone +
        web build talk straight to it over HTTP on port 11434. A
        Tailscale tailnet hostname is the recommended setup —
        encrypted, stable across LAN moves, no public exposure.
        Desktop ignores this field and uses its own localhost
        daemon via Tauri IPC.
      </p>
      <label className="fishbones-settings-field">
        <span className="fishbones-settings-label">Hostname or IP</span>
        <div className="fishbones-settings-input-row">
          <input
            type="text"
            className="fishbones-settings-input"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder="fishbones-mac.tailnet-abc.ts.net  or  192.168.1.42"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
          />
          <span
            className="fishbones-settings-input-copy"
            aria-hidden
            style={{
              opacity: savedFlash ? 1 : 0,
              transition: "opacity 220ms ease",
              pointerEvents: "none",
            }}
            title={savedFlash ? "Saved" : ""}
          >
            <Icon icon={checkIcon} size="xs" color="currentColor" />
          </span>
        </div>
      </label>
      <p className="fishbones-settings-note">
        On the host: run{" "}
        <code>OLLAMA_HOST=0.0.0.0:11434 ollama serve</code> so the
        daemon listens on the tailnet interface, not just localhost.
        The default macOS Ollama install binds to 127.0.0.1 only —
        the phone won't reach it without the env override.
      </p>
    </>
  );
}
