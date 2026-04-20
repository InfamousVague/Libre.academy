import "./OutputPane.css";

interface Props {
  text: string;
}

/// Right half of the workbench. Later this'll render structured test results
/// (pass/fail list) instead of raw text.
export default function OutputPane({ text }: Props) {
  return (
    <div className="kata-output">
      <div className="kata-output-header">
        <span className="kata-output-label">output</span>
      </div>
      <pre className="kata-output-body">{text || "\n  run your code to see output here\n"}</pre>
    </div>
  );
}
