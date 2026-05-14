/// Browse-all surface for the achievement library.
///
/// Layout: one section per category (matching the order in
/// `acheive_prompts.md`), each containing a responsive grid of
/// AchievementBadge tiles + their title/blurb. Locked rows render
/// with the desaturated badge + a strike-through-style title; hidden
/// achievements that haven't been unlocked yet render as "???"
/// mystery tiles so the trigger isn't spoiled.
///
/// Stats header up top: total unlocked / total available, plus a
/// per-tier breakdown ("3 / 5 gold") so completionists have a number
/// to chase.
///
/// Routing: this page is reached from the sidebar's "Achievements"
/// link. The route is `/achievements` (web) and the desktop equivalent
/// is registered alongside the existing in-app routes in App.tsx.

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { search as searchIcon } from "@base/primitives/icon/icons/search";
import { trophy } from "@base/primitives/icon/icons/trophy";

import {
  ACHIEVEMENTS,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  TIER_META,
} from "../../data/achievements";
import type {
  Achievement,
  AchievementCategory,
  AchievementTier,
} from "../../data/achievements";
import type { UnlockedRecord } from "../../lib/achievements";
import AchievementBadge from "./AchievementBadge";
import { useT } from "../../i18n/i18n";
import "./Achievements.css";

interface Props {
  unlocked: Set<string>;
  unlockedRecords: readonly UnlockedRecord[];
}

const TIER_ORDER: AchievementTier[] = ["bronze", "silver", "gold", "platinum"];

