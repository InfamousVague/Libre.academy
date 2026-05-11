/// Notification bell + popover drawer for the navigation rail's
/// bottom cluster. Self-contained: reads achievement-unlock records
/// straight from localStorage (the same persistence the
/// useAchievements hook owns) so no extra App.tsx plumbing needed.
///
/// What it surfaces today:
///   - The most recent achievement unlocks, newest first, capped at 8
///   - Unread count = unlocks newer than the last-seen timestamp
///     persisted under `libre:notifications:last-seen-at`
///
/// Designed so additional notification sources slot in cheaply later
/// (course-update available, sync issue, app update). Each source
/// produces a `NotificationItem`; the drawer renders the merged
/// list sorted by timestamp.
///
/// Click-outside closes the popover, Escape too. The bell button
/// renders a small badge dot in the upper-right when unread > 0;
/// opening the drawer marks all currently-visible items as read.

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { bell } from "@base/primitives/icon/icons/bell";
import { x as xIcon } from "@base/primitives/icon/icons/x";
import "@base/primitives/icon/icon.css";
import { ACHIEVEMENTS } from "../../data/achievements";
import { resolveAchievementImage } from "../../data/achievementImages";
import "./NotificationDrawer.css";

interface UnlockedRecord {
  id: string;
  unlockedAt: number;
}

const ACH_KEY = "libre:achievements:unlocked";
const SEEN_KEY = "libre:notifications:last-seen-at";
const MAX_VISIBLE = 8;

interface NotificationItem {
  id: string;
  ts: number;
  title: string;
  blurb?: string;
  /// Optional image URL. When set the row renders a small thumbnail
  /// in place of the bell glyph (achievement unlocks use this).
  image?: string;
}

function readUnlocked(): UnlockedRecord[] {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is UnlockedRecord =>
        r &&
        typeof r === "object" &&
        typeof r.id === "string" &&
        typeof r.unlockedAt === "number",
    );
  } catch {
    return [];
  }
}

function readLastSeen(): number {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeLastSeen(ts: number): void {
  try {
    localStorage.setItem(SEEN_KEY, String(ts));
  } catch {
    /* private mode — silent */
  }
}

function formatRelative(now: number, ts: number): string {
  const diff = Math.max(0, now - ts);
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const [unlocks, setUnlocks] = useState<UnlockedRecord[]>(() => readUnlocked());
  const [lastSeen, setLastSeen] = useState<number>(() => readLastSeen());
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Refresh on focus + on cross-tab storage events. Cheap — the
  // achievement unlock list is tiny.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => {
      setUnlocks(readUnlocked());
      setLastSeen(readLastSeen());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACH_KEY || e.key === SEEN_KEY) refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    // Also poll every 30s while the rail is mounted — cheap and
    // catches the case where another part of THIS tab updates the
    // unlock list (the storage event doesn't fire in the writing tab).
    const id = window.setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(id);
    };
  }, []);

  // Click-outside-to-close + Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && wrapperRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Build the renderable items list. Sort newest first, cap to
  // MAX_VISIBLE so the drawer stays a glanceable preview rather
  // than a scroll surface.
  const items = useMemo<NotificationItem[]>(() => {
    const sorted = [...unlocks].sort((a, b) => b.unlockedAt - a.unlockedAt);
    const capped = sorted.slice(0, MAX_VISIBLE);
    const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a] as const));
    return capped.map((rec) => {
      const ach = byId.get(rec.id);
      const image = resolveAchievementImage(rec.id) ?? undefined;
      return {
        id: rec.id,
        ts: rec.unlockedAt,
        title: ach ? `Unlocked: ${ach.title}` : `Unlocked: ${rec.id}`,
        blurb: ach?.blurb,
        image,
      };
    });
  }, [unlocks]);

  const unreadCount = items.filter((i) => i.ts > lastSeen).length;

  // Open the drawer + mark currently-visible unlocks as seen. We use
  // the freshest item's timestamp as the new last-seen mark so the
  // counter doesn't reset to 0 prematurely if the user opens the
  // drawer mid-burst.
  const togglePanel = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && items.length > 0) {
        const newest = items[0].ts;
        writeLastSeen(newest);
        setLastSeen(newest);
      }
      return next;
    });
  };

  const markAllRead = () => {
    if (items.length === 0) return;
    const newest = items[0].ts;
    writeLastSeen(newest);
    setLastSeen(newest);
  };

  const now = Date.now();

  return (
    <div ref={wrapperRef} className="fb-notif">
      <button
        type="button"
        className="fb-notif__trigger"
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        aria-expanded={open}
        onClick={togglePanel}
      >
        <Icon icon={bell} size="xl" color="currentColor" weight="regular" />
        {unreadCount > 0 && (
          <span className="fb-notif__badge" aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fb-notif__panel" role="dialog" aria-label="Notifications">
          <div className="fb-notif__panel-head">
            <span className="fb-notif__panel-title">Notifications</span>
            <div className="fb-notif__panel-actions">
              {items.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  className="fb-notif__panel-link"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                className="fb-notif__panel-close"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
              >
                <Icon icon={xIcon} size="xs" color="currentColor" />
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="fb-notif__empty">
              <span className="fb-notif__empty-glyph" aria-hidden>
                ✦
              </span>
              <div className="fb-notif__empty-title">All caught up</div>
              <div className="fb-notif__empty-blurb">
                Achievement unlocks and other notifications will land here.
              </div>
            </div>
          ) : (
            <ul className="fb-notif__list">
              {items.map((it) => (
                <li
                  key={`${it.id}-${it.ts}`}
                  className={
                    "fb-notif__item" +
                    (it.ts > lastSeen ? " fb-notif__item--unread" : "")
                  }
                >
                  <div className="fb-notif__item-icon" aria-hidden>
                    {it.image ? (
                      <img
                        src={it.image}
                        alt=""
                        className="fb-notif__item-img"
                        draggable={false}
                      />
                    ) : (
                      <Icon icon={bell} size="sm" color="currentColor" />
                    )}
                  </div>
                  <div className="fb-notif__item-body">
                    <div className="fb-notif__item-title">{it.title}</div>
                    {it.blurb && (
                      <div className="fb-notif__item-blurb">{it.blurb}</div>
                    )}
                  </div>
                  <div className="fb-notif__item-ts">
                    {formatRelative(now, it.ts)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
