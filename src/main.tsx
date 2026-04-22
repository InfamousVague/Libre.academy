import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PoppedWorkbench from "./components/Workbench/PoppedWorkbench";
import { applyTheme, loadTheme } from "./theme/themes";
import "./theme/themes.css";
import "./App.css";

// Apply the user's chosen theme (or system preference for the first-run
// default) before React mounts so we don't flash the wrong palette.
applyTheme(loadTheme());

// Two render modes out of a single bundle:
// - default: full App (sidebar + reader + workbench)
// - ?popped=1&course=…&lesson=…: standalone workbench only. Used by the
//   pop-out window opened via window.open from the main window, so learners
//   can drag the editor + console onto a second monitor.
const params = new URLSearchParams(window.location.search);
const isPopped = params.get("popped") === "1";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isPopped ? <PoppedWorkbench /> : <App />}
  </React.StrictMode>,
);
