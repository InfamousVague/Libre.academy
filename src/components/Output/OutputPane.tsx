import { useEffect, useRef, useState } from "react";
import type { LogLine, RunResult } from "../../runtimes";
import "./OutputPane.css";

interface Props {
  result: RunResult | null;
  running: boolean;
}

/// Bottom-right pane. Renders structured runtime output: captured console
/// logs, errors, and — when the lesson has hidden tests — per-test pass/fail
/// lines. For web-runtime lessons, `result.html` triggers an iframe preview
/// above the logs so the learner can see their rendered page.
export default function OutputPane({ result, running }: Props) {
  const passedCount = result?.tests?.filter((t) => t.passed).length ?? 0;
  const totalTests = result?.tests?.length ?? 0;
  const allPassed = totalTests > 0 && passedCount === totalTests && !result?.error;

  // Console logs emitted by the iframe via postMessage for web-runtime lessons.
  // Kept in component state rather than on the RunResult so they stream in
  // as the iframe page executes — RunResult is snapshotted at runFiles
  // return time, before the iframe has even mounted.
  const [liveLogs, setLiveLogs] = useState<LogLine[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Reset live logs whenever a fresh run starts. Without this, stale logs
  // from the previous run would hang around until the iframe produces its
  // own "hello" line.
  useEffect(() => {
    setLiveLogs([]);
  }, [result?.html]);

  // Listen for console messages forwarded from the iframe's window.
  useEffect(() => {
    if (!result?.html) return;
    const handler = (ev: MessageEvent) => {
      const data = ev.data as { __kata?: boolean; level?: string; text?: string } | undefined;
      if (!data || !data.__kata) return;
      const level = (["log", "info", "warn", "error"].includes(data.level ?? "")
        ? data.level
        : "log") as LogLine["level"];
      setLiveLogs((prev) => [...prev, { level, text: data.text ?? "" }]);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [result?.html]);

  const logsToRender: LogLine[] = result?.html
    ? [...(result?.logs ?? []), ...liveLogs]
    : (result?.logs ?? []);

  return (
    <div className="fishbones-output">
      <div className="fishbones-output-header">
        <span className="fishbones-output-label">
          {result?.html ? "preview" : "console"}
        </span>
        <div className="fishbones-output-header-right">
          {totalTests > 0 && !running && (
            <span
              className={`fishbones-output-tests-summary ${
                allPassed ? "fishbones-output-tests-summary--pass" : "fishbones-output-tests-summary--fail"
              }`}
            >
              {passedCount}/{totalTests} passed
            </span>
          )}
          {result && !running && (
            <span className="fishbones-output-duration">{result.durationMs.toFixed(0)}ms</span>
          )}
          {running && (
            <span className="fishbones-output-running-pill">
              <span className="fishbones-output-running-pill-dot" aria-hidden />
              running…
            </span>
          )}
        </div>
      </div>

      {/* Web-runtime iframe preview. The srcDoc gets a fresh key on every
          run (by using the html as the key) so React fully remounts the
          iframe and discards any prior page state — otherwise a lingering
          interval or animation frame from the previous run would keep
          firing. Sandboxed with `allow-scripts` only so the page can't
          reach into the Tauri host. */}
      {result?.html && (
        <div className="fishbones-output-iframe-wrap">
          <iframe
            ref={iframeRef}
            key={result.html}
            className="fishbones-output-iframe"
            title="Rendered output"
            sandbox="allow-scripts"
            srcDoc={result.html}
          />
        </div>
      )}

      <div className="fishbones-output-body">
        {!result && !running && (
          <div className="fishbones-output-empty">run your code to see output here</div>
        )}

        {running && (
          // Big centered spinner with the Fishbones fish-bone inside. The ring
          // spins via CSS `@keyframes fishbones-output-spin`; the fish itself is
          // theme-tinted (white on dark themes, black on light) via a
          // background-color + mask trick so we can keep one asset.
          <div className="fishbones-output-running" aria-live="polite">
            <div className="fishbones-output-running-stack" aria-hidden>
              <div className="fishbones-output-running-ring" />
              <div className="fishbones-output-running-logo" />
            </div>
            <div className="fishbones-output-running-label">running…</div>
          </div>
        )}

        {logsToRender.map((line, i) => (
          <div key={`log-${i}`} className={`fishbones-output-line fishbones-output-line--${line.level}`}>
            {line.text}
          </div>
        ))}

        {result?.tests && result.tests.length > 0 && (
          <div className="fishbones-output-tests">
            {result.tests.map((t, i) => (
              <div
                key={`t-${i}`}
                className={`fishbones-output-test fishbones-output-test--${t.passed ? "pass" : "fail"}`}
              >
                <span className="fishbones-output-test-glyph">{t.passed ? "✓" : "✗"}</span>
                <span className="fishbones-output-test-name">{t.name}</span>
                {!t.passed && t.error && (
                  <pre className="fishbones-output-test-error">{t.error}</pre>
                )}
              </div>
            ))}
          </div>
        )}

        {result?.error && (
          <div className="fishbones-output-error">
            <div className="fishbones-output-error-title">error</div>
            <pre>{result.error}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
