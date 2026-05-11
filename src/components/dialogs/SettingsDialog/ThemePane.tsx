import { THEMES, type ThemeName } from "../../../theme/themes";
import LanguageDropdown from "../../LanguageDropdown/LanguageDropdown";

interface ThemePaneProps {
  theme: ThemeName;
  onThemeChange: (next: ThemeName) => void;
}

export default function ThemePane({ theme, onThemeChange }: ThemePaneProps) {
  return (
    <section>
      <h3 className="libre-settings-section">Theme</h3>
      <p className="libre-settings-blurb">
        Applied immediately. Preference is stored locally; it syncs with
        your machine's light/dark setting only for the default Libre themes.
      </p>
      <div className="libre-settings-model-group libre-settings-model-group--scroll">
        {THEMES.map((t) => (
          <label
            key={t.id}
            className={`libre-settings-model ${theme === t.id ? "is-active" : ""}`}
          >
            <input
              type="radio"
              name="libre-theme"
              value={t.id}
              checked={theme === t.id}
              onChange={() => onThemeChange(t.id)}
            />
            <div>
              <div className="libre-settings-model-label">{t.label}</div>
              <div className="libre-settings-model-hint">{t.description}</div>
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
        className="libre-settings-section"
        style={{ marginTop: "24px" }}
      >
        Language
      </h3>
      <p className="libre-settings-blurb">
        Switches the language of Libre-authored courses (the in-house
        tutorials and challenge packs). Third-party books bundled in the
        library stay in their original language. The choice persists
        locally and syncs to your other devices when you sign in.
      </p>
      <LanguageDropdown variant="field" />
    </section>
  );
}