export default function AchievementsPage({
  unlocked,
  unlockedRecords,
}: Props) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    AchievementCategory | "all"
  >("all");

  const unlockedById = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of unlockedRecords) m.set(r.id, r.unlockedAt);
    return m;
  }, [unlockedRecords]);

  // Stats: total unlocked, per-tier counts. Hidden-still-locked
  // achievements DO count towards the denominator — the learner
  // should have a complete picture even if they haven't seen the
  // tile yet.
  const tierCounts = useMemo(() => {
    const totals: Record<AchievementTier, { unlocked: number; total: number }> =
      {
        bronze: { unlocked: 0, total: 0 },
        silver: { unlocked: 0, total: 0 },
        gold: { unlocked: 0, total: 0 },
        platinum: { unlocked: 0, total: 0 },
      };
    for (const a of ACHIEVEMENTS) {
      if (a.retired && !unlocked.has(a.id)) continue;
      totals[a.tier].total += 1;
      if (unlocked.has(a.id)) totals[a.tier].unlocked += 1;
    }
    return totals;
  }, [unlocked]);

  const totalUnlocked = useMemo(
    () => unlockedRecords.length,
    [unlockedRecords],
  );
  const totalAvailable = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => !a.retired || unlocked.has(a.id)).length,
    [unlocked],
  );

  const grouped = useMemo(() => {
    const m: Record<AchievementCategory, Achievement[]> = {
      progress: [],
      streak: [],
      volume: [],
      depth: [],
      breadth: [],
      mastery: [],
      esoteric: [],
    };
    const q = query.trim().toLowerCase();
    for (const a of ACHIEVEMENTS) {
      if (a.retired && !unlocked.has(a.id)) continue;
      if (categoryFilter !== "all" && a.category !== categoryFilter) continue;
      if (q.length > 0) {
        const haystack = `${a.title} ${a.blurb}`.toLowerCase();
        if (!haystack.includes(q)) continue;
      }
      m[a.category].push(a);
    }
    return m;
  }, [query, categoryFilter, unlocked]);

  // Page-level mouse tracker that tilts each tile toward the
  // cursor and slides the holographic foil's rainbow band as the
  // mouse moves. Each tile computes its own tilt from its
  // centre-to-mouse vector. Throttled to ~60fps via
  // requestAnimationFrame and skipped entirely under
  // `prefers-reduced-motion`.
  //
  // Math (Notion issue #baf3f5d5c4961dd1 — the first version
  // multiplied a normalized-distance term BY an attenuation
  // term, whose product peaks at ~0.25 → max tilt of only 1° at
  // the optimal cursor position; the tiles barely moved):
  //
  //   - Direct linear map: dx in pixels → ry in degrees via a
  //     fixed per-pixel rate, capped at ±MAX_TILT_DEG.
  //   - Rate tuned so MAX_TILT is hit when the cursor is
  //     ~half-a-viewport away. Closer cursor = within the cap;
  //     farther cursor = clamped to the cap (so even tiles in
  //     the far corner of the grid still face the cursor at
  //     full extent rather than barely moving).
  //   - No distance attenuation — the user wants every tile
  //     pointing at the cursor, not a localized "ripple" around
  //     it.
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = pageRef.current;
    if (!root) return;
    const MAX_TILT_DEG = 10;
    let frameId: number | null = null;
    let last: { x: number; y: number } | null = null;
    const apply = () => {
      frameId = null;
      if (!last) return;
      const { x: mx, y: my } = last;
      // Half-viewport as the "tilt saturates here" distance.
      // Beyond it the tilt clamps at MAX_TILT_DEG so far tiles
      // still present full face to the cursor.
      const saturate =
        Math.max(window.innerWidth, window.innerHeight) * 0.5;
      const tiles = root.querySelectorAll<HTMLElement>(
        ".libre-ach-page__tile",
      );
      tiles.forEach((tile) => {
        const rect = tile.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        // Linear ramp to ±MAX_TILT_DEG. Clamp via Math.max/min
        // rather than a smoothstep so the falloff feels
        // mechanical — every tile face is genuinely tracking
        // the cursor's position, not following a soft curve.
        const ry = Math.max(
          -MAX_TILT_DEG,
          Math.min(MAX_TILT_DEG, (dx / saturate) * MAX_TILT_DEG),
        );
        const rx = Math.max(
          -MAX_TILT_DEG,
          Math.min(MAX_TILT_DEG, (-dy / saturate) * MAX_TILT_DEG),
        );
        tile.style.setProperty("--libre-ach-rx", `${rx.toFixed(2)}deg`);
        tile.style.setProperty("--libre-ach-ry", `${ry.toFixed(2)}deg`);
        // Foil sweep position — mirrors the rainbow band along
        // the cursor's horizontal vector. Clamps to 20-80% so the
        // band never disappears off-tile.
        const fpRaw = 50 + (dx / saturate) * 30;
        tile.style.setProperty(
          "--libre-ach-foil",
          `${Math.max(20, Math.min(80, fpRaw)).toFixed(1)}%`,
        );
      });
    };
    const onMove = (e: MouseEvent) => {
      last = { x: e.clientX, y: e.clientY };
      if (frameId == null) frameId = requestAnimationFrame(apply);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="libre-ach-page" ref={pageRef}>
      <div className="libre-ach-page__inner">
      <header className="libre-ach-page__head">
        <div className="libre-ach-page__head-row">
          <Icon icon={trophy} size="2xl" color="currentColor" />
          <div className="libre-ach-page__head-text">
            <span className="libre-ach-page__eyebrow">{t("achievements.title")}</span>
            <h1 className="libre-ach-page__title">
              {t("achievements.earnedHeadline", { done: totalUnlocked, total: totalAvailable })}
            </h1>
          </div>
        </div>
        <ul className="libre-ach-page__tier-counts">
          {TIER_ORDER.map((tier) => {
            const c = tierCounts[tier];
            const meta = TIER_META[tier];
            return (
              <li
                key={tier}
                className="libre-ach-page__tier-count"
                style={
                  {
                    "--libre-ach-tint": meta.color,
                  } as React.CSSProperties
                }
              >
                <span className="libre-ach-page__tier-dot" />
                <span className="libre-ach-page__tier-label">
                  {tier} · {c.unlocked} / {c.total}
                </span>
              </li>
            );
          })}
        </ul>
      </header>

      <div className="libre-ach-page__filters">
        <label className="libre-ach-page__search">
          <Icon icon={searchIcon} size="sm" color="currentColor" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("achievements.searchPlaceholder")}
            aria-label={t("achievements.searchPlaceholder")}
          />
        </label>
        <div className="libre-ach-page__category-pills">
          <button
            type="button"
            className={`libre-ach-page__pill ${categoryFilter === "all" ? "libre-ach-page__pill--active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            {t("achievements.filterAll")}
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`libre-ach-page__pill ${categoryFilter === cat ? "libre-ach-page__pill--active" : ""}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="libre-ach-page__sections">
        {CATEGORY_ORDER.map((cat) => {
          const list = grouped[cat];
          if (list.length === 0) return null;
          return (
            <section key={cat} className="libre-ach-page__section">
              <h2 className="libre-ach-page__section-title">
                {CATEGORY_LABEL[cat]}
              </h2>
              <ul className="libre-ach-page__grid">
                {list.map((a) => {
                  const isUnlocked = unlocked.has(a.id);
                  const isMystery = !isUnlocked && a.hidden === true;
                  const unlockedAt = unlockedById.get(a.id);
                  return (
                    <li
                      key={a.id}
                      className={`libre-ach-page__tile ${isUnlocked ? "libre-ach-page__tile--unlocked" : "libre-ach-page__tile--locked"} ${isMystery ? "libre-ach-page__tile--mystery" : ""}`}
                    >
                      <AchievementBadge
                        achievement={a}
                        locked={!isUnlocked && !isMystery}
                        mystery={isMystery}
                        size="md"
                      />
                      <div className="libre-ach-page__tile-text">
                        <span className="libre-ach-page__tile-title">
                          {isMystery ? t("achievements.mysteryTitle") : a.title}
                          {a.retired ? (
                            <span className="libre-ach-page__retired-pill">
                              {t("achievements.retired")}
                            </span>
                          ) : null}
                        </span>
                        <span className="libre-ach-page__tile-blurb">
                          {isMystery
                            ? t("achievements.mysteryBlurb")
                            : a.blurb}
                        </span>
                        {isUnlocked && unlockedAt ? (
                          <span className="libre-ach-page__tile-when">
                            {formatRelative(unlockedAt, t)}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}

/// Compact relative-time formatter — the Achievements list shows
/// when each was unlocked. We don't need a full Intl.RelativeTimeFormat
/// pass; coarse buckets are fine ("today", "yesterday", "5 days ago",
/// "3 months ago", "last year").
function formatRelative(
  unlockedAt: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const now = Date.now();
  const diff = Math.max(0, now - unlockedAt);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t("achievements.justNow");
  const min = Math.floor(sec / 60);
  if (min < 60)
    return min === 1
      ? t("achievements.minutesAgo", { n: min })
      : t("achievements.minutesAgoPlural", { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24)
    return hr === 1
      ? t("achievements.hoursAgo", { n: hr })
      : t("achievements.hoursAgoPlural", { n: hr });
  const day = Math.floor(hr / 24);
  if (day === 1) return t("achievements.yesterday");
  if (day < 30) return t("achievements.daysAgo", { n: day });
  const month = Math.floor(day / 30);
  if (month < 12)
    return month === 1
      ? t("achievements.monthsAgo", { n: month })
      : t("achievements.monthsAgoPlural", { n: month });
  const yr = Math.floor(day / 365);
  return yr === 1
    ? t("achievements.yearsAgo", { n: yr })
    : t("achievements.yearsAgoPlural", { n: yr });
}
