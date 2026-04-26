"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type {
  ControlledPracticeActivity,
  LessonListItem,
  LessonMarkdownSection,
  QuickQuizQuestion,
} from "@/lib/lessons";
import { markLessonCompleted } from "@/lib/progress";
import ControlledPractice from "@/components/ControlledPractice";
import QuickQuiz from "@/components/QuickQuiz";
import SpeakingRecorder from "@/components/SpeakingRecorder";
import TextToSpeechPlayer from "@/components/TextToSpeechPlayer";

type LessonStepPlayerProps = {
  lessonSlug: string;
  lessonTitle: string;
  sections: LessonMarkdownSection[];
  nextLesson: LessonListItem | null;
};

type StepType =
  | "goal"
  | "vocabulary"
  | "patterns"
  | "dialogue"
  | "audioScript"
  | "listening"
  | "controlledPractice"
  | "speaking"
  | "quiz"
  | "review"
  | "default";

type LessonStep = {
  id: string;
  title: string;
  chipLabel: string;
  type: StepType;
  sections: LessonMarkdownSection[];
};

function getSectionType(heading: string): StepType {
  if (/^5\.\s*Key vocabulary/i.test(heading)) return "vocabulary";
  if (/^6\.\s*Key patterns/i.test(heading)) return "patterns";
  if (/^7\.\s*Short dialogue/i.test(heading)) return "dialogue";
  if (/^8\.\s*Audio script direction/i.test(heading)) return "audioScript";
  if (/^9\.\s*Listening practice/i.test(heading)) return "listening";
  if (/^10\.\s*Controlled practice/i.test(heading)) return "controlledPractice";
  if (/^11\.\s*Speaking practice/i.test(heading)) return "speaking";
  if (/^12\.\s*Quick quiz/i.test(heading)) return "quiz";
  if (/^13\.\s*Quick review/i.test(heading)) return "review";
  if (/^14\.\s*Completion criteria/i.test(heading)) return "review";
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

function parseQuickQuiz(content: string): QuickQuizQuestion[] {
  const questions: QuickQuizQuestion[] = [];
  let current:
    | {
        question: string;
        options: QuickQuizQuestion["options"];
        answer: string | null;
      }
    | null = null;

  const pushCurrent = () => {
    if (current?.question && current.options.length >= 2 && current.answer) {
      questions.push({
        question: current.question,
        options: current.options,
        answer: current.answer,
      });
    }
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) continue;

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

function inferBlankAnswer(prompt: string): string | null {
  const normalizedPrompt = prompt.toLowerCase().trim();
  const knownAnswers: Array<[RegExp, string]> = [
    [/good ____\.?$/, "morning"],
    [/how are ____\??$/, "you"],
    [/i am ____\.?$/, "good"],
    [/nice to ____ you\.?$/, "meet"],
    [/my name ____/i, "is"],
    [/i am from ____\.?$/, "Vietnam"],
    [/i am a ____\.?$/, "student"],
    [/this is my ____\.?$/, "friend"],
    [/in the morning, i ____\.?$/, "wake up"],
    [/i eat ____\.?$/, "breakfast"],
    [/i go to ____\.?$/, "work"],
    [/in the evening, i go ____\.?$/, "home"],
    [/at night, i ____\.?$/, "sleep"],
    [/i sleep at ____\.?$/, "night"],
    [/i usually ____\.?$/, "work"],
    [/i usually eat at ____\.?$/, "home"],
    [/what do you usually ____\??$/, "do"],
  ];

  return knownAnswers.find(([pattern]) => pattern.test(normalizedPrompt))?.[1] ?? null;
}

function parseControlledPractice(content: string): ControlledPracticeActivity[] {
  const blocks: Array<{ title: string; items: string[] }> = [];
  let current: { title: string; items: string[] } | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) continue;

    if (line.endsWith(":") && !line.startsWith("- ")) {
      if (current && current.items.length > 0) {
        blocks.push(current);
      }

      current = {
        title: line.replace(/:$/, "").trim(),
        items: [],
      };
      continue;
    }

    if (line.startsWith("- ") && current) {
      current.items.push(line.replace(/^-\s+/, "").trim());
    }
  }

  if (current && current.items.length > 0) {
    blocks.push(current);
  }

  return blocks
    .map((block): ControlledPracticeActivity | null => {
      if (/hoàn thành|hoan thanh|điền|dien/i.test(block.title)) {
        return {
          type: "fillBlank",
          title: block.title,
          items: block.items.map((prompt) => ({
            prompt,
            answer: prompt.includes("____") ? inferBlankAnswer(prompt) : null,
          })),
        };
      }

      if (/chọn|chon|phù hợp|phu hop/i.test(block.title)) {
        return {
          type: "multipleChoice",
          title: block.title,
          prompt: "Chọn câu phù hợp",
          options: block.items,
          answer: block.items[0],
        };
      }

      return {
        type: "tapToPractice",
        title: block.title,
        options: block.items,
      };
    })
    .filter((activity): activity is ControlledPracticeActivity => Boolean(activity));
}

