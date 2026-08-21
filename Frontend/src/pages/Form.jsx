// Form.jsx
import React, { useState } from "react";
import Image from "../components/Image";
import Text from "../components/Text";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Form() {
  const [locationData, setLocationData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Callback to capture extracted metadata and image file from Image.jsx
  const handleLocationExtracted = (data) => {
    setLocationData(data);
  };

  // Callback triggered when the submit button inside Text.jsx is clicked
  const handleTextSubmit = async (textData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // 1. Image
      if (locationData?.file) {
        formData.append("image", locationData.file);
      }

      // 2. Text details
      formData.append("description", textData.description?.trim() || "");
      formData.append("language", textData.language || "");

      // 3. Metadata & Timestamps
      const submissionTimestamp = new Date();
      formData.append("submittedAt", submissionTimestamp.toISOString());
      formData.append("latitude", locationData?.latitude ?? "");
      formData.append("longitude", locationData?.longitude ?? "");

      // 4. Voice note
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
    } catch (error) {
      console.error("Submission error:", error);
      alert(error.message || "Unable to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-12 shadow-md border border-gray-100 flex flex-col items-start justify-center min-h-[300px] space-y-4">
        <div className="flex items-center space-x-4">
          {/* Checkmark Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-emerald-600 text-emerald-600">
            <svg
              className="w-6 h-6 stroke-current"
              fill="none"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-light text-gray-800">Thanks!</h1>
        </div>
        <p className="text-gray-600 text-lg pl-1">
          Your response was submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl bg-white p-6 shadow-md border border-gray-100">
      <h1 className="text-xl font-bold text-gray-900">File your Report</h1>

      {/* Image Picker Component */}
      <Image onLocationExtracted={handleLocationExtracted} />

      {/* Text & Voice Message Component */}
      <Text onSubmitData={handleTextSubmit} isLoading={isSubmitting} />

      {isSubmitting && (
        <p className="text-center text-xs text-gray-500 animate-pulse">
          Submitting payload...
        </p>
      )}
    </div>
  );
}