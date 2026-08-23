require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/issue";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Mongoose Schema & Model
const complaintSchema = new mongoose.Schema(
  {
    originalData: {
      description: String,
      language: String,
      submittedAt: Date,
      location: {
        latitude: String,
        longitude: String,
      },
      media: {
        imageUrl: { type: String, default: null },
        voiceNoteUrl: { type: String, default: null },
      },
    },
    agentOutput: {
      issue_claim: String,
      image_confirmation: String,
      human_review: Boolean,
      department: String,
      request: String,
      priority: Number,
    },
  },
  { timestamps: true }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

// 2. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to stream Buffer directly to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper function: Calculate distance in meters using Haversine formula
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// 3. Configure Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// N8N Webhook Endpoint
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook-test/complaint";

// Main Route handler
app.post("/api/complaints", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "voiceNote", maxCount: 1 }
]), async (req, res) => {
  try {
    const imageFile = req.files?.image?.[0];
    const voiceNoteFile = req.files?.voiceNote?.[0];

    // A. Upload Media Buffers to Cloudinary in parallel
      let imageUrl = null;
      let voiceNoteUrl = null;

      const uploadPromises = [];

      if (imageFile) {
        uploadPromises.push(
          uploadToCloudinary(imageFile.buffer, "complaints/images", "image").then(
            (url) => (imageUrl = url)
          )
        );
      }

      if (voiceNoteFile) {
        uploadPromises.push(
          uploadToCloudinary(voiceNoteFile.buffer, "complaints/voice_notes", "video").then(
            (url) => (voiceNoteUrl = url)
          )
        );
      }

      await Promise.all(uploadPromises);

    // B. Preserve original Data structure
    const originalUserData = {
      description: req.body.description || "",
      language: req.body.language || "",
      submittedAt: req.body.submittedAt || new Date().toISOString(),
      location: {
        latitude: req.body.latitude || "",
        longitude: req.body.longitude || "",
      },
      media: {
          imageUrl: imageUrl,
          voiceNoteUrl: voiceNoteUrl,
        },
    };

    // C. Construct deep copies for the n8n payload
    const clonedDescription = String(originalUserData.description);
    let clonedImageBuffer = imageFile ? Buffer.from(imageFile.buffer) : null;

    // D. Prepare payload matching your exact n8n array format
    const n8nJsonMetaData = [
      {
        Image: imageFile ? [
          {
            filename: imageFile.originalname,
            mimetype: imageFile.mimetype,
            size: imageFile.size
          }
        ] : [],
        "Issue Description": clonedDescription,
        submittedAt: originalUserData.submittedAt
      }
    ];

    // E. Construct Multipart FormData to send both binary data & metadata to n8n
    const n8nPayload = new FormData();
    n8nPayload.append("data", JSON.stringify(n8nJsonMetaData));

    if (clonedImageBuffer) {
      n8nPayload.append("imageCopy", clonedImageBuffer, {
        filename: imageFile.originalname,
        contentType: imageFile.mimetype,
      });
    }

    // 5. Send data to n8n webhook
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, n8nPayload, {
      headers: n8nPayload.getHeaders(),
    });

    const agentOutput = n8nResponse.data;

    // List of valid department collections present in your database
          const validCollections = [
            "buildings_structural_safety",
            "disaster_management",
            "drainage_sewerage_waterlogging",
            "electricity_power_public_lighting",
            "fire_emergency",
            "roads_public_works",
            "solid_waste_sanitation",
            "trees_green_areas",
            "water_supply",
          ];
    
          // Default target collection for flagged reviews or unlisted departments
          let targetCollection = "uncategorized_issues";
    
          // Route to department collection ONLY if human_review is explicitly false AND department matches
          if (
            agentOutput?.human_review === false &&
            validCollections.includes(agentOutput?.department)
          ) {
            targetCollection = agentOutput.department;
          }
    
          // Format document payload with timestamps
          const documentToSave = {
            originalData: originalUserData,
            agentOutput: agentOutput,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
    
          // Save using MongoDB native driver through Mongoose connection
          const db = mongoose.connection.db;
          const collection = db.collection(targetCollection);

      // Parse incoming coordinates
      const newLat = parseFloat(originalUserData.location.latitude);
      const newLon = parseFloat(originalUserData.location.longitude);

      let matchedDocumentId = null;

      // Ensure valid numbers were passed before running geographical calculations
      if (!isNaN(newLat) && !isNaN(newLon)) {
        // Fetch existing records from the collection that have valid locations
        const existingComplaints = await collection
          .find({
            "originalData.location.latitude": { $exists: true, $ne: "" },
            "originalData.location.longitude": { $exists: true, $ne: "" },
          })
          .toArray();

        // Loop through existing items and check if distance <= 10 meters
        for (const existingDoc of existingComplaints) {
          const exLat = parseFloat(existingDoc.originalData?.location?.latitude);
          const exLon = parseFloat(existingDoc.originalData?.location?.longitude);

          if (!isNaN(exLat) && !isNaN(exLon)) {
            const distance = calculateHaversineDistance(newLat, newLon, exLat, exLon);
            if (distance <= 10) {
              matchedDocumentId = existingDoc._id;
              break; // Stop loop on first matching nearby complaint
            }
          }
        }
      }

      // --- CONDITIONAL UPDATE OR INSERT ---
      if (matchedDocumentId) {
        // Option A: Increment priority of existing duplicate issue within 10 meters
        await collection.updateOne(
          { _id: matchedDocumentId },
          {
            $inc: { "agentOutput.priority": 1 },
            $set: { updatedAt: new Date() },
          }
        );
        
        return res.status(200).json({
          success: true,
          message: `Nearby complaint within 10m found in '${targetCollection}'. Incremented priority by 1.`,
          data: {
            updatedComplaintId: matchedDocumentId,
            action: "PRIORITY_INCREMENTED",
          },
        });
      } else {
        // Option B: No match within 10 meters - Insert new document normally
        const result = await collection.insertOne(documentToSave);

        // F. Return Response
        return res.status(200).json({
          success: true,
          message: `Complaint processed and stored in '${targetCollection}' collection successfully.`,
          data: {
            _id: result.insertedId,
            ...documentToSave,
            action: "NEW_COMPLAINT_CREATED",
          },
        });
      } // Closes the 'else' block ONLY
    } catch (error) {
      console.error("Error processing request:", error?.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error while processing complaint.",
        error: error.message,
      });
    }
  }
);

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
