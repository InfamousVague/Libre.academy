/// Slim icon-only rail to the LEFT of the floating sidebar. Holds the
/// app's primary navigation (Library / Discover / Trees / Playground)
/// plus the persistent footer cluster (Settings + sidebar toggle).
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

import { Icon } from "@base/primitives/icon";
import { libraryBig } from "@base/primitives/icon/icons/library-big";
import { compass as compassIcon } from "@base/primitives/icon/icons/compass";
import { trees as treesIcon } from "@base/primitives/icon/icons/trees";
import { terminal as terminalIcon } from "@base/primitives/icon/icons/terminal";
import { settings as settingsIcon } from "@base/primitives/icon/icons/settings";
import { circleHelp } from "@base/primitives/icon/icons/circle-help";
import { panelLeftClose } from "@base/primitives/icon/icons/panel-left-close";
import { panelLeftOpen } from "@base/primitives/icon/icons/panel-left-open";
import { Tooltip } from "@base/primitives/tooltip";
import "@base/primitives/icon/icon.css";
import "@base/primitives/tooltip/tooltip.css";
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
    | "trees";
  onLibrary: () => void;
  /// Discover route — browse catalog books + challenge packs not
  /// yet in the user's library. Optional; embeddings without one
  /// just hide the chip.
  onDiscover?: () => void;
  /// Trees route — skill-tree explorer.
  onTrees?: () => void;
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
        <Icon icon={icon} size="sm" color="currentColor" />
      </button>
    </Tooltip>
  );
}

export default function NavigationRail({
  activeView,
  onLibrary,
  onDiscover,
  onTrees,
  onPlayground,
  onSettings,
  onStartTour,
  onToggleSidebar,
  sidebarCollapsed,
}: NavigationRailProps) {
  return (
    <nav className="fishbones-nav-rail" aria-label="Primary navigation">
      <div className="fishbones-nav-rail__top">
        <RailItem
          icon={libraryBig}
          label="Library"
          onClick={onLibrary}
          active={activeView === "library"}
        />
        {onDiscover && (
          <RailItem
            icon={compassIcon}
            label="Discover"
            onClick={onDiscover}
            active={activeView === "discover"}
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
        {onPlayground && (
          <RailItem
            icon={terminalIcon}
            label="Playground"
            onClick={onPlayground}
            active={activeView === "playground"}
          />
        )}
      </div>
      <div className="fishbones-nav-rail__bottom">
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
      </div>
    </nav>
  );
}
