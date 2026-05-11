/// "Sounds" section of the Settings dialog.
///
/// Three controls:
///   1. Master mute toggle — kills every cue including unlocks.
///   2. Volume slider (0-100%) — multiplies into the synth's master
///      gain. Live update as the slider moves; the sfx module reads
///      a debounced settings cache so dragging doesn't thrash the
///      AudioContext.
///   3. Per-cue "Test sound" preview row. Useful for the user to
///      tune before a real unlock, and useful as a screenshot story
///      for the marketing site.
///
/// Settings persist via the sfx module's setSfxSettings() helper —
/// it writes to localStorage and dispatches a custom event so all
/// other parts of the app pick up the change without a reload.

import { useEffect, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { play as playIcon } from "@base/primitives/icon/icons/play";
import { volume2 } from "@base/primitives/icon/icons/volume-2";
import { volumeX } from "@base/primitives/icon/icons/volume-x";

import {
  ALL_SFX,
  SFX_LABELS,
  getSfxSettings,
  playSound,
  setSfxSettings,
  unlockAudioContext,
} from "../../../lib/sfx";

export default function SoundPane() {
  // Mirror the sfx module's settings into local React state so
  // toggling re-renders. Initialise from the cache so the first
  // paint lands with the user's persisted value, not a flash of the
  // default.
  const initial = getSfxSettings();
  const [enabled, setEnabled] = useState<boolean>(initial.enabled);
  const [volume, setVolume] = useState<number>(initial.volume);

  // Cross-tab + cross-component sync: re-read the cache when another
  // surface bumps it. The custom event is the same one sfx.ts fires
  // on its own writes, so we hear about updates everywhere.
  useEffect(() => {
    const onChanged = () => {
      const s = getSfxSettings();
      setEnabled(s.enabled);
      setVolume(s.volume);
    };
    window.addEventListener("fb:sfx:settings-changed", onChanged);
    return () =>
      window.removeEventListener("fb:sfx:settings-changed", onChanged);
  }, []);

  const onToggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    setSfxSettings({ enabled: next });
    if (next) {
      // Warm the audio context now so the first cue after enabling
      // doesn't play silently on iOS Safari.
      void unlockAudioContext();
      playSound("ping", { ignoreMute: true });
    }
  };

  const onVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    setSfxSettings({ volume: clamped });
  };

  // Bump the volume up the moment the user starts dragging if it
  // was previously zero — otherwise the test-buttons stay silent
  // and the user thinks the system is broken. We only do this once
  // per "from zero" interaction, hence the local guard.
  const [auditioned, setAuditioned] = useState(false);
  const audition = (cue: (typeof ALL_SFX)[number]) => {
    void unlockAudioContext();
    if (volume <= 0 && !auditioned) {
      onVolume(0.6);
      setAuditioned(true);
    }
    playSound(cue, { ignoreMute: true });
  };

  return (
    <div className="libre-settings-pane">
      <h3 className="libre-settings-pane-title">Sounds</h3>
      <p className="libre-settings-pane-blurb">
        Sound effects fire on lesson complete, achievement unlocks, streak
        milestones, and section/book wraps. Synthesised at runtime — no
        bundled audio, latency-free.
      </p>

      <div className="libre-settings-row">
        <div className="libre-settings-row__label">
          <span className="libre-settings-row__title">
            Sound effects
          </span>
          <span className="libre-settings-row__hint">
            Master toggle for every cue.
          </span>
        </div>
        <button
          type="button"
          className={`libre-settings-toggle ${enabled ? "libre-settings-toggle--on" : ""}`}
          aria-pressed={enabled}
          onClick={onToggleEnabled}
        >
          <Icon
            icon={enabled ? volume2 : volumeX}
            size="sm"
            color="currentColor"
          />
          <span>{enabled ? "On" : "Off"}</span>
        </button>
      </div>

      <div className="libre-settings-row">
        <div className="libre-settings-row__label">
          <span className="libre-settings-row__title">Volume</span>
          <span className="libre-settings-row__hint">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolume(Number.parseFloat(e.target.value))}
          aria-label="Sound effect volume"
          disabled={!enabled}
          style={{ flex: 1, maxWidth: 220 }}
        />
      </div>

      <div className="libre-settings-row libre-settings-row--column">
        <div className="libre-settings-row__label">
          <span className="libre-settings-row__title">Test cues</span>
          <span className="libre-settings-row__hint">
            Preview each effect.
          </span>
        </div>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 8,
            width: "100%",
          }}
        >
          {ALL_SFX.map((cue) => (
            <li key={cue}>
              <button
                type="button"
                onClick={() => audition(cue)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--color-bg-secondary, #241b2f)",
                  border: "1px solid var(--color-border-default, rgba(255, 255, 255, 0.07))",
                  borderRadius: 8,
                  color: "var(--color-text-primary, #f4eedd)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <Icon icon={playIcon} size="xs" color="currentColor" />
                <span>{SFX_LABELS[cue]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
