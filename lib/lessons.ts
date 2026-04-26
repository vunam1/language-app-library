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
