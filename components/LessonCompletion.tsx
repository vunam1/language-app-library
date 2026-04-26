"use client";

import { useEffect, useState } from "react";
import {
  isLessonCompleted,
  toggleLessonCompleted,
  PROGRESS_CHANGED_EVENT,
} from "@/lib/progress";

type LessonCompletionProps = {
  slug: string;
  title: string;
};

export default function LessonCompletion({ slug, title }: LessonCompletionProps) {
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncCompleted = () => {
      setCompleted(isLessonCompleted(slug));
    };

    setMounted(true);
    syncCompleted();
    window.addEventListener(PROGRESS_CHANGED_EVENT, syncCompleted);
    window.addEventListener("storage", syncCompleted);

    return () => {
      window.removeEventListener(PROGRESS_CHANGED_EVENT, syncCompleted);
      window.removeEventListener("storage", syncCompleted);
    };
  }, [slug]);

  const statusText = completed ? "Đã hoàn thành" : "Chưa hoàn thành";

  return (
    <section className="completionPanel" aria-label={`Progress for ${title}`}>
      <div>
        <p className="lessonMeta">Tiến trình lesson</p>
        <p className="completionStatus">{mounted ? statusText : "Đang tải..."}</p>
      </div>
      <button
        className="completionButton"
        onClick={() => {
          toggleLessonCompleted(slug);
          setCompleted(isLessonCompleted(slug));
        }}
        type="button"
      >
        {completed ? "Mark as not completed" : "Mark as completed"}
      </button>
    </section>
  );
}
