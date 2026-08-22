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
      latitude: req.body.latitude || "",
      longitude: req.body.longitude || "",
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
          const result = await db.collection(targetCollection).insertOne(documentToSave);

    // F. Return Response
    return res.status(200).json({
      success: true,
      message: `Complaint processed and stored in '${targetCollection}' collection successfully.`,
      data: {
        _id: result.insertedId,
        ...documentToSave
      }
    });

  } catch (error) {
    console.error("Error processing request:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing complaint.",
      error: error.message,
    });
  }
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});