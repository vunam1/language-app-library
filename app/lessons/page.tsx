import Link from "next/link";
import { getGroupedLessons } from "@/lib/lessons";

export default function LessonsPage() {
  const monthGroups = getGroupedLessons();

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <p className="eyebrow">Lessons</p>
          <h1>Lesson Markdown</h1>
          <p>Danh sách lesson đọc từ folder 08-lessons.</p>
        </div>
        <Link href="/">Trang chủ</Link>
      </div>

      <div className="monthList">
        {monthGroups.map((monthGroup) => (
          <section className="monthGroup" key={monthGroup.month}>
            <h2>{monthGroup.monthLabel}</h2>

            {monthGroup.batches.map((batchGroup) => (
              <section className="batchGroup" key={batchGroup.batch}>
                <h3 className="batchTitle">{batchGroup.batchLabel}</h3>
                <div className="lessonList">
                  {batchGroup.lessons.map((lesson) => (
                    <Link
                      className="lessonItem"
                      href={lesson.href}
                      key={lesson.slug}
                    >
                      <span className="lessonMeta">
                        {lesson.lessonFile} · {lesson.relativePath}
                      </span>
                      <span className="lessonTitle">{lesson.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
