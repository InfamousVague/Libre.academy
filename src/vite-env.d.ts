/// <reference types="vite/client" />

/// Build-target env var injected via vite.config.ts `define`. Read by
/// `src/lib/platform.ts` to expose `isWeb` / `isDesktop` everywhere.
/// Values: "desktop" (Tauri shell, default) | "web" (mattssoftware.com/play).
interface ImportMetaEnv {
  readonly FISHBONES_TARGET?: "desktop" | "web";
  /// Cloud-relay base URL. Hosted dev override that bypasses the
  /// production VPS (`api.mattssoftware.com`). Read by
  /// `useFishbonesCloud`'s `envRelayUrl()`. Optional — if unset,
  /// the hook falls back to the production default.
  readonly VITE_FISHBONES_RELAY_URL?: string;
  /// CDN base for pre-generated lesson narration MP3s. Read by
  /// `useLessonAudio`. Optional — defaults to `https://libre.academy/audio`.
  readonly VITE_FB_TTS_CDN_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
