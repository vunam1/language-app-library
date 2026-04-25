import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getAllLessons, getLessonBySlug } from "@/lib/lessons";

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
    </main>
  );
}
