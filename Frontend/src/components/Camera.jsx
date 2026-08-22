import React, { useRef, useState } from "react";

const Camera = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [error, setError] = useState(null);
  const [captureData, setCaptureData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);

  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { timeout: 10000 }
      );
    });
  }

  async function captureImage() {
    try {
      setError(null);

      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!video || !video.srcObject) {
        setError("Please open the camera first.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg");
      });

      if (!imageBlob) {
        setError("Unable to create image.");
        return;
      }

      const imageUrl = URL.createObjectURL(imageBlob);
      setCapturedImageUrl(imageUrl);

      // Stop stream
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsCameraActive(false);

      const capturedAt = new Date().toISOString();
      
      // Fetch location safely
      let location = null;
      try {
        location = await getLocation();
      } catch (locError) {
        if (locError.code === 1) {
          setError("Location permission not granted.");
        } else if (locError.code === 2) {
          setError("Unable to determine location.");
        } else if (locError.code === 3) {
          setError("Location request timed out.");
        } else {
          setError("Could not retrieve location.");
        }
      }

      const data = {
        image: imageBlob,
        capturedAt,
        location,
      };

      setCaptureData(data);

      if (onCapture) {
        onCapture(data);
      }
    } catch (err) {
      setError("Unable to capture image.");
    }
  }

  async function openCamera() {
    try {
      setError(null);
      setCapturedImageUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (error) {
      if (error.name === "NotAllowedError") {
        setError("Camera permission not granted.");
      } else if (error.name === "NotFoundError") {
        setError("No camera was found.");
      } else if (error.name === "NotReadableError") {
        setError("Camera is already being used by another application.");
      } else {
        setError("Unable to access camera.");
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Upload the Issue</h2>

      <div className="relative w-full aspect-[4/3] bg-[#f2f6f5] rounded-2xl flex flex-col items-center justify-center overflow-hidden border border-gray-100">
        {!isCameraActive && !capturedImageUrl && (
          <button
            onClick={openCamera}
            type="button"
            className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
          >
            <svg
              className="w-8 h-8 mb-2 stroke-current"
              fill="none"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            <span className="text-sm font-medium">Tap to open camera</span>
          </button>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${
            isCameraActive ? "block" : "hidden"
          }`}
        />

        {!isCameraActive && capturedImageUrl && (
          <img
            src={capturedImageUrl}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {isCameraActive && (
          <button
            onClick={captureImage}
            type="button"
            className="absolute bottom-4 px-5 py-2.5 bg-black/70 hover:bg-black text-white text-sm font-medium rounded-full backdrop-blur-md transition-all"
          >
            Capture Photo
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>
      )}

      {captureData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
          <p><span className="font-semibold">Captured at:</span> {captureData.capturedAt}</p>
          {captureData.location ? (
            <>
              <p><span className="font-semibold">Latitude:</span> {captureData.location.latitude}</p>
              <p><span className="font-semibold">Longitude:</span> {captureData.location.longitude}</p>
            </>
          ) : (
            <p className="text-red-400">Location unavailable</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Camera;