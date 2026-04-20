import "./TabBar.css";

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

/// Browser-style row of course tabs + a persistent "+ browse" button.
export default function TabBar({ tabs, activeIndex, onActivate, onClose, onBrowse }: Props) {
  return (
    <div className="kata-tabbar">
      <div className="kata-tabbar-scroll">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`kata-tab ${i === activeIndex ? "active" : ""}`}
            onClick={() => onActivate(i)}
          >
            <span className="kata-tab-lang">{langBadge(tab.language)}</span>
            <span className="kata-tab-label">{tab.label}</span>
            <span
              className="kata-tab-close"
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
      <button className="kata-tab-browse" onClick={onBrowse}>
        + browse
      </button>
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
