/// Resolve an `AchievementIconId` (string slug) to the matching
/// `@base/primitives/icon` SVG-path constant. Centralising this here
/// keeps `src/data/achievements.ts` icon-library-agnostic — the
/// registry stays a JSON-shaped value (cheap to import, cheap to
/// stringify) while the UI layer pulls in the actual icon paths only
/// where it needs them.
///
/// To add an icon: add the slug to `AchievementIconId` in
/// `src/data/achievements.ts`, drop a row here, done.

import { award } from "@base/primitives/icon/icons/award";
import { badgeCheck } from "@base/primitives/icon/icons/badge-check";
import { bookA } from "@base/primitives/icon/icons/book-a";
import { bookCheck } from "@base/primitives/icon/icons/book-check";
import { bookCopy } from "@base/primitives/icon/icons/book-copy";
import { bookOpen } from "@base/primitives/icon/icons/book-open";
import { bookmark } from "@base/primitives/icon/icons/bookmark";
import { calendarDays } from "@base/primitives/icon/icons/calendar-days";
import { coins } from "@base/primitives/icon/icons/coins";
import { compass } from "@base/primitives/icon/icons/compass";
import { crown } from "@base/primitives/icon/icons/crown";
import { diamond } from "@base/primitives/icon/icons/diamond";
import { flame } from "@base/primitives/icon/icons/flame";
import { footprints } from "@base/primitives/icon/icons/footprints";
import { hammer } from "@base/primitives/icon/icons/hammer";
import { languages } from "@base/primitives/icon/icons/languages";
import { layers } from "@base/primitives/icon/icons/layers";
import { library } from "@base/primitives/icon/icons/library";
import { libraryBig } from "@base/primitives/icon/icons/library-big";
import { medal } from "@base/primitives/icon/icons/medal";
import { moon } from "@base/primitives/icon/icons/moon";
import { snowflake } from "@base/primitives/icon/icons/snowflake";
import { sparkles } from "@base/primitives/icon/icons/sparkles";
import { sun } from "@base/primitives/icon/icons/sun";
import { sunrise } from "@base/primitives/icon/icons/sunrise";
import { trophy } from "@base/primitives/icon/icons/trophy";
import { wrench } from "@base/primitives/icon/icons/wrench";
import { zap } from "@base/primitives/icon/icons/zap";
import type { AchievementIconId } from "../data/achievements";

const ICONS: Record<AchievementIconId, string> = {
  award,
  "badge-check": badgeCheck,
  "book-a": bookA,
  "book-check": bookCheck,
  "book-copy": bookCopy,
  "book-open": bookOpen,
  bookmark,
  "calendar-days": calendarDays,
  coins,
  compass,
  crown,
  diamond,
  flame,
  footprints,
  hammer,
  languages,
  layers,
  library,
  "library-big": libraryBig,
  medal,
  moon,
  snowflake,
  sparkles,
  sun,
  sunrise,
  trophy,
  wrench,
  zap,
};

export function resolveAchievementIcon(id: AchievementIconId): string {
  return ICONS[id];
}
