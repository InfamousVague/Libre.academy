import { useEffect, useState } from "react";
import { terminal } from "@base/primitives/icon/icons/terminal";
import { sparkles } from "@base/primitives/icon/icons/sparkles";
import { dice5 } from "@base/primitives/icon/icons/dice-5";
import {
  celebrate,
  celebrateWith,
  type CelebrationEffect,
} from "../../../lib/celebrate";

import SettingsCard, { SettingsPage } from "./SettingsCard";
import SettingsRow from "./SettingsRow";
import SettingsToggle from "./SettingsToggle";
import { useT } from "../../../i18n/i18n";

const FLAG_KEY = "libre:devconsole";

/// i18n keys for the celebration effects in the achievement-test panel.
/// Stored as keys so the labels track the active locale at render time.
const EFFECT_LABEL_KEYS: Array<{
  id: CelebrationEffect;
  labelKey: string;
  hintKey: string;
}> = [
  {
    id: "coin-burst",
    labelKey: "settings.coinBurst",
    hintKey: "settings.coinBurstHint",
  },
];

/// Developer settings — the floating dev console toggle, plus a
/// celebration tester for designers wiring up new unlock cues.
export default function DeveloperPane() {
  const t = useT();
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FLAG_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Re-sync if devconsole.js was toggled by another path (the
  // 5-tap fallback gesture, the panel's × button, or a second
  // tab). Polling at 1Hz is fine for a settings dialog open briefly.
  useEffect(() => {
    const id = window.setInterval(() => {
      let live = false;
      try {
        live = localStorage.getItem(FLAG_KEY) === "1";
      } catch {
        live = false;
      }
      setEnabled((prev) => (prev === live ? prev : live));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  function toggle(next: boolean) {
    // Prefer the runtime API exposed by devconsole.js — it
    // mounts/unmounts the panel live without a reload AND flushes
    // the buffered logs into the panel on toggle-on.
    const api = (
      window as unknown as { __fbDevConsole_toggle?: () => "on" | "off" }
    ).__fbDevConsole_toggle;
    if (api) {
      const result = api();
      setEnabled(result === "on");
      return;
    }
    // Fallback: devconsole.js didn't load. Flip the flag and reload.
    try {
      if (next) localStorage.setItem(FLAG_KEY, "1");
      else localStorage.removeItem(FLAG_KEY);
    } catch {
      /* private mode / quota — silently fail */
    }
    setEnabled(next);
    window.location.reload();
  }

  return (
    <SettingsPage
      title={t("settings.developerTitle")}
      description={t("settings.developerDescription")}
    >
      <SettingsCard title={t("settings.consoleCard")}>
        <SettingsRow
          icon={terminal}
          tone={enabled ? "accent" : "default"}
          label={t("settings.showDevConsole")}
          sub={
            enabled
              ? t("settings.devConsoleOn")
              : t("settings.devConsoleOff")
          }
          control={
            <SettingsToggle
              checked={enabled}
              onChange={toggle}
              label={t("settings.showDevConsole")}
            />
          }
        />
        <div
          style={{
            padding: "12px 20px 16px",
            fontSize: 12.5,
            color: "var(--color-text-tertiary, rgba(245, 245, 247, 0.55))",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "var(--color-text-secondary)" }}>
            {t("settings.emergencyFallback")}
          </strong>{" "}
          {t("settings.emergencyFallbackBody")}
        </div>
      </SettingsCard>

      <SettingsCard title={t("settings.celebrationTester")}>
        {EFFECT_LABEL_KEYS.map((eff) => (
          <SettingsRow
            key={eff.id}
            icon={sparkles}
            tone="accent"
            label={t(eff.labelKey)}
            sub={t(eff.hintKey)}
            control={
              <button
                type="button"
                className="libre-settings-secondary"
                onClick={() =>
                  void celebrateWith(eff.id, "medium", { x: 0.5, y: 0.5 })
                }
              >
                {t("settings.tryBtn")}
              </button>
            }
          />
        ))}
        <SettingsRow
          icon={dice5}
          label={t("settings.randomCelebration")}
          sub={t("settings.randomCelebrationHint")}
          control={
            <button
              type="button"
              className="libre-settings-secondary"
              onClick={() => void celebrate("medium", { x: 0.5, y: 0.5 })}
            >
              {t("settings.fireBtn")}
            </button>
          }
        />
      </SettingsCard>
    </SettingsPage>
  );
}
