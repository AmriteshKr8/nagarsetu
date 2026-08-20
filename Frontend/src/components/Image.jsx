import React, { useState, useEffect } from "react";
import exifr from "exifr";

export default function Image({ onLocationExtracted }) {
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clean up object URL memory leak on unmount or re-upload
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setError("");
    setLocation(null);
    setLoading(true);

    // Create image preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      // Extract GPS data automatically upon upload
      const gps = await exifr.gps(file);

      if (!gps || !gps.latitude || !gps.longitude) {
        setError("No GPS metadata found in this image.");
        if (onLocationExtracted) onLocationExtracted(null);
      } else {
        const extractedLocation = {
          latitude: gps.latitude,
          longitude: gps.longitude,
          file,
        };
        setLocation(extractedLocation);

        // Pass extracted data up to parent component
        if (onLocationExtracted) {
          onLocationExtracted(extractedLocation);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process image EXIF data.");
      if (onLocationExtracted) onLocationExtracted(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-900">Photo</h2>

      {/* Hidden input wrapped by clickable container */}
      <label className="relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#eff5f3] transition hover:bg-[#e6f0ed]">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {preview ? (
          <img
            src={preview}
            alt="Uploaded preview"
            className="h-full max-h-[300px] w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex flex-col items-center p-6 text-center text-gray-500">
            {/* Camera Icon */}
            <svg
            className="mb-2 h-8 w-8 stroke-current"
            fill="none"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
            </svg>
            <span className="text-xs font-medium">Tap to Upload Image</span>
          </div>
        )}
      </label>

      {/* Loading state */}
      {loading && (
        <p className="mt-3 text-center text-xs text-gray-500">
          Extracting location...
        </p>
      )}

      {/* Extracted Details */}
      {location && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs">
          <div>
            <span className="block text-gray-400">Latitude</span>
            <span className="font-mono font-semibold text-gray-700">
              {location.latitude.toFixed(6)}
            </span>
          </div>
          <div>
            <span className="block text-gray-400">Longitude</span>
            <span className="font-mono font-semibold text-gray-700">
              {location.longitude.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-2 text-center text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}