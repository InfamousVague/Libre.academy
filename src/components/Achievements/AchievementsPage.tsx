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

import { useMemo, useState } from "react";
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

  return (
    <div className="fb-ach-page">
      <header className="fb-ach-page__head">
        <div className="fb-ach-page__head-row">
          <Icon icon={trophy} size="2xl" color="currentColor" />
          <div className="fb-ach-page__head-text">
            <span className="fb-ach-page__eyebrow">Achievements</span>
            <h1 className="fb-ach-page__title">
              {totalUnlocked} / {totalAvailable} earned
            </h1>
          </div>
        </div>
        <ul className="fb-ach-page__tier-counts">
          {TIER_ORDER.map((tier) => {
            const c = tierCounts[tier];
            const meta = TIER_META[tier];
            return (
              <li
                key={tier}
                className="fb-ach-page__tier-count"
                style={
                  {
                    "--fb-ach-tint": meta.color,
                  } as React.CSSProperties
                }
              >
                <span className="fb-ach-page__tier-dot" />
                <span className="fb-ach-page__tier-label">
                  {tier} · {c.unlocked} / {c.total}
                </span>
              </li>
            );
          })}
        </ul>
      </header>

      <div className="fb-ach-page__filters">
        <label className="fb-ach-page__search">
          <Icon icon={searchIcon} size="sm" color="currentColor" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search achievements"
            aria-label="Search achievements"
          />
        </label>
        <div className="fb-ach-page__category-pills">
          <button
            type="button"
            className={`fb-ach-page__pill ${categoryFilter === "all" ? "fb-ach-page__pill--active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            All
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`fb-ach-page__pill ${categoryFilter === cat ? "fb-ach-page__pill--active" : ""}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="fb-ach-page__sections">
        {CATEGORY_ORDER.map((cat) => {
          const list = grouped[cat];
          if (list.length === 0) return null;
          return (
            <section key={cat} className="fb-ach-page__section">
              <h2 className="fb-ach-page__section-title">
                {CATEGORY_LABEL[cat]}
              </h2>
              <ul className="fb-ach-page__grid">
                {list.map((a) => {
                  const isUnlocked = unlocked.has(a.id);
                  const isMystery = !isUnlocked && a.hidden === true;
                  const unlockedAt = unlockedById.get(a.id);
                  return (
                    <li
                      key={a.id}
                      className={`fb-ach-page__tile ${isUnlocked ? "fb-ach-page__tile--unlocked" : "fb-ach-page__tile--locked"} ${isMystery ? "fb-ach-page__tile--mystery" : ""}`}
                    >
                      <AchievementBadge
                        achievement={a}
                        locked={!isUnlocked && !isMystery}
                        mystery={isMystery}
                        size="md"
                      />
                      <div className="fb-ach-page__tile-text">
                        <span className="fb-ach-page__tile-title">
                          {isMystery ? "???" : a.title}
                          {a.retired ? (
                            <span className="fb-ach-page__retired-pill">
                              retired
                            </span>
                          ) : null}
                        </span>
                        <span className="fb-ach-page__tile-blurb">
                          {isMystery
                            ? "Hidden achievement. Keep going."
                            : a.blurb}
                        </span>
                        {isUnlocked && unlockedAt ? (
                          <span className="fb-ach-page__tile-when">
                            {formatRelative(unlockedAt)}
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
  );
}

/// Compact relative-time formatter — the Achievements list shows
/// when each was unlocked. We don't need a full Intl.RelativeTimeFormat
/// pass; coarse buckets are fine ("today", "yesterday", "5 days ago",
/// "3 months ago", "last year").
function formatRelative(unlockedAt: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - unlockedAt);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 30) return `${day} days ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} month${month === 1 ? "" : "s"} ago`;
  const yr = Math.floor(day / 365);
  return `${yr} year${yr === 1 ? "" : "s"} ago`;
}
