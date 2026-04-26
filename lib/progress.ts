const STORAGE_KEY = "english-mvp-completed-lessons";
export const PROGRESS_CHANGED_EVENT = "english-mvp-progress-changed";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function saveCompletedLessons(slugs: string[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(slugs))));
  window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT));
}

export function getCompletedLessons(): string[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function isLessonCompleted(slug: string): boolean {
  return getCompletedLessons().includes(slug);
}

export function markLessonCompleted(slug: string): void {
  saveCompletedLessons([...getCompletedLessons(), slug]);
}

export function unmarkLessonCompleted(slug: string): void {
  saveCompletedLessons(getCompletedLessons().filter((item) => item !== slug));
}

export function toggleLessonCompleted(slug: string): void {
  if (isLessonCompleted(slug)) {
    unmarkLessonCompleted(slug);
    return;
  }

  markLessonCompleted(slug);
}
