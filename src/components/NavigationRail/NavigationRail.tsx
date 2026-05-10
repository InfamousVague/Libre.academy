/// Slim icon-only rail to the LEFT of the floating sidebar. Holds the
/// app's primary navigation (Library / Playground / Discover /
/// Practice / Achievements / Tracks / Trees) plus the persistent
/// footer cluster
/// (Settings + sidebar toggle).
///
/// Why a separate rail instead of more sidebar chrome:
///   - The sidebar collapses entirely when the learner hits Hide
///     Sidebar; with the nav living INSIDE the sidebar, that hid the
///     primary route switcher too. A rail lives outside the sidebar
///     so navigation stays reachable in collapsed mode.
///   - A 56px-wide icon column is much more efficient real estate
///     for nav than the 260px-wide course-tree sidebar — the icons
///     read as a fixed reference column the way macOS sidebars do.
///   - Pinning Settings + the sidebar toggle to the bottom of the
///     rail puts the "infrastructure" controls in a stable corner
///     out of the primary scan path.
///
/// Visual chrome mirrors the sidebar's frosted-glass treatment so the
/// rail and sidebar read as a paired unit despite living in separate
/// containers.

import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { libraryBig } from "@base/primitives/icon/icons/library-big";
import { compass as compassIcon } from "@base/primitives/icon/icons/compass";
import { trees as treesIcon } from "@base/primitives/icon/icons/trees";
import { trainTrack } from "@base/primitives/icon/icons/train-track";
import { dumbbell } from "@base/primitives/icon/icons/dumbbell";
import { trophy } from "@base/primitives/icon/icons/trophy";
import { terminal as terminalIcon } from "@base/primitives/icon/icons/terminal";
import { settings as settingsIcon } from "@base/primitives/icon/icons/settings";
import { circleHelp } from "@base/primitives/icon/icons/circle-help";
import { panelLeftClose } from "@base/primitives/icon/icons/panel-left-close";
import { panelLeftOpen } from "@base/primitives/icon/icons/panel-left-open";
import { Tooltip } from "@base/primitives/tooltip";
import "@base/primitives/icon/icon.css";
import "@base/primitives/tooltip/tooltip.css";
import NotificationDrawer from "./NotificationDrawer";
import "./NavigationRail.css";

export interface NavigationRailProps {
  /// Which main-pane destination is currently showing. Drives the
  /// pill highlight. "courses" / "profile" are valid app routes that
  /// don't map to a rail icon — those return `undefined active` so
  /// no rail row lights up.
  activeView?:
    | "courses"
    | "profile"
    | "playground"
    | "library"
    | "discover"
    | "trees"
    | "tracks"
    | "practice"
    | "achievements";
  onLibrary: () => void;
  /// Discover route — browse catalog books + challenge packs not
  /// yet in the user's library. Optional; embeddings without one
  /// just hide the chip.
  onDiscover?: () => void;
  /// Trees route — skill-tree explorer.
  onTrees?: () => void;
  /// Tracks route — curated linear paths through one or more trees.
  /// Lives next to Trees in the rail because the two affordances
  /// are complementary: Trees show the prerequisite DAG, Tracks
  /// show author-curated recipes through it.
  onTracks?: () => void;
  /// Practice route — review-mode that resurfaces quizzes and
  /// blocks puzzles from courses the learner has already touched.
  /// The rest of the app is linear-by-lesson; Practice is the
  /// random-access "drill weak spots" surface that closes the
  /// learn → review loop.
  onPractice?: () => void;
  /// Achievements route — browse-all surface for the unlock
  /// library. Optional; when omitted the chip just doesn't render.
  onAchievements?: () => void;
  /// Playground route — free-form coding sandbox.
  onPlayground?: () => void;
  onSettings: () => void;
  /// Re-trigger the guided tour (auto-runs on first launch; this
  /// puts a permanent affordance in the rail so a learner who
  /// dismissed it can come back). Optional — embeddings that
  /// don't ship the tour just hide the row.
  onStartTour?: () => void;
  /// Toggle the floating sidebar's visibility. The icon flips between
  /// panel-left-close (sidebar visible → click to hide) and
  /// panel-left-open (sidebar hidden → click to show). When omitted,
  /// the toggle row simply doesn't render — useful for surfaces that
  /// don't ship a sidebar (popped workbench, phone popout, etc., even
  /// though those don't render this rail today either).
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

interface RailItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  /// The active-state ring is drawn via a `--active` modifier class;
  /// the title attribute carries the visible label since the rail
  /// itself is icon-only. Same vocabulary the MobileTabBar uses.
  pressed?: boolean;
}

function RailItem({ icon, label, onClick, active, pressed }: RailItemProps) {
  return (
    <Tooltip content={label} placement="right" delay={120}>
      <button
        type="button"
        className={
          "fishbones-nav-rail__item" +
          (active ? " fishbones-nav-rail__item--active" : "")
        }
        onClick={onClick}
        aria-label={label}
        aria-pressed={pressed}
      >
        {/* size="xl" — bumped up from the original "sm" so the rail
            glyphs read as primary-nav, but stepped down from "2xl"
            which crowded the 40×40 button. xl (22px) leaves ~9px
            of ring inside the button for hover / active contrast. */}
        <Icon icon={icon} size="xl" color="currentColor" />
      </button>
    </Tooltip>
  );
}

