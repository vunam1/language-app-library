import Link from "next/link";
import { getAllLessons } from "@/lib/lessons";

export default function LessonsPage() {
  const lessons = getAllLessons();

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

      <div className="lessonList">
        {lessons.map((lesson) => (
          <Link className="lessonItem" href={lesson.href} key={lesson.slug}>
            <span className="lessonPath">{lesson.relativePath}</span>
            <span className="lessonTitle">{lesson.title}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
