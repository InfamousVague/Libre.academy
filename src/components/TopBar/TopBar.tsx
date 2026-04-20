import "./TopBar.css";

export interface Tab {
  id: string;
  label: string;
  language: string;
}

interface Props {
  tabs: Tab[];
  activeIndex: number;
  onActivate: (index: number) => void;
  onClose: (index: number) => void;
  onBrowse: () => void;
}

/// Custom window top bar. The window is configured with
/// `titleBarStyle: "Overlay"` so the macOS traffic lights float over this bar
/// at the top-left. The bar doubles as a drag region via
/// `data-tauri-drag-region`. Individual clickable elements (tab buttons,
/// close, browse) cancel drag by NOT setting the attribute on themselves.
export default function TopBar({
  tabs,
  activeIndex,
  onActivate,
  onClose,
  onBrowse,
}: Props) {
  return (
    <div className="kata__topbar" data-tauri-drag-region>
      {/* Reserved space for macOS traffic lights (they overlay this area). */}
      <div className="kata__topbar-window-controls" data-tauri-drag-region />

      <div className="kata__topbar-tabs" data-tauri-drag-region>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`kata__tab ${i === activeIndex ? "kata__tab--active" : ""}`}
            onClick={() => onActivate(i)}
          >
            <span className="kata__tab-lang">{langBadge(tab.language)}</span>
            <span className="kata__tab-label">{tab.label}</span>
            <span
              className="kata__tab-close"
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(i);
              }}
            >
              ×
            </span>
          </button>
        ))}
      </div>

      <div className="kata__topbar-actions">
        <button className="kata__topbar-browse" onClick={onBrowse}>
          + browse
        </button>
      </div>
    </div>
  );
}

function langBadge(language: string): string {
  switch (language) {
    case "javascript":
    case "typescript":
      return "JS";
    case "python":
      return "PY";
    case "rust":
      return "RS";
    case "swift":
      return "SW";
    default:
      return language.slice(0, 2).toUpperCase();
  }
}
