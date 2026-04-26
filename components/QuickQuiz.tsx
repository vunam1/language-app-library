"use client";

import { useMemo, useState } from "react";
import type { QuickQuizQuestion } from "@/lib/lessons";

type QuickQuizProps = {
  questions: QuickQuizQuestion[];
};

type DisplayedQuizOption = {
  displayKey: string;
  originalKey: string;
  text: string;
};

const DISPLAY_KEYS = ["A", "B", "C", "D", "E"];
const ROTATION_PATTERNS = [
  [0, 1, 2, 3, 4],
  [1, 2, 0, 3, 4],
  [2, 0, 1, 3, 4],
  [1, 0, 2, 3, 4],
  [2, 1, 0, 3, 4],
];

function rotateOptions(
  options: QuickQuizQuestion["options"],
  questionIndex: number,
): DisplayedQuizOption[] {
  const pattern = ROTATION_PATTERNS[questionIndex % ROTATION_PATTERNS.length];
  const orderedIndexes = [
    ...pattern.filter((index) => index < options.length),
    ...options.map((_, index) => index).filter((index) => !pattern.includes(index)),
  ];

  return orderedIndexes.map((optionIndex, displayIndex) => {
    const option = options[optionIndex];

    return {
      displayKey: DISPLAY_KEYS[displayIndex] ?? String(displayIndex + 1),
      originalKey: option.key,
      text: option.text,
    };
  });
}

export default function QuickQuiz({ questions }: QuickQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    {},
  );
  const displayedQuestions = useMemo(() => {
    return questions.map((question, questionIndex) => ({
      ...question,
      displayedOptions: rotateOptions(question.options, questionIndex),
    }));
  }, [questions]);

  const score = useMemo(() => {
    return questions.reduce((total, question, index) => {
      return selectedAnswers[index] === question.answer ? total + 1 : total;
    }, 0);
  }, [questions, selectedAnswers]);

  return (
    <div className="quizList">
      <div className="quizScore">
        Đúng {score}/{questions.length} câu
      </div>

      {displayedQuestions.map((question, questionIndex) => {
        const selected = selectedAnswers[questionIndex];

        return (
          <div className="quizQuestionCard" key={question.question}>
            <h3 className="quizQuestionTitle">
              {questionIndex + 1}. {question.question}
            </h3>

            <div className="quizOptions">
              {question.displayedOptions.map((option) => {
                const isSelected = selected === option.originalKey;
                const isCorrect = option.originalKey === question.answer;
                const showResult = Boolean(selected);
                const optionClassName = [
                  "quizOptionButton",
                  isSelected ? "quizOptionSelected" : "",
                  showResult && isCorrect ? "quizOptionCorrect" : "",
                  showResult && isSelected && !isCorrect ? "quizOptionWrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    className={optionClassName}
                    key={option.originalKey}
                    onClick={() =>
                      setSelectedAnswers((current) => ({
                        ...current,
                        [questionIndex]: option.originalKey,
                      }))
                    }
                    type="button"
                  >
                    <span>{option.displayKey}.</span>
                    <span>{option.text}</span>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <p className="quizFeedback">
                {selected === question.answer ? "Đúng" : "Chưa đúng"}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
