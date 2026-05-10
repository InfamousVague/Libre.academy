import { THEMES, type ThemeName } from "../../../theme/themes";
import LanguageDropdown from "../../LanguageDropdown/LanguageDropdown";

interface ThemePaneProps {
  theme: ThemeName;
  onThemeChange: (next: ThemeName) => void;
}

export default function ThemePane({ theme, onThemeChange }: ThemePaneProps) {
  return (
    <section>
      <h3 className="fishbones-settings-section">Theme</h3>
      <p className="fishbones-settings-blurb">
        Applied immediately. Preference is stored locally; it syncs with
        your machine's light/dark setting only for the default Libre themes.
      </p>
      <div className="fishbones-settings-model-group fishbones-settings-model-group--scroll">
        {THEMES.map((t) => (
          <label
            key={t.id}
            className={`fishbones-settings-model ${theme === t.id ? "is-active" : ""}`}
          >
            <input
              type="radio"
              name="fishbones-theme"
              value={t.id}
              checked={theme === t.id}
              onChange={() => onThemeChange(t.id)}
            />
            <div>
              <div className="fishbones-settings-model-label">{t.label}</div>
              <div className="fishbones-settings-model-hint">{t.description}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Language picker — separate sub-section so the user reads
          "theme, then language" as two distinct preferences rather
          than one giant block of settings. The dropdown wires
          straight through `useLocale` (localStorage + cloud sync),
          so this UI is just the chrome — the state lives in the
          shared hook. */}
      <h3
        className="fishbones-settings-section"
        style={{ marginTop: "24px" }}
      >
        Language
      </h3>
      <p className="fishbones-settings-blurb">
        Switches the language of Fishbones-authored courses (the in-house
        tutorials and challenge packs). Third-party books bundled in the
        library stay in their original language. The choice persists
        locally and syncs to your other devices when you sign in.
      </p>
      <LanguageDropdown variant="field" />
    </section>
  );
}
