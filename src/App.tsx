import { useState } from "react";
import { seedCourses } from "./data/seedCourses";
import { Course, Lesson, isExerciseKind } from "./data/types";
import Sidebar from "./components/Sidebar/Sidebar";
import TabBar from "./components/TabBar/TabBar";
import LessonReader from "./components/Lesson/LessonReader";
import EditorPane from "./components/Editor/EditorPane";
import OutputPane from "./components/Output/OutputPane";
import "./App.css";

interface OpenCourse {
  courseId: string;
  lessonId: string;
}

export default function App() {
  const courses = seedCourses;

  const [openTabs, setOpenTabs] = useState<OpenCourse[]>([
    { courseId: courses[0].id, lessonId: courses[0].chapters[0].lessons[0].id },
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const activeTab = openTabs[activeTabIndex];
  const activeCourse = courses.find((c) => c.id === activeTab?.courseId) ?? null;
  const activeLesson = findLesson(activeCourse, activeTab?.lessonId);

  function selectLesson(courseId: string, lessonId: string) {
    const existing = openTabs.findIndex((t) => t.courseId === courseId);
    if (existing >= 0) {
      const updated = [...openTabs];
      updated[existing] = { courseId, lessonId };
      setOpenTabs(updated);
      setActiveTabIndex(existing);
    } else {
      setOpenTabs([...openTabs, { courseId, lessonId }]);
      setActiveTabIndex(openTabs.length);
    }
  }

  function closeTab(index: number) {
    const next = openTabs.filter((_, i) => i !== index);
    setOpenTabs(next);
    if (activeTabIndex >= next.length) {
      setActiveTabIndex(Math.max(0, next.length - 1));
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  }

  return (
    <div className="kata">
      <Sidebar
        courses={courses}
        activeCourseId={activeCourse?.id}
        activeLessonId={activeLesson?.id}
        onSelectLesson={selectLesson}
      />

      <main className="kata__main">
        <TabBar
          tabs={openTabs.map((t) => {
            const c = courses.find((x) => x.id === t.courseId);
            return {
              id: t.courseId,
              label: c?.title ?? t.courseId,
              language: c?.language ?? "javascript",
            };
          })}
          activeIndex={activeTabIndex}
          onActivate={setActiveTabIndex}
          onClose={closeTab}
          onBrowse={() => {
            console.info("TODO: open library/browse view");
          }}
        />

        {activeLesson ? (
          <LessonView lesson={activeLesson} />
        ) : (
          <div className="kata__empty">
            <p>Pick a lesson from the sidebar to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const hasExercise = isExerciseKind(lesson);
  const [code, setCode] = useState(hasExercise ? lesson.starter : "");
  const [output, setOutput] = useState<string>("");

  return (
    <div className="kata__lesson">
      <LessonReader lesson={lesson} />
      {hasExercise && (
        <div className="kata__workbench">
          <EditorPane
            language={lesson.language}
            value={code}
            onChange={setCode}
            onRun={() => {
              setOutput(`[stub] would run ${lesson.language} code here`);
            }}
          />
          <OutputPane text={output} />
        </div>
      )}
    </div>
  );
}

function findLesson(course: Course | null, lessonId: string | undefined): Lesson | null {
  if (!course || !lessonId) return null;
  for (const ch of course.chapters) {
    const found = ch.lessons.find((l) => l.id === lessonId);
    if (found) return found;
  }
  return null;
}
