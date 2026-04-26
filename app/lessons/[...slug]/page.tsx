import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  getAllLessons,
  getLessonBySlug,
  getLessonNavigation,
  parseLessonMarkdown,
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

  const parsedLesson = parseLessonMarkdown(lesson.content);
  const hasSections = parsedLesson.sections.length > 0;

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

      {hasSections ? (
        <>
          {parsedLesson.intro ? (
            <article className="markdown lessonIntro">
              <ReactMarkdown>{parsedLesson.intro}</ReactMarkdown>
            </article>
          ) : null}

          <nav className="sectionNav" aria-label="Lesson sections">
            <h2>Trong bài này</h2>
            <ol className="sectionNavList">
              {parsedLesson.sections.map((section) => (
                <li key={section.id}>
                  <a className="sectionAnchor" href={`#${section.id}`}>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="lessonSections">
            {parsedLesson.sections.map((section) => (
              <section
                className="lessonSectionCard"
                id={section.id}
                key={section.id}
              >
                <h2 className="lessonSectionHeading">{section.heading}</h2>
                <div className="markdown sectionMarkdown">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <article className="markdown">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </article>
      )}

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
