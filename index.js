import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import crypto from "crypto";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { validationResult, body } from "express-validator";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();
const PORT = 3000;

const app = express();
app.use(express.json());
app.use("/", express.static("public"));

fs.mkdirSync("uploads/images", {
  recursive: true,
});

fs.mkdirSync("uploads/audio", {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "images") {
      cb(null, "uploads/images/");
    } else if (file.fieldname === "voice-note") {
      cb(null, "uploads/audio/");
    } else {
      cb(new Error(`Unexpected file field: ${file.fieldname}`));
    }
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const filename = `${Date.now()}-${randomUUID()}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 4,
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL, pass: process.env.GOOGLE_APP_PASSWORD },
});

async function getEmbedding(text) {
  const response = await ollama.embed({
    model: "nomic-embed-text",
    input: text,
  });
  return response.embeddings[0];
}

async function sendVerificationEmail(email, link) {
  /*
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Email verification</h2>
      <p>Click the link below to verify your account:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
  */
  const info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Verify your email",
    text: `Visit the link below to verify your account: ${link}`,
    html: `
      <h2>Email verification</h2>
      <p>Click the link below to verify your account:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
}

async function sendPasswordResetEmail(email, link) {
  /*
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
  */
  const info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Reset your password",
    text: `Visit the link below to reset your password: ${link}`,
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
}

const signupValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/),

  body("email").isEmail(),

  body("password").isStrongPassword(),
];

const loginValidation = [
  body("loginId").trim().notEmpty(),
  body("password").notEmpty(),
];

app.use("/login", authLimiter);
app.use("/signup", authLimiter);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
    },

    department: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
    },

    mail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    enabled: {
      type: Boolean,
      default: false,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
const complaintSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length >= 1 && value.length <= 3,
        message: "Complaint must contain between 1 and 3 images",
      },
    },

    voicepath: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    department: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
      enum: [
        "firestation",
        "policestation",
        "roads",
        "sanitation",
        "water",
        "electricity",
        "streetlights",
        "parks",
        "drainage",
        "publichealth",
        "other",
      ],
    },

    location: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },

    accuracy: {
      type: Number,
      required: true,
      min: 0,
    },

    issueDescription: {
      type: String,
      default: null,
      trim: true,
      maxlength: 5000,
    },

    humanreview: {
      type: Boolean,
      default: false,
    },

    aiValidation: {
      matched: {
        type: Boolean,
        default: null,
      },

      confidence: {
        type: Number,
        default: null,
        min: 0,
        max: 1,
      },

      reason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 500,
      },

      model: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
      },
    },

    solved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Complaint = mongoose.model("Complaint", complaintSchema);

const emailVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

export const EmailVerification = mongoose.model(
  "EmailVerification",
  emailVerificationSchema,
);

const passwordResetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

export const PasswordReset = mongoose.model(
  "PasswordReset",
  passwordResetSchema,
);

app.post("/signup", signupValidation, validate, async (req, res) => {
  const { username, password, email } = req.body;
  const hash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await User.create({
      username,
      password: hash,
      mail: email.toLowerCase(),
      enabled: false,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).send("Username or email already exists");
    }
    throw err;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await EmailVerification.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  const verifyLink = `${process.env.APP_BASE_URL}/verify-email?token=${token}&id=${user._id}`;

  await sendVerificationEmail(user.mail, verifyLink);

  res.send("Signup successful. Check your email to verify your account.");
});

app.post("/login", loginValidation, validate, async (req, res) => {
  const { loginId, password } = req.body;
  const login = loginId.includes("@") ? loginId.toLowerCase() : loginId;

  const user = await User.findOne({
    $or: [{ username: login }, { mail: login }],
  });

  if (!user) {
    return res.status(401).send("Invalid credentials");
  }

  if (!user.enabled) {
    return res.status(403).send("Email not verified");
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).send("Invalid credentials");
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: "invman-api",
      audience: "invman-client",
    },
  );

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.send("Logged in");
});

