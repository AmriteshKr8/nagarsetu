import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const app = express();

// ==================================================
// Upload directories
// ==================================================

fs.mkdirSync("uploads/images", {
  recursive: true,
});

fs.mkdirSync("uploads/audio", {
  recursive: true,
});

// ==================================================
// Multer storage
// ==================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "images") {
      cb(null, "uploads/images/");
      return;
    }

    if (file.fieldname === "voice-note") {
      cb(null, "uploads/audio/");
      return;
    }

    cb(new Error(`Unexpected file field: ${file.fieldname}`));
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,

  limits: {
    // Maximum size of a single file
    fileSize: 20 * 1024 * 1024,

    // Maximum number of uploaded files
    files: 4,

    // Maximum number of non-file fields
    fields: 10,
  },

  fileFilter: (req, file, cb) => {
    // ------------------------------
    // Images
    // ------------------------------

    if (file.fieldname === "images") {
      const allowedImages = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedImages.includes(file.mimetype)) {
        return cb(new Error("Only JPEG, PNG and WebP images are allowed"));
      }

      return cb(null, true);
    }

    // ------------------------------
    // Voice
    // ------------------------------

    if (file.fieldname === "voice-note") {
      const allowedAudio = [
        "audio/webm",
        "audio/ogg",
        "audio/wav",
        "audio/mpeg",
        "audio/mp4",
        "audio/x-m4a",
      ];

      if (!allowedAudio.includes(file.mimetype)) {
        return cb(new Error("Unsupported audio format"));
      }

      return cb(null, true);
    }

    // ------------------------------
    // Anything else
    // ------------------------------

    cb(new Error(`Unexpected file field: ${file.fieldname}`));
  },
});

// ==================================================
// Helper: delete uploaded files
// ==================================================

function deleteFiles(files) {
  if (!files) {
    return;
  }

  for (const file of files) {
    if (!file?.path) {
      continue;
    }

    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error("Failed to delete file:", file.path, error);
    }
  }
}

// ==================================================
// Complaint endpoint
// ==================================================

