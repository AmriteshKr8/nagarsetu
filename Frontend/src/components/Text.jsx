// Text.jsx
import React, { useEffect, useRef, useState } from "react";

const INDIAN_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "or-IN", label: "Odia (ଓଡ଼ିଆ)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "bn-IN", label: "Bengali (বাংলা)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { code: "kn-IN", label: "Kannada (കന്നഡ)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
];

export default function ImageDescription({ onSubmitData }) {
  const [description, setDescription] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const baseTextRef = useRef("");

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startListening = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Real-time speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    try {
      // 1. Initialize Microphone Audio Stream for Recording
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioFile = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioFile);
        // Stop audio tracks
        audioStream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      // 2. Initialize Speech Recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      baseTextRef.current = description ? description.trim() + " " : "";

      recognition.onresult = (event) => {
        let liveTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          liveTranscript += event.results[i][0].transcript;
        }
        setDescription(baseTextRef.current + liveTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        stopListening();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setRecordingTime(0);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = () => {
    const selectedLangObj = INDIAN_LANGUAGES.find((lang) => lang.code === selectedLang);

    if (onSubmitData) {
      onSubmitData({
        description,
        language: selectedLangObj?.label, // Pass only the label string e.g. "Hindi (हिन्दी)"
        audioFile: audioBlob, // Blob object (or null if no recording was made)
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header & Language Dropdown */}
      <div className="flex items-center justify-around gap-4">
        <h2 className="text-base font-semibold text-gray-900">Issue Description</h2>

        <div className="flex items-center gap-2">
          <label htmlFor="language" className="text-xs text-gray-500 font-medium">
            Select Language:
          </label>
          <select
            id="language"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isRecording}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 outline-none focus:border-[#009975] disabled:opacity-50"
          >
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Text Area Container */}
      <div className="relative w-full min-h-45 p-4 bg-[#f2f6f5] border border-gray-100 rounded-2xl flex flex-col justify-between">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Type or dictate your message..."
          rows={5}
          className="w-full bg-transparent resize-none border-none outline-none text-gray-800 placeholder-gray-400 text-base"
        />

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          {isRecording ? (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Listening Live...
              </span>
              <span className="text-xs font-mono text-gray-600">
                {formatTime(recordingTime)}
              </span>
              <button
                type="button"
                onClick={stopListening}
                className="px-2.5 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-black transition-colors"
              >
                Stop
              </button>
            </div>
          ) : (
            <div />
          )}

          {!isRecording && (
            <button
              type="button"
              onClick={startListening}
              className="ml-auto w-11 h-11 rounded-full bg-[#e3eae8] hover:bg-[#d8e2e0] flex items-center justify-center text-gray-700 transition-colors focus:outline-none"
              title="Start dictating"
            >
              <svg
                className="w-5 h-5 stroke-current"
                fill="none"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 0 3-3V4.5a3 3 0 0 0-6 0v8.25a3 3 0 0 0 3 3Z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Audio Playback Preview (If recorded) */}
{audioBlob && !isRecording && (
  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2">
    <span className="text-xs font-medium text-gray-600 shrink-0">
      Recorded Audio Note:
    </span>
    
    <div className="flex items-center gap-2">
      <audio
        controls
        controlsList="nodownload noplaybackrate no remoteplayback"
        src={URL.createObjectURL(audioBlob)}
        className="h-8 max-w-50 sm:max-w-xs"
      />

      {/* Delete Recording Button */}
      <button
        type="button"
        onClick={() => setAudioBlob(null)}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
        title="Delete recording"
      >
        <svg
          className="w-5 h-5 stroke-current"
          fill="none"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </div>
  </div>
)}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-3.5 bg-[#009975] hover:bg-[#008767] text-white font-medium rounded-2xl transition-colors shadow-sm text-base"
      >
        Submit
      </button>
    </div>
  );
}