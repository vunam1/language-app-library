import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  getAllLessons,
  getLessonBySlug,
  getLessonNavigation,
  parseLessonMarkdown,
  parseQuickQuiz,
} from "@/lib/lessons";
import LessonCompletion from "@/components/LessonCompletion";
import QuickQuiz from "@/components/QuickQuiz";
import SpeakingRecorder from "@/components/SpeakingRecorder";

type LessonPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

type SectionType =
  | "default"
  | "vocabulary"
  | "patterns"
  | "dialogue"
  | "audioScript"
  | "listening"
  | "controlledPractice"
  | "speaking"
  | "quiz"
  | "review"
  | "completion";

const SECTION_LABELS: Record<SectionType, string> = {
  default: "Lesson",
  vocabulary: "Vocabulary",
  patterns: "Pattern",
  dialogue: "Dialogue",
  audioScript: "Listening",
  listening: "Listening",
  controlledPractice: "Practice",
  speaking: "Speaking",
  quiz: "Quiz",
  review: "Review",
  completion: "Completion",
};

function isQuickQuizSection(heading: string) {
  return /^12\.\s*Quick quiz/i.test(heading) || /Quick quiz/i.test(heading);
}

function getSectionType(heading: string): SectionType {
  if (/^5\.\s*Key vocabulary/i.test(heading)) return "vocabulary";
  if (/^6\.\s*Key patterns/i.test(heading)) return "patterns";
  if (/^7\.\s*Short dialogue/i.test(heading)) return "dialogue";
  if (/^8\.\s*Audio script direction/i.test(heading)) return "audioScript";
  if (/^9\.\s*Listening practice/i.test(heading)) return "listening";
  if (/^10\.\s*Controlled practice/i.test(heading)) return "controlledPractice";
  if (/^11\.\s*Speaking practice/i.test(heading)) return "speaking";
  if (/^12\.\s*Quick quiz/i.test(heading)) return "quiz";
  if (/^13\.\s*Quick review/i.test(heading)) return "review";
  if (/^14\.\s*Completion criteria/i.test(heading)) return "completion";
  return "default";
}

function parseDialogueLines(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const parsedLines = lines.map((line) => {
    const match = line.match(/^([A-Za-z][A-Za-z\s.'-]{0,40}):\s+(.+)$/);
    return match
      ? {
          speaker: match[1].trim(),
          text: match[2].trim(),
        }
      : null;
  });

  return parsedLines.every(Boolean)
    ? parsedLines.filter((line): line is { speaker: string; text: string } =>
        Boolean(line),
      )
    : [];
}

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

      <LessonCompletion slug={lesson.slug} title={lesson.title} />

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
            {parsedLesson.sections.map((section) => {
              const sectionType = getSectionType(section.heading);
              const quickQuizQuestions = isQuickQuizSection(section.heading)
                ? parseQuickQuiz(section.content)
                : [];
              const dialogueLines =
                sectionType === "dialogue"
                  ? parseDialogueLines(section.content)
                  : [];

              return (
                <section
                  className={`lessonSectionCard sectionType-${sectionType}`}
                  id={section.id}
                  key={section.id}
                >
                  <div className="lessonSectionHeader">
                    <span className={`sectionBadge sectionBadge-${sectionType}`}>
                      {SECTION_LABELS[sectionType]}
                    </span>
                    <h2 className="lessonSectionHeading">{section.heading}</h2>
                  </div>
                  {quickQuizQuestions.length > 0 ? (
                    <QuickQuiz questions={quickQuizQuestions} />
                  ) : dialogueLines.length > 0 ? (
                    <div className="dialogueBlock">
                      {dialogueLines.map((line, index) => (
                        <div className="dialogueRow" key={`${line.speaker}-${index}`}>
                          <span className="dialogueSpeaker">{line.speaker}</span>
                          <p className="dialogueText">{line.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : sectionType === "speaking" ? (
                    <div className="speakingSection">
                      <div className="speakingCallout">
                        <p className="lessonMeta">Speaking task</p>
                        <p>Practice out loud</p>
                      </div>
                      <div className="markdown sectionMarkdown">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                      <SpeakingRecorder />
                    </div>
                  ) : (
                    <div
                      className={`markdown sectionMarkdown sectionMarkdown-${sectionType}`}
                    >
                      <ReactMarkdown>{section.content}</ReactMarkdown>
                    </div>
                  )}
                </section>
              );
            })}
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
