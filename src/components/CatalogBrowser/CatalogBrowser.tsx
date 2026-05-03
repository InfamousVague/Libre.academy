/// "Browse the Fishbones library" modal. Lets the user search the
/// catalog (mattssoftware.com/fishbones/catalog/manifest.json on
/// desktop; same-origin starter-courses/manifest.json on web) and
/// install any course. The default seeded library is intentionally
/// small (TRPL + Mastering Ethereum + challenges); this is how the
/// user discovers and adds the rest of the catalog.
///
/// Mounted at app level (App.tsx) and gated by an `open` prop so the
/// catalog fetch + the heavy DOM only mount when the user actually
/// asks. Closes on background click, Escape, or the explicit close
/// button.

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { search as searchIcon } from "@base/primitives/icon/icons/search";
import { x as xIcon } from "@base/primitives/icon/icons/x";
import { download as downloadIcon } from "@base/primitives/icon/icons/download";
import { check as checkIcon } from "@base/primitives/icon/icons/check";
import "@base/primitives/icon/icon.css";
import { useCatalog } from "../../hooks/useCatalog";
import { type CatalogEntry, coverHref } from "../../lib/catalog";
import "./CatalogBrowser.css";

interface Props {
  open: boolean;
  onClose: () => void;
  /// Set of course ids already installed in the user's local
  /// library — drives the "Installed" badge + disables the
  /// install button so a click doesn't re-download what they have.
  installedIds: ReadonlySet<string>;
  /// Same handler the library uses for placeholder tiles —
  /// downloads the .fishbones archive (desktop) or fetches the
  /// course JSON (web), then refreshes the courses list.
  onInstall: (entry: CatalogEntry) => Promise<void> | void;
}

export default function CatalogBrowser({
  open,
  onClose,
  installedIds,
  onInstall,
}: Props) {
  const { catalog, loaded } = useCatalog();
  const [query, setQuery] = useState("");
  /// Track ids currently being installed so the row swaps to a
  /// disabled "Installing…" state and the user doesn't double-click.
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  // Escape to close. Bound at the window level so a focus deep
  // inside the search input doesn't swallow it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((e) => {
      const hay = `${e.title} ${e.author ?? ""} ${e.language} ${e.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, query]);

  // Split into available + already-installed so the user sees what
  // they can ADD without scrolling past everything they already
  // have. Installed ones still render at the bottom (greyed) so
  // they can confirm a course is in their library.
  const { available, alreadyInstalled } = useMemo(() => {
    const available: CatalogEntry[] = [];
    const alreadyInstalled: CatalogEntry[] = [];
    for (const e of filtered) {
      if (installedIds.has(e.id)) alreadyInstalled.push(e);
      else available.push(e);
    }
    return { available, alreadyInstalled };
  }, [filtered, installedIds]);

  const handleInstall = async (entry: CatalogEntry) => {
    if (installing.has(entry.id) || installedIds.has(entry.id)) return;
    setInstalling((prev) => {
      const next = new Set(prev);
      next.add(entry.id);
      return next;
    });
    try {
      await onInstall(entry);
    } finally {
      setInstalling((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fishbones-catalog-browser-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="fishbones-catalog-browser"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fishbones-catalog-browser-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="fishbones-catalog-browser-head">
          <div>
            <h2
              id="fishbones-catalog-browser-title"
              className="fishbones-catalog-browser-title"
            >
              Browse the Fishbones library
            </h2>
            <p className="fishbones-catalog-browser-blurb">
              Search and install official courses. Anything you add here
              joins your personal library.
            </p>
          </div>
          <button
            type="button"
            className="fishbones-catalog-browser-close"
            onClick={onClose}
            aria-label="Close catalog browser"
          >
            <Icon icon={xIcon} size="sm" color="currentColor" />
          </button>
        </header>

        <label className="fishbones-catalog-browser-search-wrap">
          <Icon
            icon={searchIcon}
            size="sm"
            color="currentColor"
            className="fishbones-catalog-browser-search-icon"
          />
          <input
            type="search"
            className="fishbones-catalog-browser-search"
            placeholder="Search by title, author, or language…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </label>

        <div className="fishbones-catalog-browser-body">
          {!loaded ? (
            <div className="fishbones-catalog-browser-empty">
              Loading catalog…
            </div>
          ) : filtered.length === 0 ? (
            <div className="fishbones-catalog-browser-empty">
              {query
                ? `No catalog entries match "${query}".`
                : "Catalog is empty. Check your network connection."}
            </div>
          ) : (
            <>
              {available.length > 0 && (
                <CatalogSection
                  label={`Available (${available.length})`}
                  entries={available}
                  installing={installing}
                  installed={false}
                  onInstall={handleInstall}
                />
              )}
              {alreadyInstalled.length > 0 && (
                <CatalogSection
                  label={`Already in your library (${alreadyInstalled.length})`}
                  entries={alreadyInstalled}
                  installing={installing}
                  installed={true}
                  onInstall={handleInstall}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  label: string;
  entries: CatalogEntry[];
  installing: ReadonlySet<string>;
  installed: boolean;
  onInstall: (entry: CatalogEntry) => Promise<void> | void;
}

function CatalogSection({
  label,
  entries,
  installing,
  installed,
  onInstall,
}: SectionProps) {
  return (
    <section className="fishbones-catalog-browser-section">
      <h3 className="fishbones-catalog-browser-section-label">{label}</h3>
      <ul className="fishbones-catalog-browser-list">
        {entries.map((entry) => {
          const isInstalling = installing.has(entry.id);
          const cover = coverHref(entry);
          return (
            <li key={entry.id} className="fishbones-catalog-browser-row">
              <div
                className="fishbones-catalog-browser-cover"
                aria-hidden
                style={cover ? { backgroundImage: `url(${cover})` } : undefined}
              />
              <div className="fishbones-catalog-browser-meta">
                <div className="fishbones-catalog-browser-title-row">
                  {entry.title}
                </div>
                {entry.author && (
                  <div className="fishbones-catalog-browser-author">
                    {entry.author}
                  </div>
                )}
                <div className="fishbones-catalog-browser-tags">
                  <span className="fishbones-catalog-browser-tag">
                    {entry.language}
                  </span>
                  {entry.lessonCount != null && (
                    <span className="fishbones-catalog-browser-tag fishbones-catalog-browser-tag--muted">
                      {entry.lessonCount} lessons
                    </span>
                  )}
                  {entry.packType === "challenges" && (
                    <span className="fishbones-catalog-browser-tag fishbones-catalog-browser-tag--muted">
                      challenges
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className={`fishbones-catalog-browser-action ${
                  installed
                    ? "fishbones-catalog-browser-action--installed"
                    : ""
                }`}
                onClick={() => void onInstall(entry)}
                disabled={installed || isInstalling}
              >
                <Icon
                  icon={installed ? checkIcon : downloadIcon}
                  size="xs"
                  color="currentColor"
                />
                {installed
                  ? "Installed"
                  : isInstalling
                    ? "Installing…"
                    : "Install"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
