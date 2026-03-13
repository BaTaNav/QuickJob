const express = require("express");
const multer = require("multer");
const supabase = require("../supabaseClient");

const router = express.Router();

// Configure multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

/**
 * Sanitize folder name to prevent path traversal
 * Allows alphanumeric, hyphens, and underscores
 */
const sanitizeFolder = (folder) => {
  return folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100) || "general";
};

/**
 * Get file extension from mimetype
 */
const getFileExtension = (mimetype) => {
  const ext = mimetype.split("/")[1];
  return ext.split("+")[0]; // Handle image/svg+xml -> svg
};

/**
 * Generate unique filename
 */
const generateFilename = (folder, mimetype) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = getFileExtension(mimetype);
  return `${folder}/${timestamp}-${random}.${ext}`;
};

/**
 * POST / - Upload a single image
 * Query params:
 *   - folder: string (optional, defaults to "general")
 *
 * Request body (multipart/form-data):
 *   - file: File (required)
 *
 * Response:
 *   - { url: string } on success
 *   - { error: string } on failure
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    // Validate file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Get and sanitize folder from query params
    const folder = sanitizeFolder(req.query.folder || "general");

    // Generate unique filename
    const fileName = generateFilename(folder, req.file.mimetype);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload file" });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return res.status(500).json({ error: "Failed to generate public URL" });
    }

    res.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /multiple - Upload multiple images (up to 5)
 * Query params:
 *   - folder: string (optional, defaults to "general")
 *
 * Request body (multipart/form-data):
 *   - files: File[] (required, max 5 files)
 *
 * Response:
 *   - { urls: string[] } on success
 *   - { error: string } on failure
 */
router.post("/multiple", upload.array("files", 5), async (req, res) => {
  try {
    // Validate files exist
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    // Get and sanitize folder from query params
    const folder = sanitizeFolder(req.query.folder || "general");

    // Upload all files in parallel
    const uploadPromises = req.files.map(async (file) => {
      const fileName = generateFilename(folder, file.mimetype);

      const { data, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error("Failed to generate public URL");
      }

      return publicUrlData.publicUrl;
    });

    const urls = await Promise.all(uploadPromises);

    res.json({ urls });
  } catch (error) {
    console.error("Multiple upload error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 5MB limit" });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ error: "Maximum 5 files allowed per upload" });
    }
  }

  if (error.message && error.message.includes("Only image files")) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: "Upload processing error" });
});

module.exports = router;
