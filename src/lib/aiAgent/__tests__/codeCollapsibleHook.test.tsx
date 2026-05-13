/// DOM test for the collapsible-code post-processing in the
/// AssistantMarkdownBubble. We render the panel with a scripted
/// agent run that ends in a long code block, wait for the markdown
/// to resolve, and assert the DOM was wrapped in a <details>
/// element.

import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolDef } from "../../aiTools/types";
import type { AgentTransport, AgentTurnResponse } from "../types";

// Mock the transport so the hook's loop driver uses our scripted
// version (no Ollama, no Tauri).
const transportRef: { current: AgentTransport | null } = { current: null };
vi.mock("../transport", () => ({
  createTauriTransport: () => transportRef.current,
}));

// Mock the i18n hook (used by the panel for placeholder text).
vi.mock("../../../i18n/i18n", () => ({
  useT: () => (key: string) => key,
}));

// Mock the lesson markdown renderer with a tiny synchronous
// implementation — full markdown-it pulls in shiki + a stack of
// heavy formatters we don't need to exercise here. Our renderer
// just wraps fenced blocks in a real <pre><code class="language-X">
// so the DOM walker has something to find.
vi.mock("../../../components/Lesson/markdown", () => ({
  renderMarkdown: async (input: string) => {
    const fenceRe = /```([^\n]*)\n([\s\S]*?)```/g;
    return input.replace(fenceRe, (_full, info, body) => {
      const lang = (info as string).split(/[:\s]/)[0] || "code";
      return `<pre><code class="language-${lang}">${(body as string)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</code></pre>`;
    });
  },
}));

import AiAgentPanel from "../../../components/AiAssistant/AiAgentPanel";
import { useAiAgent } from "../../../hooks/useAiAgent";
import type { AiAgentSettings } from "../settings";

function scripted(turns: AgentTurnResponse[]): AgentTransport {
  let i = 0;
  return {
    async send() {
      const t = turns[i++];
      if (!t) throw new Error("script underrun");
      return t;
    },
  };
}

function tool(name: string, opts?: Partial<ToolDef>): ToolDef {
  return {
    name,
    description: "",
    parameters: { type: "object", properties: {} },
    auto: true,
    async handler() {
      return { ok: true };
    },
    ...opts,
  };
}

// Test harness: render the panel with the hook attached and a
// "Send" trigger that fires the agent.
function Harness({ initialPrompt }: { initialPrompt: string }) {
  const agent = useAiAgent({
    systemPrompt: "",
    tools: [tool("noop")],
  });
  return (
    <>
      <button onClick={() => void agent.send(initialPrompt)}>send</button>
      <AiAgentPanel
        open
        messages={agent.messages}
        streaming={agent.streaming}
        pending={agent.pending}
        timeline={agent.timeline}
        error={agent.error}
        usage={agent.usage}
        confidence={agent.confidence}
        clarification={agent.clarification}
        settings={agent.settings}
        onSend={(p) => void agent.send(p)}
        onClose={() => {}}
        onReset={agent.reset}
        onApprove={agent.approve}
        onDeny={agent.deny}
        onAnswerClarification={agent.answerClarification}
        onCancelClarification={agent.cancelClarification}
        onUpdateSettings={(s: AiAgentSettings) => agent.updateSettings(s)}
      />
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("AssistantMarkdownBubble: collapsible code", () => {
  it("wraps a >8-line code block in a <details> element", async () => {
    // 12-line code block — should be collapsed.
    const longCode = Array.from(
      { length: 12 },
      (_, i) => `console.log(${i});`,
    ).join("\n");
    transportRef.current = scripted([
      {
        content: `Here's a snippet:\n\n\`\`\`js\n${longCode}\n\`\`\`\n\nDone.\n<confidence>0.85</confidence>`,
      },
    ]);

    const { container } = render(<Harness initialPrompt="explain" />);
    await act(async () => {
      screen.getByText("send").click();
    });

    // Wait for the markdown render + the post-render DOM pass.
    await waitFor(() => {
      const details = container.querySelector(
        ".libre-ai-code-collapsible",
      );
      expect(details).not.toBeNull();
    });
    const details = container.querySelector(
      ".libre-ai-code-collapsible",
    ) as HTMLDetailsElement;
    // Closed by default — user clicks to expand.
    expect(details.open).toBe(false);
    // Summary includes the language hint AND a line count.
    const summary = details.querySelector(
      ".libre-ai-code-collapsible-summary",
    );
    expect(summary?.textContent).toContain("js");
    expect(summary?.textContent).toContain("12 lines");
    // The <pre> with the actual code is INSIDE the details element.
    const pre = details.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain("console.log(0)");
  });

  it("leaves short code blocks inline (no wrap)", async () => {
    // 3-line code block — should NOT be collapsed.
    const shortCode = "let a = 1;\nlet b = 2;\nconsole.log(a + b);";
    transportRef.current = scripted([
      {
        content: `Try this:\n\n\`\`\`js\n${shortCode}\n\`\`\`\n\nThat should work.\n<confidence>0.9</confidence>`,
      },
    ]);

    const { container } = render(<Harness initialPrompt="explain" />);
    await act(async () => {
      screen.getByText("send").click();
    });

    // Wait for the markdown to render.
    await waitFor(() => {
      expect(container.querySelector("pre")).not.toBeNull();
    });
    // No details wrapper should appear.
    const details = container.querySelector(".libre-ai-code-collapsible");
    expect(details).toBeNull();
    // The pre IS still there with the code.
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("let a = 1;");
  });
});
