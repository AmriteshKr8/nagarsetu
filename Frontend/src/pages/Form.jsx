// Form.jsx
import React, { useState } from "react";
import Image from "../components/Image";
import Text from "../components/Text";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Form() {
  const [locationData, setLocationData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      alert("Report submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      alert(error.message || "Unable to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

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