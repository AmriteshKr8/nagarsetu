const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configure Multer memory storage (keeps file in memory buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Replace with your actual n8n webhook URL
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook-test/complaint";

app.post("/api/complaints", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "voiceNote", maxCount: 1 }
]), async (req, res) => {
  try {
    const imageFile = req.files?.image?.[0];
    const voiceNoteFile = req.files?.voiceNote?.[0];

    // Preserve original user input data
    const originalUserData = {
      description: req.body.description || "",
      language: req.body.language || "",
      submittedAt: req.body.submittedAt || new Date().toISOString(),
      latitude: req.body.latitude || "",
      longitude: req.body.longitude || "",
      image: imageFile ? {
        buffer: imageFile.buffer,
        originalname: imageFile.originalname,
        mimetype: imageFile.mimetype,
        size: imageFile.size
      } : null,
      voiceNote: voiceNoteFile ? {
        buffer: voiceNoteFile.buffer,
        originalname: voiceNoteFile.originalname,
        mimetype: voiceNoteFile.mimetype,
        size: voiceNoteFile.size
      } : null
    };

    // 2. Construct deep copies for the n8n payload
    const clonedDescription = String(originalUserData.description);
    
    // Create an exact binary duplicate of the original image buffer
    let clonedImageBuffer = null;
    if (originalUserData.image) {
      clonedImageBuffer = Buffer.from(originalUserData.image.buffer);
    }

    // 3. Prepare payload matching your exact n8n array format
    const n8nJsonMetaData = [
      {
        Image: originalUserData.image ? [
          {
            filename: originalUserData.image.originalname,
            mimetype: originalUserData.image.mimetype,
            size: originalUserData.image.size
          }
        ] : [],
        "Issue Description": clonedDescription,
        submittedAt: originalUserData.submittedAt
      }
    ];

    // 4. Construct Multipart FormData to send both binary data & metadata to n8n
    const n8nPayload = new FormData();
    n8nPayload.append("data", JSON.stringify(n8nJsonMetaData));

    if (clonedImageBuffer) {
      n8nPayload.append("imageCopy", clonedImageBuffer, {
        filename: originalUserData.image.originalname,
        contentType: originalUserData.image.mimetype,
      });
    }

    // 5. Send data to n8n webhook
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, n8nPayload, {
      headers: n8nPayload.getHeaders(),
    });

    const agentOutput = n8nResponse.data;

    // 6. Merge the agent response into your original data
    const mergedResult = {
      originalData: {
        description: originalUserData.description,
        language: originalUserData.language,
        submittedAt: originalUserData.submittedAt,
        latitude: originalUserData.latitude,
        longitude: originalUserData.longitude,
        hasImage: !!originalUserData.image,
        hasVoiceNote: !!originalUserData.voiceNote,
      },
      agentOutput: agentOutput // Output returned by n8n
    };

    return res.status(200).json({
      success: true,
      message: "Report processed and merged successfully.",
      data: mergedResult
    });

  } catch (error) {
    console.error("Error processing request:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while forwarding to n8n agent."
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});