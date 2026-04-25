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
};

export type LessonDetail = LessonListItem & {
  content: string;
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

function itemFromFile(filePath: string): LessonListItem {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(LESSONS_ROOT, filePath);
  const slugSegments = relativePath
    .replace(/\.md$/, "")
    .split(path.sep)
    .filter(Boolean);
  const slug = slugSegments.join("/");
  const fallbackTitle = path.basename(filePath, ".md");

  return {
    title: titleFromMarkdown(content, fallbackTitle),
    relativePath: path.join(LESSONS_DIR_NAME, relativePath).replaceAll("\\", "/"),
    slug,
    slugSegments,
    href: `/lessons/${slug}`,
  };
}

export function getAllLessons(): LessonListItem[] {
  return getMarkdownFiles(LESSONS_ROOT)
    .map(itemFromFile)
    .sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
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