function createLessonSteps(sections: LessonMarkdownSection[]): LessonStep[] {
  const byNumber = new Map(
    sections
      .filter((section) => section.number)
      .map((section) => [section.number, section]),
  );
  const steps: LessonStep[] = [];
  const goalSections = ["2", "3", "4"]
    .map((number) => byNumber.get(number))
    .filter((section): section is LessonMarkdownSection => Boolean(section));
  const reviewSections = ["13", "14"]
    .map((number) => byNumber.get(number))
    .filter((section): section is LessonMarkdownSection => Boolean(section));

  if (goalSections.length > 0) {
    steps.push({
      id: "goal",
      title: "Goal",
      chipLabel: "Goal",
      type: "goal",
      sections: goalSections,
    });
  }

  for (const number of ["5", "6", "7", "8", "9", "10", "11", "12"]) {
    const section = byNumber.get(number);
    if (!section) continue;

    const type = getSectionType(section.heading);
    const labelByType: Record<StepType, string> = {
      goal: "Goal",
      vocabulary: "Vocabulary",
      patterns: "Patterns",
      dialogue: "Dialogue",
      audioScript: "Listen",
      listening: "Listening",
      controlledPractice: "Practice",
      speaking: "Speaking",
      quiz: "Quiz",
      review: "Review",
      default: "Lesson",
    };

    steps.push({
      id: section.id,
      title: labelByType[type],
      chipLabel: labelByType[type],
      type,
      sections: [section],
    });
  }

  if (reviewSections.length > 0) {
    steps.push({
      id: "review",
      title: "Review",
      chipLabel: "Review",
      type: "review",
      sections: reviewSections,
    });
  }

  if (steps.length > 0) {
    return steps;
  }

  return sections
    .filter((section) => section.number !== "1")
    .map((section) => ({
      id: section.id,
      title: section.heading,
      chipLabel: section.number ? `Step ${section.number}` : "Step",
      type: getSectionType(section.heading),
      sections: [section],
    }));
}

function MarkdownPanel({
  section,
  variant,
}: {
  section: LessonMarkdownSection;
  variant: StepType;
}) {
  return (
    <div className={`markdown sectionMarkdown sectionMarkdown-${variant}`}>
      <ReactMarkdown>{section.content}</ReactMarkdown>
    </div>
  );
}

