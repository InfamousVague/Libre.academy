import { useState } from "react";
import type { Course } from "../../data/types";
import "./Sidebar.css";

interface Props {
  courses: Course[];
  activeCourseId?: string;
  activeLessonId?: string;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

/// Floating left rail. Mirrors Stash's `.stash__sidebar` pattern — a card that
/// floats inside 10px of padding, rounded corners, 1px border, and sits on
/// `--color-bg-secondary`.
///
/// Stash uses a flat nav list; Kata has nested course ▸ chapter ▸ lesson, so we
/// reuse the same nav-item chrome but allow each course to collapse/expand.
export default function Sidebar({
  courses,
  activeCourseId,
  activeLessonId,
  onSelectLesson,
}: Props) {
  return (
    <aside className="kata__sidebar">
      <div className="kata__sidebar-brand">
        <span className="kata__brand-text">kata</span>
      </div>

      <nav className="kata__nav">
        {courses.map((course) => (
          <CourseGroup
            key={course.id}
            course={course}
            isActiveCourse={course.id === activeCourseId}
            activeLessonId={activeLessonId}
            onSelectLesson={onSelectLesson}
          />
        ))}

        <button
          className="kata__nav-item kata__nav-item--browse"
          onClick={() => console.info("TODO: open library browse view")}
        >
          <span className="kata__nav-icon">+</span>
          <span>browse courses</span>
        </button>
      </nav>

      <div className="kata__sidebar-footer">
        <button className="kata__nav-item">
          <span className="kata__nav-icon">⚙</span>
          <span>settings</span>
        </button>
      </div>
    </aside>
  );
}

function CourseGroup({
  course,
  isActiveCourse,
  activeLessonId,
  onSelectLesson,
}: {
  course: Course;
  isActiveCourse: boolean;
  activeLessonId?: string;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}) {
  const [expanded, setExpanded] = useState(isActiveCourse);

  return (
    <div className="kata__course">
      <button
        className={`kata__nav-item kata__course-title ${isActiveCourse ? "kata__nav-item--active" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="kata__course-caret">{expanded ? "▾" : "▸"}</span>
        <span>{course.title}</span>
      </button>

      {expanded &&
        course.chapters.map((chapter) => (
          <div key={chapter.id} className="kata__chapter">
            <div className="kata__chapter-title">{chapter.title}</div>
            {chapter.lessons.map((lesson) => (
              <button
                key={lesson.id}
                className={`kata__nav-item kata__lesson-item ${
                  lesson.id === activeLessonId && isActiveCourse ? "kata__nav-item--active" : ""
                }`}
                onClick={() => onSelectLesson(course.id, lesson.id)}
              >
                <span className="kata__lesson-kind">{lessonGlyph(lesson.kind)}</span>
                <span className="kata__lesson-name">{lesson.title}</span>
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}

function lessonGlyph(kind: "reading" | "exercise" | "mixed"): string {
  switch (kind) {
    case "reading":
      return "◌";
    case "exercise":
      return "●";
    case "mixed":
      return "◐";
  }
}
