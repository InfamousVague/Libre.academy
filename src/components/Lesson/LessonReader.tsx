import { useEffect, useState } from "react";
import type { Lesson } from "../../data/types";
import { renderMarkdown } from "./markdown";
import "./LessonReader.css";

interface Props {
  lesson: Lesson;
}

/// The top half of a lesson pane: prose rendered from the lesson's markdown
/// body, with fenced code blocks highlighted by Shiki.
export default function LessonReader({ lesson }: Props) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    renderMarkdown(lesson.body).then((rendered) => {
      if (!cancelled) setHtml(rendered);
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.body]);

  return (
    <section className="kata-reader">
      <div className="kata-reader-inner">
        <div
          className="kata-reader-body"
          // Markdown → HTML is rendered by our pipeline, not user-authored HTML.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