app.post(
  "/api/complaints",

  upload.fields([
    {
      name: "images",
      maxCount: 3,
    },

    {
      name: "voice-note",
      maxCount: 1,
    },
  ]),

  async (req, res) => {
    const uploadedFiles = Object.values(req.files || {}).flat();

    try {
      // ==========================================
      // Get files
      // ==========================================

      const images = req.files?.images || [];

      const voiceNote = req.files?.["voice-note"]?.[0];

      // ==========================================
      // Get form fields
      // ==========================================

      const location = req.body.location?.trim() || "";

      const issueTitle = req.body["issue-title"]?.trim() || "";

      const issueDescription = req.body["issue-description"]?.trim() || "";

      const latitudeRaw = req.body.latitude;

      const longitudeRaw = req.body.longitude;

      const accuracyRaw = req.body.accuracy;

      // ==========================================
      // IMAGE VALIDATION
      // ==========================================

      if (images.length < 1) {
        throw new Error("At least one image is required");
      }

      if (images.length > 3) {
        throw new Error("Maximum 3 images are allowed");
      }

      // ==========================================
      // IMAGE SIZE
      // ==========================================

      const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

      for (const image of images) {
        if (image.size > MAX_IMAGE_SIZE) {
          throw new Error("Each image must be 10 MB or smaller");
        }
      }

      // ==========================================
      // GPS VALIDATION
      // ==========================================

      let latitude = null;
      let longitude = null;
      let accuracy = null;

      const hasLatitude = latitudeRaw !== undefined && latitudeRaw !== "";

      const hasLongitude = longitudeRaw !== undefined && longitudeRaw !== "";

      const hasAccuracy = accuracyRaw !== undefined && accuracyRaw !== "";

      // ------------------------------------------
      // If GPS is supplied, lat + longitude
      // must BOTH be supplied.
      // ------------------------------------------

      if (hasLatitude !== hasLongitude) {
        throw new Error(
          "Both latitude and longitude are required when using GPS",
        );
      }

      // ------------------------------------------
      // Parse GPS
      // ------------------------------------------

      if (hasLatitude && hasLongitude) {
        latitude = Number(latitudeRaw);

        longitude = Number(longitudeRaw);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error("Invalid GPS coordinates");
        }

        if (latitude < -90 || latitude > 90) {
          throw new Error("Latitude must be between -90 and 90");
        }

        if (longitude < -180 || longitude > 180) {
          throw new Error("Longitude must be between -180 and 180");
        }
      }

      // ==========================================
      // Accuracy
      // ==========================================

      if (hasAccuracy) {
        accuracy = Number(accuracyRaw);

        if (!Number.isFinite(accuracy) || accuracy < 0) {
          throw new Error("Invalid GPS accuracy");
        }
      }

      // ==========================================
      // LOCATION REQUIREMENT
      //
      // Written location OR GPS
      // ==========================================

      const hasWrittenLocation = location.length > 0;

      const hasGPS = latitude !== null && longitude !== null;

      if (!hasWrittenLocation && !hasGPS) {
        throw new Error(
          "Either a written location or GPS coordinates are required",
        );
      }

      // ==========================================
      // TEXT LENGTH VALIDATION
      // ==========================================

      if (issueTitle.length > 200) {
        throw new Error("Issue title is too long");
      }

      if (issueDescription.length > 5000) {
        throw new Error("Issue description is too long");
      }

      // ==========================================
      // TEXT / VOICE REQUIREMENT
      //
      // If BOTH title and description are empty,
      // voice is mandatory.
      // ==========================================

      const hasText = issueTitle.length > 0 || issueDescription.length > 0;

      const hasVoice = Boolean(voiceNote);

      if (!hasText && !hasVoice) {
        throw new Error("Provide an issue title/description or a voice note");
      }

      // ==========================================
      // VOICE VALIDATION
      // ==========================================

      if (voiceNote) {
        const MAX_AUDIO_SIZE = 20 * 1024 * 1024;

        if (voiceNote.size > MAX_AUDIO_SIZE) {
          throw new Error("Voice note must be 20 MB or smaller");
        }
      }

      // ==========================================
      // PRINT DATA
      // ==========================================

      console.log("\n========================================");

      console.log("       NEW NAGARSETU COMPLAINT");

      console.log("========================================");

      console.log("\nForm data:");

      console.log({
        location,

        latitude,

        longitude,

        accuracy,

        issueTitle,

        issueDescription,
      });

      console.log(`\nImages (${images.length}):`);

      images.forEach((image, index) => {
        console.log(`Image ${index + 1}:`);

        console.log({
          originalName: image.originalname,

          filename: image.filename,

          path: image.path,

          mimetype: image.mimetype,

          size: image.size,
        });
      });

      if (voiceNote) {
        console.log("\nVoice note:");

        console.log({
          originalName: voiceNote.originalname,

          filename: voiceNote.filename,

          path: voiceNote.path,

          mimetype: voiceNote.mimetype,

          size: voiceNote.size,
        });
      }

      console.log("\n========================================\n");

      // ==========================================
      // Response
      // ==========================================

      res.status(201).json({
        success: true,

        message: "Complaint received",

        data: {
          location,

          latitude,

          longitude,

          accuracy,

          issueTitle: issueTitle || null,

          issueDescription: issueDescription || null,

          images: images.map((image) => ({
            filename: image.filename,

            path: image.path,

            mimetype: image.mimetype,

            size: image.size,
          })),

          voiceNote: voiceNote
            ? {
                filename: voiceNote.filename,

                path: voiceNote.path,

                mimetype: voiceNote.mimetype,

                size: voiceNote.size,
              }
            : null,
        },
      });
    } catch (error) {
      // ==========================================
      // Delete files from rejected request
      // ==========================================

      deleteFiles(uploadedFiles);

      console.error("Complaint rejected:", error.message);

      res.status(400).json({
        success: false,

        error: error.message,
      });
    }
  },
);
