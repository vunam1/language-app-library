import fs from "node:fs";
import path from "node:path";

const LESSONS_DIR_NAME = "08-lessons";
const LESSONS_ROOT = path.resolve(process.cwd(), LESSONS_DIR_NAME);

export type LessonListItem = {
  title: string;
  relativePath: string;
  slug: string;
  slugSegments: string[];
  href: string;
  month: string;
  batch: string;
  lessonFile: string;
  monthLabel: string;
  batchLabel: string;
};

export type LessonDetail = LessonListItem & {
  content: string;
};

export type LessonBatchGroup = {
  batch: string;
  batchLabel: string;
  lessons: LessonListItem[];
};

export type LessonMonthGroup = {
  month: string;
  monthLabel: string;
  batches: LessonBatchGroup[];
};

export type LessonNavigation = {
  previous: LessonListItem | null;
  next: LessonListItem | null;
};

export type LessonMarkdownSection = {
  id: string;
  heading: string;
  number?: string;
  content: string;
};

export type ParsedLessonMarkdown = {
  title: string | null;
  intro: string;
  sections: LessonMarkdownSection[];
};

export type QuickQuizOption = {
  key: string;
  text: string;
};

export type QuickQuizQuestion = {
  question: string;
  options: QuickQuizOption[];
  answer: string;
};

function isInsideLessonsRoot(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  return (
    resolvedPath === LESSONS_ROOT ||
    resolvedPath.startsWith(`${LESSONS_ROOT}${path.sep}`)
  );
}

function assertSafeSlug(slug: string[]) {
  return slug.every((segment) => {
    return (
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      !segment.includes("/") &&
      !segment.includes("\\")
    );
  });
}

function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir) || !isInsideLessonsRoot(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (!isInsideLessonsRoot(entryPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files;
}

function titleFromMarkdown(content: string, fallback: string) {
  const firstHeading = content
    .split(/\r?\n/)
    .find((line) => line.startsWith("# "));

  return firstHeading?.replace(/^#\s+/, "").trim() || fallback;
}

function sectionNumberFromHeading(heading: string) {
  return heading.match(/^(\d+)\./)?.[1];
}

function labelFromSegment(segment: string, prefix: string) {
  const number = segment.match(/\d+/)?.[0];
  return number ? `${prefix} ${number}` : segment;
}

function itemFromFile(filePath: string): LessonListItem {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(LESSONS_ROOT, filePath);
  const slugSegments = relativePath
    .replace(/\.md$/, "")
    .split(path.sep)
    .filter(Boolean);
  const slug = slugSegments.join("/");
  const fallbackTitle = path.basename(filePath, ".md");
  const [month = "unknown-month", batch = "unknown-batch", lessonFile = fallbackTitle] =
    slugSegments;

  return {
    title: titleFromMarkdown(content, fallbackTitle),
    relativePath: path.join(LESSONS_DIR_NAME, relativePath).replaceAll("\\", "/"),
    slug,
    slugSegments,
    href: `/lessons/${slug}`,
    month,
    batch,
    lessonFile,
    monthLabel: labelFromSegment(month, "Month"),
    batchLabel: labelFromSegment(batch, "Batch"),
  };
}

export function getAllLessons(): LessonListItem[] {
  return getMarkdownFiles(LESSONS_ROOT)
    .map(itemFromFile)
    .sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
}

export function getGroupedLessons(): LessonMonthGroup[] {
  const groups = new Map<string, LessonMonthGroup>();

  for (const lesson of getAllLessons()) {
    if (!groups.has(lesson.month)) {
      groups.set(lesson.month, {
        month: lesson.month,
        monthLabel: lesson.monthLabel,
        batches: [],
      });
    }

    const monthGroup = groups.get(lesson.month);

    if (!monthGroup) {
      continue;
    }

    let batchGroup = monthGroup.batches.find(
      (batch) => batch.batch === lesson.batch,
    );

    if (!batchGroup) {
      batchGroup = {
        batch: lesson.batch,
        batchLabel: lesson.batchLabel,
        lessons: [],
      };
      monthGroup.batches.push(batchGroup);
    }

    batchGroup.lessons.push(lesson);
  }

  return Array.from(groups.values());
}

export function getLessonNavigation(slug: string[]): LessonNavigation {
  const currentSlug = slug.join("/");
  const lessons = getAllLessons();
  const currentIndex = lessons.findIndex((lesson) => lesson.slug === currentSlug);

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
    };
  }

  return {
    previous: lessons[currentIndex - 1] ?? null,
    next: lessons[currentIndex + 1] ?? null,
  };
}

export function parseLessonMarkdown(content: string): ParsedLessonMarkdown {
  const lines = content.split(/\r?\n/);
  const titleLineIndex = lines.findIndex((line) => line.startsWith("# "));
  const title =
    titleLineIndex >= 0 ? lines[titleLineIndex].replace(/^#\s+/, "").trim() : null;
  const bodyLines =
    titleLineIndex >= 0
      ? lines.filter((_, index) => index !== titleLineIndex)
      : lines;
  const sections: LessonMarkdownSection[] = [];
  const introLines: string[] = [];
  let current:
    | {
        heading: string;
        number?: string;
        lines: string[];
      }
    | null = null;

  for (const line of bodyLines) {
    if (line.startsWith("## ")) {
      if (current) {
        const sectionIndex = sections.length + 1;
        sections.push({
          id: `section-${sectionIndex}`,
          heading: current.heading,
          number: current.number,
          content: current.lines.join("\n").trim(),
        });
      }

      const heading = line.replace(/^##\s+/, "").trim();
      current = {
        heading,
        number: sectionNumberFromHeading(heading),
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (current) {
    const sectionIndex = sections.length + 1;
    sections.push({
      id: `section-${sectionIndex}`,
      heading: current.heading,
      number: current.number,
      content: current.lines.join("\n").trim(),
    });
  }

  return {
    title,
    intro: introLines.join("\n").trim(),
    sections,
  };
}

export function parseQuickQuiz(content: string): QuickQuizQuestion[] {
  const questions: QuickQuizQuestion[] = [];
  let current:
    | {
        question: string;
        options: QuickQuizOption[];
        answer: string | null;
      }
    | null = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    if (current.question && current.options.length >= 2 && current.answer) {
      questions.push({
        question: current.question,
        options: current.options,
        answer: current.answer,
      });
    }
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const questionMatch = line.match(/^\d+\.\s+(.+)$/);

    if (questionMatch) {
      pushCurrent();
      current = {
        question: questionMatch[1].trim(),
        options: [],
        answer: null,
      };
      continue;
    }

    const optionMatch = line.match(/^-\s*([A-Z])\.\s+(.+)$/);

    if (optionMatch && current) {
      current.options.push({
        key: optionMatch[1].trim(),
        text: optionMatch[2].trim(),
      });
      continue;
    }

    const answerMatch = line.match(/^(?:Đáp án|Dap an):\s*([A-Z])\b/i);

    if (answerMatch && current) {
      current.answer = answerMatch[1].trim().toUpperCase();
    }
  }

  pushCurrent();

  return questions;
}

export function getLessonBySlug(slug: string[]): LessonDetail | null {
  if (!assertSafeSlug(slug)) {
    return null;
  }

  const filePath = path.resolve(LESSONS_ROOT, ...slug) + ".md";

  if (!isInsideLessonsRoot(filePath) || path.extname(filePath) !== ".md") {
    return null;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }

  const item = itemFromFile(filePath);
  const content = fs.readFileSync(filePath, "utf8");

  return {
    ...item,
    content,
  };
}
