import React, { useState } from "react";
import Camera from "../components/Camera";
import Text from "../components/Text";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function FormWrapper() {
  const [cameraData, setCameraData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleCameraCapture = (data) => {
    setCameraData(data);
  };

  const handleFinalSubmit = async (textData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();

      if (cameraData?.image) {
        formData.append("image", cameraData.image, "captured-photo.jpg");
      }

      formData.append("description", textData.description?.trim() || "");
      formData.append("language", textData.language || "");

      const submissionTimestamp = new Date();
      formData.append("submittedAt", submissionTimestamp.toISOString());
      formData.append("latitude", cameraData?.location?.latitude ?? "");
      formData.append("longitude", cameraData?.location?.longitude ?? "");

      if (textData.audioFile) {
        formData.append("voiceNote", textData.audioFile, "voice-note.webm");
      }

      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit report.");
      }

      console.log("Form Submitted Successfully:", result);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Unable to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#009975] flex items-center justify-center shrink-0">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-[#009975] stroke-current"
              fill="none"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-light text-gray-800 tracking-tight">
            Thanks!
          </h1>
        </div>
        <p className="mt-4 text-gray-500 text-base sm:text-lg font-light">
          Your response was submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 flex items-center justify-center">
      {/* Outer Card Container */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          File your Report
        </h1>

        {/* Section 1: Camera/Image Capture */}
        <Camera onCapture={handleCameraCapture} />

        {/* Section 2: Text/Voice Message Form */}
        <Text onSubmitData={handleFinalSubmit} isLoading={isSubmitting} />

        {isSubmitting && (
          <p className="text-center text-xs text-gray-500 animate-pulse">
            Submitting payload...
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-red-500 font-medium">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}