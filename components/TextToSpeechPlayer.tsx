"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TextToSpeechPlayerProps = {
  content: string;
};

function extractSpeakableLines(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletLines = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter(Boolean);

  if (bulletLines.length > 0) {
    return bulletLines.slice(0, 20);
  }

  return lines
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line.length <= 120)
    .slice(0, 20);
}

export default function TextToSpeechPlayer({ content }: TextToSpeechPlayerProps) {
  const speakableLines = useMemo(() => extractSpeakableLines(content), [content]);
  const playSessionRef = useRef(0);
  const [isSupported, setIsSupported] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && "speechSynthesis" in window,
    );

    return () => {
      playSessionRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, []);

  const stopSpeech = () => {
    playSessionRef.current += 1;
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setActiveIndex(null);
  };

  const speakLine = (
    text: string,
    index: number,
    sessionId: number,
    onEnd?: () => void,
  ) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.8;
    utterance.onend = () => {
      if (playSessionRef.current !== sessionId) {
        return;
      }

      setActiveIndex(null);
      onEnd?.();
    };
    utterance.onerror = () => {
      setActiveIndex(null);
    };

    setActiveIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const playLine = (text: string, index: number) => {
    stopSpeech();
    const sessionId = playSessionRef.current;
    speakLine(text, index, sessionId);
  };

  const playAllFrom = (index: number, sessionId: number) => {
    if (playSessionRef.current !== sessionId) {
      return;
    }

    if (index >= speakableLines.length) {
      setActiveIndex(null);
      return;
    }

    speakLine(speakableLines[index], index, sessionId, () =>
      playAllFrom(index + 1, sessionId),
    );
  };

  const playAll = () => {
    stopSpeech();
    const sessionId = playSessionRef.current;
    playAllFrom(0, sessionId);
  };

  if (!isSupported) {
    return (
      <div className="ttsPlayer">
        <p className="ttsNotice">
          Trình duyệt này chưa hỗ trợ đọc mẫu trực tiếp.
        </p>
      </div>
    );
  }

  if (speakableLines.length === 0) {
    return null;
  }

  return (
    <div className="ttsPlayer">
      <div className="ttsHeader">
        <div>
          <p className="lessonMeta">Text-to-speech</p>
          <h3>Listen to sample</h3>
        </div>
        <div className="ttsControls">
          <button className="ttsButton" onClick={playAll} type="button">
            Play all
          </button>
          <button className="ttsButtonSecondary" onClick={stopSpeech} type="button">
            Stop
          </button>
        </div>
      </div>

      <div className="ttsLineList">
        {speakableLines.map((line, index) => (
          <div className="ttsLine" key={`${line}-${index}`}>
            <span className="ttsText">{line}</span>
            <button
              className="ttsButtonSecondary"
              onClick={() => playLine(line, index)}
              type="button"
            >
              {activeIndex === index ? "Playing" : "Play"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