export default function NavigationRail({
  activeView,
  onLibrary,
  onDiscover,
  onTrees,
  onTracks,
  onPractice,
  onAchievements,
  onPlayground,
  onSettings,
  onStartTour,
  onToggleSidebar,
  sidebarCollapsed,
}: NavigationRailProps) {
  // Sliding-pill indicator: a single absolutely-positioned element
  // animates its `top` between the active rail button's positions
  // rather than the highlight snapping from one button to another.
  // We measure the active button's offset relative to the top
  // cluster after every render that affects which button is active
  // OR which buttons are present (sign-in toggling Trees / Discover
  // visibility, etc.) so the pill stays glued to the right anchor.
  // Using `useLayoutEffect` so the measurement happens before paint
  // — without it the pill snaps to top:0 on the first frame and
  // visibly leaps into place a microframe later.
  const topRef = useRef<HTMLDivElement>(null);
  const [pillTop, setPillTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    const top = topRef.current;
    if (!top) {
      setPillTop(null);
      return;
    }
    const activeBtn = top.querySelector(
      ".fishbones-nav-rail__item--active",
    ) as HTMLElement | null;
    if (!activeBtn) {
      // Active route doesn't have a rail icon (e.g. "courses" or
      // "profile" routes). Hide the pill so an old position doesn't
      // float over the rail looking stuck.
      setPillTop(null);
      return;
    }
    const topRect = top.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setPillTop(btnRect.top - topRect.top);
    // Re-measure when conditional items toggle visibility — without
    // these in the deps, a rail item appearing (e.g. user signs in
    // and Trees becomes available) would shift the active button's
    // offset without re-running the effect, leaving the pill
    // misaligned.
  }, [activeView, onDiscover, onTrees, onTracks, onPractice, onAchievements, onPlayground]);

  return (
    <nav className="fishbones-nav-rail" aria-label="Primary navigation">
      <div className="fishbones-nav-rail__top" ref={topRef}>
        {pillTop !== null && (
          <span
            className="fishbones-nav-rail__pill"
            style={{ transform: `translateY(${pillTop}px)` }}
            aria-hidden
          />
        )}
        {/* Order rationale (top → bottom):
              1. Library      — the home + most-visited surface
              2. Playground   — open-ended editor, surfaced near the
                               top so devs can dive in without first
                               picking a course
              3. Discover     — catalog browser; sits next to
                               Playground because both are entry
                               points for "I want to start something"
              4. Practice     — review-mode for cards already opened;
                               middle of the rail because it's a
                               recurring rhythm, not a one-off start
              5. Achievements — unlock browser; below Practice so
                               the run-of-day affordances cluster
                               above the trophy case
              6. Tracks       — curated linear paths (less primary
                               than Library / Practice for the
                               typical learner)
              7. Trees        — full skill-DAG; bottom because it's
                               the deepest / most exploratory affordance,
                               and Tracks above it hands the learner
                               a friendlier on-ramp into the same content
        */}
        <RailItem
          icon={libraryBig}
          label="Library"
          onClick={onLibrary}
          active={activeView === "library"}
        />
        {onPlayground && (
          <RailItem
            icon={terminalIcon}
            label="Playground"
            onClick={onPlayground}
            active={activeView === "playground"}
          />
        )}
        {onDiscover && (
          <RailItem
            icon={compassIcon}
            label="Discover"
            onClick={onDiscover}
            active={activeView === "discover"}
          />
        )}
        {onPractice && (
          <RailItem
            icon={dumbbell}
            label="Practice"
            onClick={onPractice}
            active={activeView === "practice"}
          />
        )}
        {onAchievements && (
          <RailItem
            icon={trophy}
            label="Achievements"
            onClick={onAchievements}
            active={activeView === "achievements"}
          />
        )}
        {onTracks && (
          <RailItem
            icon={trainTrack}
            label="Tracks"
            onClick={onTracks}
            active={activeView === "tracks"}
          />
        )}
        {onTrees && (
          <RailItem
            icon={treesIcon}
            label="Trees"
            onClick={onTrees}
            active={activeView === "trees"}
          />
        )}
      </div>
      <div className="fishbones-nav-rail__bottom">
        {/* Bottom cluster, top → bottom: sidebar toggle, notification
            bell, help, settings. The sidebar toggle anchors the top
            of this group (the most common bottom-rail interaction),
            with the bell just below it so the unread chip lives
            next to a frequently-clicked button without sitting on
            top of the navigation list above. Settings is at the
            very bottom (conventional Mac-app spot) with help docked
            one row up so the "I need a hint" affordance sits beside
            the knob it usually nudges the user toward. */}
        {onToggleSidebar && (
          <RailItem
            icon={sidebarCollapsed ? panelLeftOpen : panelLeftClose}
            label={
              sidebarCollapsed ? "Show sidebar (⌘\\)" : "Hide sidebar (⌘\\)"
            }
            onClick={onToggleSidebar}
            pressed={sidebarCollapsed}
          />
        )}
        <NotificationDrawer />
        {onStartTour && (
          <RailItem
            icon={circleHelp}
            label="Take the tour"
            onClick={onStartTour}
          />
        )}
        <RailItem
          icon={settingsIcon}
          label="Settings"
          onClick={onSettings}
        />
      </div>
    </nav>
  );
}
