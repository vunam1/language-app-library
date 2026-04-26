"use client";

import { useEffect, useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "recorded" | "error";

export default function SpeakingRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia),
    );

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    chunksRef.current = [];
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    clearRecording();

    if (!isSupported) {
      setStatus("error");
      setErrorMessage("Trình duyệt này chưa hỗ trợ ghi âm trực tiếp.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const nextAudioUrl = URL.createObjectURL(blob);

        setAudioUrl(nextAudioUrl);
        setStatus("recorded");
        stopTracks();
      };

      recorder.start();
      setStatus("recording");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Không thể bật micro. Hãy kiểm tra quyền truy cập micro trong trình duyệt.",
      );
      stopTracks();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  };

  if (!isSupported) {
    return (
      <div className="speakingRecorder">
        <p className="recorderNotice">
          Trình duyệt này chưa hỗ trợ ghi âm trực tiếp.
        </p>
      </div>
    );
  }

  return (
    <div className="speakingRecorder">
      <div>
        <p className="lessonMeta">Recorder</p>
        <p className="recordingStatus">
          {status === "recording"
            ? "Đang ghi âm..."
            : status === "recorded"
              ? "Đã có bản ghi. Bạn có thể nghe lại."
              : "Ghi âm phần luyện nói của bạn."}
        </p>
      </div>

      <div className="recorderControls">
        {status === "recording" ? (
          <button className="recorderButton" onClick={stopRecording} type="button">
            Stop recording
          </button>
        ) : (
          <button className="recorderButton" onClick={startRecording} type="button">
            {audioUrl ? "Record again" : "Start recording"}
          </button>
        )}

        {audioUrl ? (
          <button
            className="recorderButtonSecondary"
            onClick={clearRecording}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>

      {errorMessage ? <p className="recorderNotice">{errorMessage}</p> : null}

      {audioUrl ? (
        <audio className="audioPlayback" controls src={audioUrl}>
          Your browser does not support audio playback.
        </audio>
      ) : null}
    </div>
  );
}
