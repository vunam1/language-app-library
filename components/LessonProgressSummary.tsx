"use client";

import { useEffect, useMemo, useState } from "react";
import { getCompletedLessons, PROGRESS_CHANGED_EVENT } from "@/lib/progress";

type LessonProgressSummaryProps = {
  totalLessons: number;
  lessonSlugs: string[];
};

export default function LessonProgressSummary({
  totalLessons,
  lessonSlugs,
}: LessonProgressSummaryProps) {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    const syncCompleted = () => {
      setCompletedLessons(getCompletedLessons());
    };

    syncCompleted();
    window.addEventListener(PROGRESS_CHANGED_EVENT, syncCompleted);
    window.addEventListener("storage", syncCompleted);

    return () => {
      window.removeEventListener(PROGRESS_CHANGED_EVENT, syncCompleted);
      window.removeEventListener("storage", syncCompleted);
    };
  }, []);

  const completedCount = useMemo(() => {
    const completedSet = new Set(completedLessons);
    return lessonSlugs.filter((slug) => completedSet.has(slug)).length;
  }, [completedLessons, lessonSlugs]);
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <section className="progressPanel" aria-label="Lesson progress summary">
      <div>
        <p className="lessonMeta">Local progress</p>
        <p className="progressTitle">
          Đã hoàn thành {completedCount}/{totalLessons} bài
        </p>
      </div>
      <div className="progressShell" aria-hidden="true">
        <div className="progressFill" style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  );
}
