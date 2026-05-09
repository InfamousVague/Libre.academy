/// Mobile-only bottom tab bar. Replaces the desktop TopBar + Sidebar
/// chrome on iOS — three buttons, sticky to the bottom edge with the
/// iOS home-indicator safe area respected. Renders nothing on
/// non-mobile (the desktop sidebar is the navigation surface there).

import { Icon } from "@base/primitives/icon";
import { library } from "@base/primitives/icon/icons/library";
import { bookOpen } from "@base/primitives/icon/icons/book-open";
import { dumbbell } from "@base/primitives/icon/icons/dumbbell";
import { user } from "@base/primitives/icon/icons/user";
import { settings } from "@base/primitives/icon/icons/settings";
import "./MobileTabBar.css";

export type MobileTab =
  | "library"
  | "courses"
  | "practice"
  | "profile"
  | "settings";

interface Props {
  active: MobileTab;
  hasActiveLesson: boolean;
  onLibrary: () => void;
  onLesson: () => void;
  /// Practice tab handler. Optional so embeddings without the
  /// Practice surface (legacy mobile builds during rollout) can
  /// still mount the bar; when omitted, the button is hidden.
  onPractice?: () => void;
  onProfile: () => void;
  onSettings: () => void;
}

export default function MobileTabBar({
  active,
  hasActiveLesson,
  onLibrary,
  onLesson,
  onPractice,
  onProfile,
  onSettings,
}: Props) {
  return (
    <>
      {/* Gradient blur band that catches content scrolling under the
          floating tab pill. Sibling to the nav rather than child so
          its z-index sits below the pill's `z-index: 100` — the pill
          stays opaque at its own level, the band only blurs the
          space behind. aria-hidden because it's pure visual chrome. */}
      <div className="fishbones-mtab-blur" aria-hidden />
      <nav className="fishbones-mtab" aria-label="Primary navigation">
      <button
        type="button"
        className={`fishbones-mtab__btn${active === "library" ? " fishbones-mtab__btn--active" : ""}`}
        onClick={onLibrary}
      >
        <Icon icon={library} size="lg" />
        <span>Library</span>
      </button>
      <button
        type="button"
        className={`fishbones-mtab__btn${active === "courses" ? " fishbones-mtab__btn--active" : ""}`}
        onClick={onLesson}
        disabled={!hasActiveLesson}
        aria-disabled={!hasActiveLesson}
      >
        <Icon icon={bookOpen} size="lg" />
        <span>Lesson</span>
      </button>
      {onPractice && (
        <button
          type="button"
          className={`fishbones-mtab__btn${active === "practice" ? " fishbones-mtab__btn--active" : ""}`}
          onClick={onPractice}
        >
          <Icon icon={dumbbell} size="lg" />
          <span>Practice</span>
        </button>
      )}
      <button
        type="button"
        className={`fishbones-mtab__btn${active === "profile" ? " fishbones-mtab__btn--active" : ""}`}
        onClick={onProfile}
      >
        <Icon icon={user} size="lg" />
        <span>Profile</span>
      </button>
      <button
        type="button"
        className={`fishbones-mtab__btn${active === "settings" ? " fishbones-mtab__btn--active" : ""}`}
        onClick={onSettings}
      >
        <Icon icon={settings} size="lg" />
        <span>Settings</span>
      </button>
      </nav>
    </>
  );
}
