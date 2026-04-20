import type { Course } from "./types";

/// Courses the app falls back to when running outside Tauri (vite dev or
/// tests) and seeds into app_data_dir on first launch if no courses exist
/// yet.
///
/// Intentionally empty for now — we want fresh installs to be blank so
/// users arrive at the import flow. To ship bundled starter content later,
/// add entries here with `import jsonFile from '../../courses/<id>/course.json'`.
export const seedCourses: Course[] = [];
