"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LessonMonthGroup } from "@/lib/lessons";
import { getCompletedLessons, PROGRESS_CHANGED_EVENT } from "@/lib/progress";
import LessonProgressSummary from "@/components/LessonProgressSummary";

type LessonListClientProps = {
  monthGroups: LessonMonthGroup[];
};

export default function LessonListClient({ monthGroups }: LessonListClientProps) {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const lessonSlugs = useMemo(() => {
    return monthGroups.flatMap((monthGroup) =>
      monthGroup.batches.flatMap((batchGroup) =>
        batchGroup.lessons.map((lesson) => lesson.slug),
      ),
    );
  }, [monthGroups]);
  const completedSet = useMemo(
    () => new Set(completedLessons),
    [completedLessons],
  );

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

  return (
    <>
      <LessonProgressSummary
        lessonSlugs={lessonSlugs}
        totalLessons={lessonSlugs.length}
      />

      <div className="monthList">
        {monthGroups.map((monthGroup) => (
          <section className="monthGroup" key={monthGroup.month}>
            <h2>{monthGroup.monthLabel}</h2>

            {monthGroup.batches.map((batchGroup) => (
              <section className="batchGroup" key={batchGroup.batch}>
                <h3 className="batchTitle">{batchGroup.batchLabel}</h3>
                <div className="lessonList">
                  {batchGroup.lessons.map((lesson) => {
                    const completed = completedSet.has(lesson.slug);

                    return (
                      <Link
                        className="lessonItem"
                        href={lesson.href}
                        key={lesson.slug}
                      >
                        <span className="lessonMeta">
                          {lesson.lessonFile} · {lesson.relativePath}
                        </span>
                        <span className="lessonTitle">{lesson.title}</span>
                        <span
                          className={
                            completed ? "completedBadge" : "notStartedBadge"
                          }
                        >
                          {completed ? "Completed" : "Not started"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
