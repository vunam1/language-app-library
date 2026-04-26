"use client";

import { useMemo, useState } from "react";
import type { ControlledPracticeActivity } from "@/lib/lessons";

type ControlledPracticeProps = {
  activities: ControlledPracticeActivity[];
};

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.!?]+$/, "");
}

export default function ControlledPractice({ activities }: ControlledPracticeProps) {
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<
    Record<number, string>
  >({});
  const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<string, string>>(
    {},
  );
  const [checkedFillBlankItems, setCheckedFillBlankItems] = useState<
    Record<string, boolean>
  >({});
  const [tapSelections, setTapSelections] = useState<Record<number, string>>({});

  const scoredItemCount = useMemo(() => {
    return activities.reduce((total, activity) => {
      if (activity.type === "multipleChoice") return total + 1;
      if (activity.type === "fillBlank") {
        return total + activity.items.filter((item) => item.answer).length;
      }
      return total;
    }, 0);
  }, [activities]);

  const completedScoredCount = useMemo(() => {
    let count = 0;

    activities.forEach((activity, activityIndex) => {
      if (
        activity.type === "multipleChoice" &&
        multipleChoiceAnswers[activityIndex]
      ) {
        count += 1;
      }

      if (activity.type === "fillBlank") {
        activity.items.forEach((item, itemIndex) => {
          const key = `${activityIndex}-${itemIndex}`;
          if (item.answer && checkedFillBlankItems[key]) {
            count += 1;
          }
        });
      }
    });

    return count;
  }, [activities, checkedFillBlankItems, multipleChoiceAnswers]);

  return (
    <div className="controlledPractice">
      <p className="practiceProgress">
        Practice progress {completedScoredCount}/{scoredItemCount}
      </p>

      {activities.map((activity, activityIndex) => {
        if (activity.type === "multipleChoice") {
          const selected = multipleChoiceAnswers[activityIndex];

          return (
            <section className="practiceCard" key={`${activity.title}-${activityIndex}`}>
              <h3 className="practiceTitle">{activity.title}</h3>
              <p>{activity.prompt}</p>
              <div className="practiceOptions">
                {activity.options.map((option) => {
                  const isSelected = selected === option;
                  const isCorrect = option === activity.answer;
                  const showResult = Boolean(selected);
                  const className = [
                    "practiceOptionButton",
                    isSelected ? "practiceOptionSelected" : "",
                    showResult && isCorrect ? "practiceOptionCorrect" : "",
                    showResult && isSelected && !isCorrect
                      ? "practiceOptionWrong"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      className={className}
                      key={option}
                      onClick={() =>
                        setMultipleChoiceAnswers((current) => ({
                          ...current,
                          [activityIndex]: option,
                        }))
                      }
                      type="button"
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {selected ? (
                <p className="practiceFeedback">
                  {selected === activity.answer ? "Đúng" : "Chưa đúng"}
                </p>
              ) : null}
            </section>
          );
        }

        if (activity.type === "fillBlank") {
          return (
            <section className="practiceCard" key={`${activity.title}-${activityIndex}`}>
              <h3 className="practiceTitle">{activity.title}</h3>
              {activity.items.map((item, itemIndex) => {
                const key = `${activityIndex}-${itemIndex}`;
                const value = fillBlankAnswers[key] ?? "";
                const checked = checkedFillBlankItems[key];
                const isCorrect =
                  checked && item.answer
                    ? normalizeAnswer(value) === normalizeAnswer(item.answer)
                    : false;

                return (
                  <div className="practiceInputRow" key={key}>
                    <span>{item.prompt}</span>
                    {item.answer ? (
                      <>
                        <input
                          className="practiceInput"
                          onChange={(event) =>
                            setFillBlankAnswers((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          placeholder="Type answer"
                          value={value}
                        />
                        <button
                          className="practiceOptionButton"
                          onClick={() =>
                            setCheckedFillBlankItems((current) => ({
                              ...current,
                              [key]: true,
                            }))
                          }
                          type="button"
                        >
                          Check
                        </button>
                        {checked ? (
                          <p className="practiceFeedback">
                            {isCorrect ? "Đúng" : "Chưa đúng"}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="practiceFeedback">
                        Practice this sentence out loud.
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          );
        }

        return (
          <section className="practiceCard" key={`${activity.title}-${activityIndex}`}>
            <h3 className="practiceTitle">{activity.title}</h3>
            <div className="practiceOptions">
              {activity.options.map((option) => (
                <button
                  className="practiceOptionButton"
                  key={option}
                  onClick={() =>
                    setTapSelections((current) => ({
                      ...current,
                      [activityIndex]: option,
                    }))
                  }
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
            {tapSelections[activityIndex] ? (
              <div className="practiceOutput">{tapSelections[activityIndex]}</div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