app.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send("Email required");

  const user = await User.findOne({ mail: email.toLowerCase() });

  if (!user) {
    return res
      .status(200)
      .send("If this email exists, a reset link has been sent");
  }

  await PasswordReset.deleteMany({ userId: user._id });

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await PasswordReset.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  const resetLink = `${process.env.APP_BASE_URL}/reset-password.html?token=${token}&id=${user._id}`;

  await sendPasswordResetEmail(user.mail, resetLink);

  res.send("If this email exists, a reset link has been sent");
});

app.post("/reset-password", async (req, res) => {
  const { token, id, newPassword } = req.body;
  if (!token || !id || !newPassword) {
    return res.status(400).send("Missing required fields");
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword)) {
    return res.status(400).send("Weak password");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await PasswordReset.findOne({
    userId: id,
    tokenHash,
  });

  if (!record) {
    return res.status(400).send("Invalid or expired reset link");
  }

  if (record.expiresAt < new Date()) {
    await PasswordReset.deleteMany({ userId: id });
    return res.status(400).send("Invalid or expired reset link");
  }

  const hash = await bcrypt.hash(newPassword, 12);

  await User.updateOne(
    { _id: id },
    {
      password: hash,
      $inc: { tokenVersion: 1 },
    },
  );

  await PasswordReset.deleteMany({ userId: id });

  res.send("Password updated successfully. You may now log in.");
});

app.post("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.send("Logged out");
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/verify-email", async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) {
    return res.status(400).send("Invalid verification link");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await EmailVerification.findOne({
    userId: id,
    tokenHash,
  });

  if (!record) {
    return res.status(400).send("Invalid or expired verification link");
  }

  await User.updateOne({ _id: id }, { enabled: true });
  await EmailVerification.deleteMany({ userId: id });

  res.send("Email verified successfully. You may now log in.");
});

/*
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
    try {
      // ------------------------------------------
      // Files
      // ------------------------------------------

      const images = req.files?.images || [];

      const voiceNote = req.files?.["voice-note"]?.[0];

      // ------------------------------------------
      // Form fields
      // ------------------------------------------

      const {
        location,
        latitude,
        longitude,
        accuracy,
        ["issue-description"]: issueDescription,
      } = req.body;

      const description = issueDescription?.trim() || "";

      // ------------------------------------------
      // Images
      // 1-3 required
      // ------------------------------------------

      if (images.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one image is required",
        });
      }

      if (images.length > 3) {
        return res.status(400).json({
          success: false,
          error: "Maximum 3 images allowed",
        });
      }

      // ------------------------------------------
      // Voice requirement
      //
      // Voice is required ONLY when both
      // title and description are empty.
      // ------------------------------------------

      const hasText = description.length > 0;

      const hasVoice = Boolean(voiceNote);

      if (!hasText && !hasVoice) {
        return res.status(400).json({
          success: false,
          error: "Provide an issue title/description or a voice note",
        });
      }

      // ------------------------------------------
      // Print form data
      // ------------------------------------------

      console.log("\n========================================");

      console.log("        NEW NAGARSETU COMPLAINT");

      console.log("========================================");

      console.log("\nForm data:");

      console.log({
        location: location || null,

        latitude: latitude || null,

        longitude: longitude || null,

        accuracy: accuracy || null,

        issueDescription: description || null,
      });

      // ------------------------------------------
      // Print images
      // ------------------------------------------

      console.log(`\nImages (${images.length}):`);

      images.forEach((image, index) => {
        console.log(`Image ${index + 1}:`, {
          originalName: image.originalname,

          filename: image.filename,

          path: image.path,

          mimetype: image.mimetype,

          size: image.size,
        });
      });

      // ------------------------------------------
      // Print voice
      // ------------------------------------------

      if (voiceNote) {
        console.log("\nVoice note:", {
          originalName: voiceNote.originalname,

          filename: voiceNote.filename,

          path: voiceNote.path,

          mimetype: voiceNote.mimetype,

          size: voiceNote.size,
        });
      } else {
        console.log("\nVoice note: none");
      }

      console.log("\n========================================\n");

      // ------------------------------------------
      // Response
      // ------------------------------------------

      res.status(201).json({
        success: true,

        message: "Complaint received",

        data: {
          location: location || null,

          latitude: latitude || null,

          longitude: longitude || null,

          accuracy: accuracy || null,

          issueDescription: description || null,

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
      console.error("Complaint processing error:", error);

      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);
*/