function StepContent({ step }: { step: LessonStep }) {
  if (step.type === "dialogue") {
    const section = step.sections[0];
    const dialogueLines = parseDialogueLines(section.content);

    if (dialogueLines.length > 0) {
      return (
        <div className="dialogueBlock">
          {dialogueLines.map((line, index) => (
            <div className="dialogueRow" key={`${line.speaker}-${index}`}>
              <span className="dialogueSpeaker">{line.speaker}</span>
              <p className="dialogueText">{line.text}</p>
            </div>
          ))}
        </div>
      );
    }
  }

  if (step.type === "audioScript") {
    const section = step.sections[0];

    return (
      <div className="audioScriptSection">
        <div className="audioScriptCallout">
          <p className="lessonMeta">Listening tool</p>
          <p>Hear words and sentences with browser speech.</p>
        </div>
        <MarkdownPanel section={section} variant={step.type} />
        <TextToSpeechPlayer content={section.content} />
      </div>
    );
  }

  if (step.type === "speaking") {
    const section = step.sections[0];

    return (
      <div className="speakingSection">
        <div className="speakingCallout">
          <p className="lessonMeta">Speaking task</p>
          <p>Practice out loud</p>
        </div>
        <MarkdownPanel section={section} variant={step.type} />
        <SpeakingRecorder />
      </div>
    );
  }

  if (step.type === "quiz") {
    const section = step.sections[0];
    const questions = parseQuickQuiz(section.content);

    return questions.length > 0 ? (
      <QuickQuiz questions={questions} />
    ) : (
      <MarkdownPanel section={section} variant={step.type} />
    );
  }

  if (step.type === "controlledPractice") {
    const section = step.sections[0];
    const activities = parseControlledPractice(section.content);

    return activities.length > 0 ? (
      <ControlledPractice activities={activities} />
    ) : (
      <MarkdownPanel section={section} variant={step.type} />
    );
  }

  return (
    <div className="stepMarkdownStack">
      {step.sections.map((section) => (
        <div className="stepSubsection" key={section.id}>
          {step.sections.length > 1 ? (
            <h3 className="stepSubsectionTitle">{section.heading}</h3>
          ) : null}
          <MarkdownPanel section={section} variant={step.type} />
        </div>
      ))}
    </div>
  );
}

export default function LessonStepPlayer({
  lessonSlug,
  lessonTitle,
  sections,
  nextLesson,
}: LessonStepPlayerProps) {
  const steps = useMemo(() => createLessonSteps(sections), [sections]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const currentStep = steps[currentStepIndex];
  const progressPercent =
    steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  if (!currentStep) {
    return null;
  }

  const isFirstStep = currentStepIndex === 0;
  const isFinalStep = currentStepIndex === steps.length - 1;

  const finishLesson = () => {
    markLessonCompleted(lessonSlug);
    setFinished(true);
  };

  return (
    <section className="lessonPlayer" aria-label={`Lesson player for ${lessonTitle}`}>
      <div className="stepProgress">
        <div>
          <p className="lessonMeta">
            Step {currentStepIndex + 1}/{steps.length}
          </p>
          <h2>{currentStep.title}</h2>
        </div>
        <div className="stepProgressBar" aria-hidden="true">
          <div
            className="stepProgressFill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="stepChips" aria-label="Lesson steps">
        {steps.map((step, index) => (
          <button
            className={`stepChip ${index === currentStepIndex ? "stepChipActive" : ""}`}
            key={step.id}
            onClick={() => {
              setCurrentStepIndex(index);
              setFinished(false);
            }}
            type="button"
          >
            {step.chipLabel}
          </button>
        ))}
      </div>

      <article className={`stepCard sectionType-${currentStep.type}`}>
        <div className="lessonSectionHeader">
          <span className={`sectionBadge sectionBadge-${currentStep.type}`}>
            {currentStep.chipLabel}
          </span>
          <h2 className="lessonSectionHeading">{currentStep.title}</h2>
        </div>
        <StepContent step={currentStep} />
      </article>

      {finished ? (
        <div className="finishPanel">
          <p className="lessonMeta">Progress saved</p>
          <h2>Lesson completed</h2>
          {nextLesson ? (
            <Link className="nextLessonButton" href={nextLesson.href}>
              Go to next lesson
            </Link>
          ) : (
            <p>You have reached the last lesson.</p>
          )}
          <button
            className="stepButtonSecondary"
            onClick={() => {
              setCurrentStepIndex(0);
              setFinished(false);
            }}
            type="button"
          >
            Review lesson again
          </button>
        </div>
      ) : null}

      <div className="stepActions">
        <button
          className={`stepButtonSecondary ${isFirstStep ? "stepButtonDisabled" : ""}`}
          disabled={isFirstStep}
          onClick={() => setCurrentStepIndex((index) => Math.max(0, index - 1))}
          type="button"
        >
          Back
        </button>

        {isFinalStep ? (
          <button className="stepButton" onClick={finishLesson} type="button">
            Finish lesson
          </button>
        ) : (
          <button
            className="stepButton"
            onClick={() => {
              setCurrentStepIndex((index) => Math.min(steps.length - 1, index + 1));
              setFinished(false);
            }}
            type="button"
          >
            Next
          </button>
        )}
      </div>
    </section>
  );
}
