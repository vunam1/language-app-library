import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  getAllLessons,
  getLessonBySlug,
  getLessonNavigation,
} from "@/lib/lessons";

type LessonPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export function generateStaticParams() {
  return getAllLessons().map((lesson) => ({
    slug: lesson.slugSegments,
  }));
}

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  const navigation = getLessonNavigation(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <p className="eyebrow">Lesson detail</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.relativePath}</p>
        </div>
        <Link href="/lessons">Quay lại lessons</Link>
      </div>

      <article className="markdown">
        <ReactMarkdown>{lesson.content}</ReactMarkdown>
      </article>

      <nav className="lessonNavigation" aria-label="Lesson navigation">
        {navigation.previous ? (
          <Link className="navCard" href={navigation.previous.href}>
            <span className="lessonMeta">Previous lesson</span>
            <span>{navigation.previous.title}</span>
          </Link>
        ) : (
          <span className="navCard disabledNav">
            <span className="lessonMeta">Previous lesson</span>
            <span>No previous lesson</span>
          </span>
        )}

        {navigation.next ? (
          <Link className="navCard" href={navigation.next.href}>
            <span className="lessonMeta">Next lesson</span>
            <span>{navigation.next.title}</span>
          </Link>
        ) : (
          <span className="navCard disabledNav">
            <span className="lessonMeta">Next lesson</span>
            <span>No next lesson</span>
          </span>
        )}
      </nav>
    </main>
  );
}
