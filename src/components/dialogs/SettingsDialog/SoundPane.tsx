/// "Sounds" pane — a complete rebuild in the Cipher-inspired
/// settings idiom adopted across the rest of the dialog.
///
/// Structure (top → bottom):
///   1. MASTER card
///        - Sound effects toggle (kills every cue)
///        - Volume slider (0-100% with live readout)
///   2. ACHIEVEMENT UNLOCKS card
///        - One row per unlock tier (bronze chime → silver success
///          → gold fanfare → platinum arpeggio) with a Play button
///          on the right so the learner can audition each tier's
///          cue without waiting for a real unlock.
///   3. LESSON PROGRESS card
///        - XP pop, level up, section complete, book complete.
///   4. STREAK card
///        - Day flip, streak milestone, streak freeze.
///   5. INTERFACE card
///        - UI tap (the generic ping used by chrome interactions).
///
/// Each cue row carries an icon, the friendly label, a one-line
/// description of WHEN the cue fires, and a Play button as the
/// row's control. Volume + master mute apply globally; the Play
/// buttons bypass mute via `ignoreMute: true` so the user can
/// preview even with master off.

import { useEffect, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { play as playIcon } from "@base/primitives/icon/icons/play";
import { volume2 } from "@base/primitives/icon/icons/volume-2";
import { volumeX } from "@base/primitives/icon/icons/volume-x";
import { sliders } from "@base/primitives/icon/icons/sliders";
import { award } from "@base/primitives/icon/icons/award";
import { medal } from "@base/primitives/icon/icons/medal";
import { trophy } from "@base/primitives/icon/icons/trophy";
import { sparkles } from "@base/primitives/icon/icons/sparkles";
import { zap } from "@base/primitives/icon/icons/zap";
import { arrowUp } from "@base/primitives/icon/icons/arrow-up";
import { bookCheck } from "@base/primitives/icon/icons/book-check";
import { bookOpenCheck } from "@base/primitives/icon/icons/book-open-check";
import { flame } from "@base/primitives/icon/icons/flame";
import { flameKindling } from "@base/primitives/icon/icons/flame-kindling";
import { snowflake } from "@base/primitives/icon/icons/snowflake";
import { mousePointerClick } from "@base/primitives/icon/icons/mouse-pointer-click";

import {
  getSfxSettings,
  playSound,
  setSfxSettings,
  unlockAudioContext,
  type SfxName,
} from "../../../lib/sfx";

import SettingsCard, { SettingsPage } from "./SettingsCard";
import SettingsRow from "./SettingsRow";
import SettingsToggle from "./SettingsToggle";
import { useT } from "../../../i18n/i18n";

/// Per-cue metadata for the preview rows. Each entry is a single
/// row's worth of presentation:
///   - cue: the `SfxName` to fire when the Play button is clicked
///   - icon: the row's icon chip
///   - labelKey: i18n key for the row's title
///   - subKey: i18n key for when the cue actually fires
interface CueMeta {
  cue: SfxName;
  icon: string;
  labelKey: string;
  subKey: string;
}

const UNLOCK_CUES: CueMeta[] = [
  {
    cue: "chime",
    icon: medal,
    labelKey: "settings.bronzeUnlock",
    subKey: "settings.bronzeUnlockSub",
  },
  {
    cue: "success",
    icon: award,
    labelKey: "settings.silverUnlock",
    subKey: "settings.silverUnlockSub",
  },
  {
    cue: "fanfare",
    icon: trophy,
    labelKey: "settings.goldUnlock",
    subKey: "settings.goldUnlockSub",
  },
  {
    cue: "arpeggio",
    icon: sparkles,
    labelKey: "settings.platinumUnlock",
    subKey: "settings.platinumUnlockSub",
  },
];

const PROGRESS_CUES: CueMeta[] = [
  {
    cue: "xp-pop",
    icon: zap,
    labelKey: "settings.xpEarned",
    subKey: "settings.xpEarnedSub",
  },
  {
    cue: "level-up",
    icon: arrowUp,
    labelKey: "settings.levelUp",
    subKey: "settings.levelUpSub",
  },
  {
    cue: "complete-section",
    icon: bookCheck,
    labelKey: "settings.sectionComplete",
    subKey: "settings.sectionCompleteSub",
  },
  {
    cue: "complete-book",
    icon: bookOpenCheck,
    labelKey: "settings.bookComplete",
    subKey: "settings.bookCompleteSub",
  },
];

const STREAK_CUES: CueMeta[] = [
  {
    cue: "streak-tick",
    icon: flameKindling,
    labelKey: "settings.dayFlip",
    subKey: "settings.dayFlipSub",
  },
  {
    cue: "streak-flame",
    icon: flame,
    labelKey: "settings.streakMilestone",
    subKey: "settings.streakMilestoneSub",
  },
  {
    cue: "freeze",
    icon: snowflake,
    labelKey: "settings.streakFreezeUsed",
    subKey: "settings.streakFreezeUsedSub",
  },
];

const INTERFACE_CUES: CueMeta[] = [
  {
    cue: "ping",
    icon: mousePointerClick,
    labelKey: "settings.uiTap",
    subKey: "settings.uiTapSub",
  },
];

export default function SoundPane() {
  const t = useT();
  // Mirror sfx.ts's settings cache into local React state so
  // toggling re-renders. Initialise from the cache so the first
  // paint lands on the user's persisted value rather than the
  // default flash.
  const initial = getSfxSettings();
  const [enabled, setEnabled] = useState<boolean>(initial.enabled);
  const [volume, setVolume] = useState<number>(initial.volume);

  // Cross-tab + cross-component sync. The custom event is what
  // sfx.ts dispatches on its own writes; same channel a second
  // open settings window (rare) would use to inform us.
  useEffect(() => {
    const onChanged = () => {
      const s = getSfxSettings();
      setEnabled(s.enabled);
      setVolume(s.volume);
    };
    window.addEventListener("libre:sfx:settings-changed", onChanged);
    return () =>
      window.removeEventListener("libre:sfx:settings-changed", onChanged);
  }, []);

  const onToggleEnabled = (next: boolean) => {
    setEnabled(next);
    setSfxSettings({ enabled: next });
    if (next) {
      // Warm the audio context the moment the toggle lights so
      // the FIRST cue after enabling isn't silenced by iOS
      // Safari's "no sound until a gesture" policy. Then chirp
      // a confirmation ping the same way the master toggle did
      // pre-rewrite.
      void unlockAudioContext();
      playSound("ping", { ignoreMute: true });
    }
  };

  const onVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    setSfxSettings({ volume: clamped });
  };

  // "Audition" assist: when the user hits Play with volume at 0,
  // bump volume up once so the preview is actually audible. Keeps
  // a "I tried it and heard nothing" support thread from happening.
  // Latched per-mount so we don't keep over-riding their setting.
  const [auditioned, setAuditioned] = useState(false);
  const audition = (cue: SfxName) => {
    void unlockAudioContext();
    if (volume <= 0 && !auditioned) {
      onVolume(0.6);
      setAuditioned(true);
    }
    playSound(cue, { ignoreMute: true });
  };

  // Compact icon-only Play button used as the row's control. Same
  // chrome as the other inline settings buttons; sized to fit a
  // row's right-hand cell without crowding the row label.
  const renderPlay = (cue: SfxName) => (
    <button
      type="button"
      onClick={() => audition(cue)}
      aria-label={t("settings.previewSound", { cue })}
      className="libre-settings-cue-play"
    >
      <Icon icon={playIcon} size="xs" color="currentColor" />
    </button>
  );

  return (
    <SettingsPage
      title={t("settings.soundsTitle")}
      description={t("settings.soundsDescription")}
    >
      <SettingsCard title={t("settings.masterCard")}>
        <SettingsRow
          icon={enabled ? volume2 : volumeX}
          tone={enabled ? "accent" : "default"}
          label={t("settings.soundEffects")}
          sub={t("settings.soundEffectsSub")}
          control={
            <SettingsToggle
              checked={enabled}
              onChange={onToggleEnabled}
              label={t("settings.soundEffects")}
            />
          }
        />
        <SettingsRow
          icon={sliders}
          label={t("settings.volumeLabel")}
          sub={t("settings.volumeSub", { percent: Math.round(volume * 100) })}
          control={
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolume(Number.parseFloat(e.target.value))}
              aria-label={t("settings.volumeAria")}
              disabled={!enabled}
              className="libre-settings-cue-slider"
            />
          }
        />
      </SettingsCard>

      <SettingsCard title={t("settings.achievementUnlocks")}>
        {UNLOCK_CUES.map((c) => (
          <SettingsRow
            key={c.cue}
            icon={c.icon}
            tone="accent"
            label={t(c.labelKey)}
            sub={t(c.subKey)}
            control={renderPlay(c.cue)}
          />
        ))}
      </SettingsCard>

      <SettingsCard title={t("settings.lessonProgress")}>
        {PROGRESS_CUES.map((c) => (
          <SettingsRow
            key={c.cue}
            icon={c.icon}
            label={t(c.labelKey)}
            sub={t(c.subKey)}
            control={renderPlay(c.cue)}
          />
        ))}
      </SettingsCard>

      <SettingsCard title={t("settings.streaks")}>
        {STREAK_CUES.map((c) => (
          <SettingsRow
            key={c.cue}
            icon={c.icon}
            label={t(c.labelKey)}
            sub={t(c.subKey)}
            control={renderPlay(c.cue)}
          />
        ))}
      </SettingsCard>

      <SettingsCard title={t("settings.interfaceCard")}>
        {INTERFACE_CUES.map((c) => (
          <SettingsRow
            key={c.cue}
            icon={c.icon}
            label={t(c.labelKey)}
            sub={t(c.subKey)}
            control={renderPlay(c.cue)}
          />
        ))}
      </SettingsCard>
    </SettingsPage>
  );
}
