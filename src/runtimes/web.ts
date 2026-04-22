import type { WorkbenchFile } from "../data/types";
import type { RunResult, LogLine, TestResult } from "./types";

/// Web runtime — assembles an HTML document from the user's files and hands
/// the raw HTML string back to OutputPane, which drops it into a sandboxed
/// iframe. Console output inside the iframe is captured via postMessage and
/// streamed back into the normal logs list; visual output (the rendered
/// page) is displayed in an iframe preview panel.
///
/// Assembly rules:
///   - If there's an `index.html` (or any .html file), it's the spine.
///     All .css files are inlined into <head><style> blocks. All .js files
///     are inlined into <body> <script> blocks at the end, in file order.
///   - If the HTML already has matching `<link rel="stylesheet">` or
///     `<script src="...">` tags we don't dedupe — the author is on the
///     hook for not double-inlining. In practice authors will write naked
///     html without external tags and let us wire everything together.
///   - No tests in Phase 2. Future: accept a separate test file that runs
///     after the page loads and asserts against `document` state.

const CONSOLE_SHIM = `
<script>
(function(){
  // Capture console inside the iframe and forward to the parent so the
  // OutputPane can render the logs alongside the rendered DOM. We patch
  // all four levels; unknown levels get "log".
  const parentWin = window.parent;
  const post = (level, args) => {
    try {
      parentWin.postMessage({
        __kata: true,
        level,
        text: args.map(a => {
          if (a == null) return String(a);
          if (typeof a === "object") {
            try { return JSON.stringify(a); } catch { return String(a); }
          }
          return String(a);
        }).join(" "),
      }, "*");
    } catch(e) { /* parent might be detached during reload — ignore */ }
  };
  for (const level of ["log","info","warn","error"]) {
    const orig = console[level];
    console[level] = function() {
      post(level, Array.from(arguments));
      orig.apply(console, arguments);
    };
  }
  // Surface uncaught errors too so a typo in the user JS doesn't vanish silently.
  window.addEventListener("error", (e) => {
    post("error", [e.message + " (" + (e.filename||"?") + ":" + (e.lineno||"?") + ")"]);
  });
  window.addEventListener("unhandledrejection", (e) => {
    post("error", ["Unhandled promise rejection: " + (e.reason && e.reason.message || String(e.reason))]);
  });
})();
</script>
`.trim();

