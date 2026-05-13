import { useCallback, useEffect, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { check as checkIcon } from "@base/primitives/icon/icons/check";
import { rocket } from "@base/primitives/icon/icons/rocket";
import { arrowDownToLine } from "@base/primitives/icon/icons/arrow-down-to-line";
import { info } from "@base/primitives/icon/icons/info";
import "@base/primitives/icon/icon.css";
import SettingsCard, { SettingsPage } from "./SettingsCard";
import SettingsRow from "./SettingsRow";
import { useT } from "../../../i18n/i18n";

/// "General" section of the Settings dialog. Hosts the Updates
/// sub-panel: current version, manual check-for-updates, and the
/// release-notes body when one is available. Mirrors the lifecycle
/// of `UpdateBanner` but lives in a discoverable place — the
/// floating banner is great for "you have an update" pings, less
/// great for "what version am I running" answers.
///
/// We import the updater plugin lazily so the web build (where the
/// plugin import would fail) never reaches this code path, and so
/// the dialog opens immediately even when the updater is slow.

type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "uptodate"; checkedAt: number }
  | { kind: "available"; version: string; notes: string }
  | { kind: "downloading"; progress: number; total: number | null }
  | { kind: "ready" }
  | { kind: "error"; message: string };

function isTauri(): boolean {
  return (
    typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__ !== "undefined"
  );
}

export default function GeneralPane() {
  const t = useT();
  const [version, setVersion] = useState<string | null>(null);
  const [state, setState] = useState<UpdateState>({ kind: "idle" });

  // Read the current app version off the Tauri runtime. `getVersion`
  // returns whatever's in `tauri.conf.json` so this is the source of
  // truth — `package.json`'s version drifts (it stays at 0.1.0
  // because it's not the published artifact). Web builds skip this.
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    void (async () => {
      try {
        const { getVersion } = await import("@tauri-apps/api/app");
        const v = await getVersion();
        if (!cancelled) setVersion(v);
      } catch {
        /* keep null — UI handles the "unknown" case */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!isTauri()) {
      setState({ kind: "error", message: t("settings.updatesDesktopOnly") });
      return;
    }
    setState({ kind: "checking" });
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setState({ kind: "uptodate", checkedAt: Date.now() });
        return;
      }
      setState({
        kind: "available",
        version: update.version,
        notes: update.body ?? "",
      });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, [t]);

  const downloadAndInstall = useCallback(async () => {
    if (!isTauri()) return;
    setState({ kind: "downloading", progress: 0, total: null });
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setState({ kind: "uptodate", checkedAt: Date.now() });
        return;
      }
      let downloaded = 0;
      let total: number | null = null;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? null;
            setState({ kind: "downloading", progress: 0, total });
            break;
          case "Progress":
            downloaded += event.data.chunkLength ?? 0;
            setState({ kind: "downloading", progress: downloaded, total });
            break;
          case "Finished":
            setState({ kind: "ready" });
            break;
        }
      });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  return (
    <SettingsPage
      title={t("settings.general")}
      description={t("settings.generalDescription")}
    >
      <SettingsCard title={t("settings.updatesCard")}>
        <SettingsRow
          icon={info}
          label={t("settings.appVersionLabel")}
          sub={
            version ? (
              <>
                {t("settings.appVersionRunning")} <strong>v{version}</strong>
                {state.kind === "uptodate" && ` · ${t("settings.appVersionUpToDate")}`}
              </>
            ) : (
              <>{t("settings.appVersionReading")}</>
            )
          }
          control={
            <button
              className="libre-settings-secondary"
              onClick={checkForUpdates}
              disabled={
                state.kind === "checking" || state.kind === "downloading"
              }
            >
              {state.kind === "checking" ? t("settings.checkingUpdates") : t("settings.checkForUpdates")}
            </button>
          }
        />
      </SettingsCard>

      {state.kind === "available" && (
        <div className="libre-settings-update">
          <div className="libre-settings-update-head">
            <Icon icon={rocket} size="sm" color="currentColor" />
            <div>
              <div className="libre-settings-update-title">
                {t("settings.updateAvailableTitle", { version: state.version })}
              </div>
              <div className="libre-settings-update-sub">
                {t("settings.updateAvailableSub")}
              </div>
            </div>
            <button
              className="libre-settings-primary"
              onClick={downloadAndInstall}
            >
              <Icon icon={arrowDownToLine} size="xs" color="currentColor" />
              {t("settings.downloadInstall")}
            </button>
          </div>
          {state.notes.trim().length > 0 && (
            <div className="libre-settings-update-notes">
              <div className="libre-settings-update-notes-label">
                {t("settings.whatsNew")}
              </div>
              <pre className="libre-settings-update-notes-body">
                {state.notes}
              </pre>
            </div>
          )}
        </div>
      )}

      {state.kind === "downloading" && (
        <div className="libre-settings-update">
          <div className="libre-settings-update-head">
            <Icon icon={arrowDownToLine} size="sm" color="currentColor" />
            <div>
              <div className="libre-settings-update-title">
                {t("settings.downloadingUpdate")}
              </div>
              <div className="libre-settings-update-sub">
                {state.total
                  ? t("settings.downloadedProgress", {
                      progress: (state.progress / 1024 / 1024).toFixed(1),
                      total: (state.total / 1024 / 1024).toFixed(1),
                    })
                  : t("settings.downloadedNoTotal", {
                      progress: (state.progress / 1024 / 1024).toFixed(1),
                    })}
              </div>
            </div>
          </div>
        </div>
      )}

      {state.kind === "ready" && (
        <div className="libre-settings-update">
          <div className="libre-settings-update-head">
            <Icon icon={checkIcon} size="sm" color="currentColor" />
            <div>
              <div className="libre-settings-update-title">
                {t("settings.updateInstalledTitle")}
              </div>
              <div className="libre-settings-update-sub">
                {t("settings.updateRestartHint")}
              </div>
            </div>
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="libre-settings-error">
          {t("settings.updateError", { message: state.message })}
        </div>
      )}
    </SettingsPage>
  );
}
