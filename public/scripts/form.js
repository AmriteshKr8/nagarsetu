import { showPopup } from "./popup.js";

const form = document.getElementById("complaintForm");

const imagesInput = document.getElementById("images");

const imagePreview = document.getElementById("imagePreview");

const locationInput = document.getElementById("location");

const gpsBtn = document.getElementById("gpsBtn");

const gpsInfo = document.getElementById("gpsInfo");

const issueDescription = document.getElementById("issueDescription");

const recordBtn = document.getElementById("recordBtn");

const stopBtn = document.getElementById("stopBtn");

const recordStatus = document.getElementById("recordStatus");

const audioPlayer = document.getElementById("audioPlayer");

const submitBtn = document.getElementById("submitBtn");

// ======================================================
// GPS
// ======================================================

let latitude = null;
let longitude = null;
let accuracy = null;

gpsBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showPopup("Geolocation is not supported by this browser.", true);

    return;
  }

  gpsBtn.disabled = true;

  gpsInfo.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      latitude = position.coords.latitude;

      longitude = position.coords.longitude;

      accuracy = position.coords.accuracy;

      gpsInfo.textContent = `GPS captured ±${Math.round(accuracy)} m`;

      gpsBtn.disabled = false;

      showPopup("Location captured.");
    },

    (error) => {
      latitude = null;
      longitude = null;
      accuracy = null;

      gpsBtn.disabled = false;

      gpsInfo.textContent = "GPS location could not be obtained.";

      showPopup(`Unable to get location: ${error.message}`, true);
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
});

// ======================================================
// IMAGE SELECTION
// ======================================================

imagesInput.addEventListener("change", () => {
  const files = Array.from(imagesInput.files);

  imagePreview.innerHTML = "";

  if (files.length === 0) {
    return;
  }

  if (files.length > 3) {
    imagesInput.value = "";

    imagePreview.innerHTML = "";

    showPopup("You can upload a maximum of 3 images.", true);

    return;
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      imagesInput.value = "";

      imagePreview.innerHTML = "";

      showPopup("Only image files are allowed.", true);

      return;
    }

    const img = document.createElement("img");

    img.src = URL.createObjectURL(file);

    img.alt = "Selected complaint photo";

    imagePreview.appendChild(img);
  }
});

// ======================================================
// AUDIO RECORDING
// ======================================================

let mediaRecorder = null;

let audioChunks = [];

let audioBlob = null;

let microphoneStream = null;

recordBtn.addEventListener("click", async () => {
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    audioChunks = [];

    audioBlob = null;

    mediaRecorder = new MediaRecorder(microphoneStream);

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener("stop", () => {
      audioBlob = new Blob(audioChunks, {
        type: mediaRecorder.mimeType,
      });

      audioPlayer.src = URL.createObjectURL(audioBlob);

      audioPlayer.hidden = false;

      recordStatus.textContent =
        `Voice note recorded ` + `(${Math.ceil(audioBlob.size / 1024)} KB)`;

      microphoneStream?.getTracks().forEach((track) => track.stop());
    });

    mediaRecorder.start();

    recordBtn.disabled = true;

    stopBtn.disabled = false;

    recordBtn.textContent = "Recording...";

    recordBtn.classList.add("recording");

    recordStatus.textContent = "Recording voice note...";
  } catch (error) {
    console.error("Microphone error:", error);

    showPopup("Could not access the microphone.", true);
  }
});

stopBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  recordBtn.disabled = false;

  stopBtn.disabled = true;

  recordBtn.textContent = "Start recording";

  recordBtn.classList.remove("recording");
});

// ======================================================
// FORM SUBMISSION
// ======================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // ==============================================
  // Validate images
  // ==============================================

  const images = Array.from(imagesInput.files);

  if (images.length < 1 || images.length > 3) {
    showPopup("Please select between 1 and 3 images.", true);

    return;
  }

  // ==============================================
  // Validate GPS
  //
  // GPS IS REQUIRED.
  //
  // Human-readable location text is optional.
  // ==============================================

  const hasGPS = latitude !== null && longitude !== null && accuracy !== null;

  if (!hasGPS) {
    showPopup("Please capture your GPS location before submitting.", true);

    return;
  }

  // ==============================================
  // Validate text / voice
  //
  // Voice is required only when the
  // description is empty.
  // ==============================================

  const description = issueDescription.value.trim();

  const hasText = description.length > 0;

  const hasVoice = audioBlob !== null;

  if (!hasText && !hasVoice) {
    showPopup("Please describe the issue or record a voice note.", true);

    return;
  }

  // ==============================================
  // Prevent double submission
  // ==============================================

  submitBtn.disabled = true;

  submitBtn.textContent = "Submitting...";

  // ==============================================
  // Build multipart/form-data
  // ==============================================

  const formData = new FormData();

  // ==============================================
  // Images
  // ==============================================

  for (const image of images) {
    formData.append("images", image, image.name);
  }

  // ==============================================
  // Written location
  //
  // OPTIONAL
  // ==============================================

  const writtenLocation = locationInput.value.trim();

  if (writtenLocation) {
    formData.append("location", writtenLocation);
  }

  // ==============================================
  // GPS
  //
  // REQUIRED
  // ==============================================

  formData.append("latitude", latitude);

  formData.append("longitude", longitude);

  formData.append("accuracy", accuracy);

  // ==============================================
  // Issue description
  // ==============================================

  if (description) {
    formData.append("issue-description", description);
  }

  // ==============================================
  // Voice note
  // ==============================================

  if (audioBlob) {
    formData.append("voice-note", audioBlob, "voice-note.webm");
  }

  // ==============================================
  // Send request
  // ==============================================

  try {
    const response = await fetch("/api/complaints", {
      method: "POST",

      body: formData,
    });

    let result;

    try {
      result = await response.json();
    } catch {
      result = {};
    }

    if (!response.ok) {
      throw new Error(
        result.error || `Server returned HTTP ${response.status}`,
      );
    }

    console.log("Complaint submitted:", result);

    showPopup("Complaint submitted successfully.");

    // ==========================================
    // Reset form
    // ==========================================

    form.reset();

    imagePreview.innerHTML = "";

    audioPlayer.hidden = true;

    audioPlayer.removeAttribute("src");

    recordStatus.textContent = "No voice note recorded.";

    gpsInfo.textContent = "GPS location is required.";

    latitude = null;
    longitude = null;
    accuracy = null;

    audioBlob = null;
  } catch (error) {
    console.error("Complaint submission error:", error);

    showPopup(error.message || "Failed to submit complaint.", true);
  } finally {
    submitBtn.disabled = false;

    submitBtn.textContent = "Submit Complaint";
  }
});
