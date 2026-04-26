import Link from "next/link";
import { getGroupedLessons } from "@/lib/lessons";
import LessonListClient from "@/components/LessonListClient";

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

      <LessonListClient monthGroups={monthGroups} />
    </main>
  );
}