const DEPARTMENTS = [
  "firestation",
  "policestation",
  "roads",
  "sanitation",
  "water",
  "electricity",
  "streetlights",
  "parks",
  "drainage",
  "publichealth",
  "other",
];

const GEMINI_MODEL = "gemini-3.6-flash";

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
    try {
      // ------------------------------------------
      // Files
      // ------------------------------------------

      const images = req.files?.images || [];
      const voiceNote = req.files?.["voice-note"]?.[0];

      // ------------------------------------------
      // Form fields
      // ------------------------------------------

      const {
        location,
        latitude,
        longitude,
        accuracy,
        ["issue-description"]: issueDescription,
      } = req.body;

      let description = issueDescription?.trim() || "";

      // ------------------------------------------
      // Images
      // 1-3 required
      // ------------------------------------------

      if (images.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one image is required",
        });
      }

      if (images.length > 3) {
        return res.status(400).json({
          success: false,
          error: "Maximum 3 images allowed",
        });
      }

      // ------------------------------------------
      // GPS
      // ------------------------------------------

      if (
        latitude === undefined ||
        latitude === "" ||
        longitude === undefined ||
        longitude === "" ||
        accuracy === undefined ||
        accuracy === ""
      ) {
        return res.status(400).json({
          success: false,
          error: "Latitude, longitude and accuracy are required",
        });
      }

      const latitudeNumber = Number(latitude);
      const longitudeNumber = Number(longitude);
      const accuracyNumber = Number(accuracy);

      if (
        !Number.isFinite(latitudeNumber) ||
        latitudeNumber < -90 ||
        latitudeNumber > 90
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid latitude",
        });
      }

      if (
        !Number.isFinite(longitudeNumber) ||
        longitudeNumber < -180 ||
        longitudeNumber > 180
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid longitude",
        });
      }

      if (!Number.isFinite(accuracyNumber) || accuracyNumber < 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid GPS accuracy",
        });
      }

      // ------------------------------------------
      // Voice requirement
      //
      // Voice is required only when description
      // is empty.
      // ------------------------------------------

      const hasVoice = Boolean(voiceNote);

      if (!description && !hasVoice) {
        return res.status(400).json({
          success: false,
          error: "Provide an issue description or a voice note",
        });
      }

      // ------------------------------------------
      // STT
      // ------------------------------------------

      if (!description && voiceNote) {
        console.log("Description empty, sending voice note to STT...");

        const sttForm = new FormData();

        const voiceBuffer = await fs.promises.readFile(voiceNote.path);

        sttForm.append(
          "voice-note",
          new Blob([voiceBuffer], {
            type: voiceNote.mimetype || "audio/wav",
          }),
          voiceNote.originalname,
        );

        const sttResponse = await fetch(
          "https://debbie.boston-broadnose.ts.net:5600/webhook-test/stt",
          {
            method: "POST",
            body: sttForm,
          },
        );

        if (!sttResponse.ok) {
          const errorText = await sttResponse.text();

          console.error("STT request failed:", {
            status: sttResponse.status,
            response: errorText,
          });

          return res.status(502).json({
            success: false,
            error: "Speech-to-text service failed",
          });
        }

        const sttResult = await sttResponse.json();

        console.log("STT response:", sttResult);

        description =
          typeof sttResult.text === "string" ? sttResult.text.trim() : "";

        if (!description) {
          return res.status(400).json({
            success: false,
            error: "Voice note did not produce a valid description",
          });
        }

        console.log("Transcribed description:", description);
      }

      // ------------------------------------------
      // Gemini
      // Image validation + department
      // ------------------------------------------

      console.log("Sending complaint to Gemini...");

      const geminiParts = [
        {
          text: `You are an AI system processing a civic complaint.

Complaint description:
${description}

You have been given one or more images belonging to this complaint.

Your tasks are:

1. Determine whether the visible content of the image(s) is consistent with the complaint description.
2. Determine which municipal department should handle the complaint.

Available departments:

${DEPARTMENTS.map((department) => `- ${department}`).join("\n")}

Department selection rules:

- firestation:
  Fires, smoke, fire hazards, fire emergencies, rescue situations handled by fire services.

- policestation:
  Crime, theft, violence, suspicious activity, traffic violations, public safety issues requiring police.

- roads:
  Potholes, damaged roads, broken pavement, road surfaces, damaged road infrastructure.

- sanitation:
  Garbage, waste collection, overflowing garbage bins, illegal dumping, dirty public areas.

- water:
  Water supply problems, leaking water pipes, contaminated water, broken water connections.

- electricity:
  Electrical infrastructure, electrical poles, electrical wires, power infrastructure.

- streetlights:
  Broken, damaged, or non-functional streetlights.

- parks:
  Public parks, playgrounds, damaged park equipment, park maintenance.

- drainage:
  Blocked drains, overflowing drains, sewage drainage, waterlogging caused by drainage problems.

- publichealth:
  Public health, disease hazards, unhygienic conditions, public health infrastructure.

- other:
  Use this when none of the available departments is appropriate.

Important rules:

- Select exactly ONE department from the provided list.
- Do not invent a department.
- Use the complaint description AND visible evidence from the images.
- Only use evidence that is actually visible.
- Do not assume something exists if it cannot be seen.
- If the image is unrelated to the complaint, matched must be false.
- If the image is too blurry, dark, obstructed, or otherwise insufficient to verify the complaint, matched must be false and confidence should be low.
- Consider all supplied images together.
- Keep the reason under 30 words.

Return only the requested JSON.`,
        },
      ];

      // ------------------------------------------
      // Add images
      // ------------------------------------------

      for (const image of images) {
        const imageBuffer = await fs.promises.readFile(image.path);

        geminiParts.push({
          inlineData: {
            mimeType: image.mimetype || "image/jpeg",

            data: imageBuffer.toString("base64"),
          },
        });
      }

      let aiValidation;

      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              "x-goog-api-key": process.env.GEMINI_API_KEY,
            },

            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: geminiParts,
                },
              ],

              generationConfig: {
                responseMimeType: "application/json",

                responseSchema: {
                  type: "OBJECT",

                  properties: {
                    matched: {
                      type: "BOOLEAN",
                    },

                    confidence: {
                      type: "NUMBER",
                    },

                    reason: {
                      type: "STRING",
                    },

                    department: {
                      type: "STRING",

                      enum: DEPARTMENTS,
                    },
                  },

                  required: ["matched", "confidence", "reason", "department"],
                },
              },
            }),
          },
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();

          console.error("Gemini request failed:", {
            status: geminiResponse.status,

            response: errorText,
          });

          aiValidation = {
            matched: null,
            confidence: null,
            reason: "Gemini validation service failed",
            department: "other",
            model: GEMINI_MODEL,
          };
        } else {
          const geminiData = await geminiResponse.json();

          console.log("Gemini response:", geminiData);

          const responseText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!responseText) {
            console.error("Gemini returned no result:", geminiData);

            aiValidation = {
              matched: null,
              confidence: null,
              reason: "Gemini returned no validation result",
              department: "other",
              model: GEMINI_MODEL,
            };
          } else {
            try {
              const parsed = JSON.parse(responseText);

              // ------------------------------------------
              // Validate matched
              // ------------------------------------------

              if (typeof parsed.matched !== "boolean") {
                throw new Error("Invalid matched value");
              }

              // ------------------------------------------
              // Validate confidence
              // ------------------------------------------

              const confidence = Number(parsed.confidence);

              if (
                !Number.isFinite(confidence) ||
                confidence < 0 ||
                confidence > 1
              ) {
                throw new Error("Invalid confidence value");
              }

              // ------------------------------------------
              // Validate reason
              // ------------------------------------------

              if (typeof parsed.reason !== "string") {
                throw new Error("Invalid reason value");
              }

              // ------------------------------------------
              // Validate department
              // ------------------------------------------

              if (
                typeof parsed.department !== "string" ||
                !DEPARTMENTS.includes(parsed.department)
              ) {
                throw new Error(`Invalid department: ${parsed.department}`);
              }

              aiValidation = {
                matched: parsed.matched,

                confidence,

                reason: parsed.reason.trim().slice(0, 500),

                department: parsed.department,

                model: GEMINI_MODEL,
              };
            } catch (parseError) {
              console.error("Invalid Gemini result:", {
                responseText,
                error: parseError,
              });

              aiValidation = {
                matched: null,
                confidence: null,
                reason: "Gemini returned invalid validation data",
                department: "other",
                model: GEMINI_MODEL,
              };
            }
          }
        }
      } catch (geminiError) {
        console.error("Gemini request error:", geminiError);

        aiValidation = {
          matched: null,
          confidence: null,
          reason: "Gemini validation service unavailable",
          department: "other",
          model: GEMINI_MODEL,
        };
      }

      // ------------------------------------------
      // Human review decision
      // ------------------------------------------

      const MATCH_THRESHOLD = 0.75;

      const humanreview = !(
        aiValidation.matched === true &&
        aiValidation.confidence !== null &&
        aiValidation.confidence >= MATCH_THRESHOLD
      );

      // ------------------------------------------
      // Department
      // ------------------------------------------

      const finalDepartment = DEPARTMENTS.includes(aiValidation.department)
        ? aiValidation.department
        : "other";

      console.log("AI processing result:", {
        matched: aiValidation.matched,

        confidence: aiValidation.confidence,

        reason: aiValidation.reason,

        department: finalDepartment,

        humanreview,
      });

      // ------------------------------------------
      // Build image paths
      // ------------------------------------------

      const imagePaths = images.map((image) => image.path);

      // ------------------------------------------
      // Voice path
      // ------------------------------------------

      const voicePath = voiceNote ? voiceNote.path : null;

      // ------------------------------------------
      // Create MongoDB record
      // ------------------------------------------

      const complaint = await Complaint.create({
        images: imagePaths,

        voicepath: voicePath,

        department: finalDepartment,

        location: location?.trim() || null,

        latitude: latitudeNumber,

        longitude: longitudeNumber,

        accuracy: accuracyNumber,

        issueDescription: description || null,

        humanreview,

        aiValidation: {
          matched: aiValidation.matched,

          confidence: aiValidation.confidence,

          reason: aiValidation.reason,

          model: aiValidation.model,
        },

        solved: false,
      });

      // ------------------------------------------
      // Print data
      // ------------------------------------------

      console.log("\n========================================");

      console.log("        NEW NAGARSETU COMPLAINT");

      console.log("========================================");

      console.log("\nMongoDB complaint:");

      console.log(complaint);

      console.log("\nAI processing:");

      console.log({
        matched: aiValidation.matched,

        confidence: aiValidation.confidence,

        reason: aiValidation.reason,

        department: finalDepartment,

        humanreview,
      });

      console.log("\n========================================\n");

      // ------------------------------------------
      // Response
      // ------------------------------------------

      return res.status(201).json({
        success: true,

        message: "Complaint received",

        data: {
          id: complaint._id,

          location: complaint.location,

          latitude: complaint.latitude,

          longitude: complaint.longitude,

          accuracy: complaint.accuracy,

          issueDescription: complaint.issueDescription,

          images: complaint.images,

          voicepath: complaint.voicepath,

          department: complaint.department,

          humanreview: complaint.humanreview,

          aiValidation: complaint.aiValidation,

          solved: complaint.solved,

          createdAt: complaint.createdAt,
        },
      });
    } catch (error) {
      console.error("Complaint processing error:", error);

      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

async function startServer() {
  try {
    console.log("Connecting to Databases...");
    await mongoose.connect(
      process.env.MONGO_URL || "mongodb://localhost/invman",
    );
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup Error:", err);
    process.exit(1);
  }
}

startServer();