export async function runWeb(
  files: WorkbenchFile[],
  testCode?: string,
): Promise<RunResult> {
  const started = Date.now();

  // Pick the spine: first .html file, or a synthesized empty doc if there
  // isn't one. Authors who only supply JS + CSS still get a visible canvas.
  const htmlFile = files.find((f) => f.language === "html");
  const cssFiles = files.filter((f) => f.language === "css");
  const jsFiles = files.filter((f) => f.language === "javascript");

  const styleBlock = cssFiles
    .map((f) => `<style data-fishbones-src="${escapeAttr(f.name)}">\n${f.content}\n</style>`)
    .join("\n");

  const scriptBlock = jsFiles
    .map((f) => `<script data-fishbones-src="${escapeAttr(f.name)}">\n${f.content}\n</script>`)
    .join("\n");

  let doc: string;
  if (htmlFile) {
    // Inline the style/script blocks into the author's document. If a <head>
    // exists we drop styles in; otherwise prepend. Scripts go before </body>
    // or at the very end.
    let body = htmlFile.content;
    // Inject the console shim FIRST so all author scripts run with the
    // patched console in place.
    if (/<\/head>/i.test(body)) {
      body = body.replace(/<\/head>/i, `${CONSOLE_SHIM}\n${styleBlock}\n</head>`);
    } else if (/<head[^>]*>/i.test(body)) {
      body = body.replace(/<head([^>]*)>/i, `<head$1>\n${CONSOLE_SHIM}\n${styleBlock}`);
    } else {
      body = CONSOLE_SHIM + "\n" + styleBlock + "\n" + body;
    }
    if (/<\/body>/i.test(body)) {
      body = body.replace(/<\/body>/i, `${scriptBlock}\n</body>`);
    } else {
      body = body + "\n" + scriptBlock;
    }
    doc = body;
  } else {
    // No HTML — synthesize one. Handy when an exercise only wants a blank
    // canvas for JS DOM manipulation or a CSS-only demo.
    doc = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
${CONSOLE_SHIM}
${styleBlock}
</head>
<body>
${scriptBlock}
</body>
</html>`;
  }

  // When the lesson has tests, we run them in a hidden iframe alongside the
  // visible preview. Tests get a Jest-style harness in the iframe context so
  // they can assert against `document`, the author's exposed globals, etc.
  // The visible iframe (returned as `html`) remains test-free so the user
  // sees exactly what they authored.
  const testResults = testCode
    ? await runTestsInHiddenIframe(doc, testCode)
    : null;

  const logs: LogLine[] = testResults?.logs ?? [];
  return {
    logs,
    tests: testResults?.tests,
    error: testResults?.error,
    html: doc,
    durationMs: Date.now() - started,
  };
}

/// Jest-compatible harness injected into the test iframe. Captures test
/// results into `__kata_test_results` and posts them via postMessage once
/// the test script has executed.
const TEST_HARNESS = `
<script>
(function(){
  window.__kata_test_results = [];
  window.test = function(name, fn) {
    try {
      var r = fn();
      if (r && typeof r.then === "function") {
        // Async tests: punt for V1 — users who need async can await inline.
        window.__kata_test_results.push({
          name: name,
          passed: false,
          error: "Async test bodies are not supported in the web runtime yet. await your promise inside the test.",
        });
        return;
      }
      window.__kata_test_results.push({ name: name, passed: true });
    } catch (e) {
      var stack = (e && e.stack) ? e.stack.split("\\n").slice(0, 4).join("\\n") : "";
      window.__kata_test_results.push({
        name: name,
        passed: false,
        error: (e && e.message ? e.message : String(e)) + (stack ? "\\n" + stack : ""),
      });
    }
  };
  window.expect = function(actual) {
    function fail(msg) { throw new Error(msg); }
    return {
      toBe: function(expected) {
        if (!Object.is(actual, expected)) fail("expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
      },
      toEqual: function(expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) fail("expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
      },
      toBeTruthy: function() { if (!actual) fail("expected truthy, got " + JSON.stringify(actual)); },
      toBeFalsy: function() { if (actual) fail("expected falsy, got " + JSON.stringify(actual)); },
      toBeGreaterThan: function(n) { if (!(actual > n)) fail("expected > " + n + ", got " + actual); },
      toBeLessThan: function(n) { if (!(actual < n)) fail("expected < " + n + ", got " + actual); },
      toContain: function(item) {
        if (typeof actual === "string") {
          if (actual.indexOf(item) < 0) fail("expected string to contain " + JSON.stringify(item));
        } else if (Array.isArray(actual)) {
          if (actual.indexOf(item) < 0) fail("expected array to contain " + JSON.stringify(item));
        } else {
          fail(".toContain works on strings / arrays");
        }
      },
      toBeCloseTo: function(v, digits) {
        var prec = Math.pow(10, -(digits || 2)) / 2;
        if (Math.abs(actual - v) > prec) fail("expected ≈ " + v + ", got " + actual);
      },
      toThrow: function() {
        try { actual(); } catch (e) { return; }
        fail("expected function to throw");
      },
      // DOM-specific helpers so tests stay readable
      toExist: function() { if (!actual) fail("expected element to exist"); },
      toHaveTextContent: function(expected) {
        var got = actual && actual.textContent != null ? actual.textContent : "";
        if (String(got).trim() !== String(expected).trim()) {
          fail("expected textContent " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
        }
      },
    };
  };
})();
</script>
`.trim();

/// Run `testCode` in a hidden iframe that first renders the user's `doc`,
/// then exposes the harness and executes the test script. Returns collected
/// test results + any console output. Resolves with a 10s timeout so broken
/// test code can't hang the UI forever.
function runTestsInHiddenIframe(
  doc: string,
  testCode: string,
): Promise<{ logs: LogLine[]; tests: TestResult[]; error?: string }> {
  return new Promise((resolve) => {
    // Weave the harness + test script into the document. Harness goes in
    // <head> so matchers are defined before any in-body script runs; the
    // test script goes AFTER the author scripts so it sees the DOM after
    // author JS has wired up.
    let wovenDoc = doc;
    if (/<\/head>/i.test(wovenDoc)) {
      wovenDoc = wovenDoc.replace(/<\/head>/i, `${TEST_HARNESS}\n</head>`);
    } else {
      wovenDoc = TEST_HARNESS + "\n" + wovenDoc;
    }
    const testScriptTag = `
<script data-fishbones-src="tests.js">
try {
${testCode}
} catch (e) {
  window.__kata_test_results.push({
    name: "<test file>",
    passed: false,
    error: (e && e.message) ? e.message : String(e),
  });
}
// Defer the post so any microtasks inside tests settle first.
setTimeout(function(){
  window.parent.postMessage({ __kata_tests: true, results: window.__kata_test_results || [] }, "*");
}, 0);
</script>
`;
    if (/<\/body>/i.test(wovenDoc)) {
      wovenDoc = wovenDoc.replace(/<\/body>/i, `${testScriptTag}\n</body>`);
    } else {
      wovenDoc = wovenDoc + "\n" + testScriptTag;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-99999px";
    iframe.style.top = "0";
    iframe.style.width = "1024px";
    iframe.style.height = "768px";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.srcdoc = wovenDoc;

    const logs: LogLine[] = [];
    const onMessage = (ev: MessageEvent) => {
      const d = ev.data as {
        __kata?: boolean;
        __kata_tests?: boolean;
        level?: string;
        text?: string;
        results?: TestResult[];
      };
      if (!d) return;
      if (d.__kata) {
        const level = (["log", "info", "warn", "error"].includes(d.level ?? "")
          ? d.level
          : "log") as LogLine["level"];
        logs.push({ level, text: d.text ?? "" });
        return;
      }
      if (d.__kata_tests) {
        cleanup();
        resolve({ logs, tests: d.results ?? [] });
      }
    };

    const timer = window.setTimeout(() => {
      cleanup();
      resolve({
        logs,
        tests: [],
        error:
          "Test iframe timed out after 10s. Check for infinite loops or a syntax error in your tests.",
      });
    }, 10_000);

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
  });
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/// Heuristic: does this file set want the web runtime instead of the plain
/// JS one? Any HTML or CSS file in the set flips it into web mode.
export function isWebLesson(files: WorkbenchFile[]): boolean {
  return files.some((f) => f.language === "html" || f.language === "css");
}
