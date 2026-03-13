const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();
const supabase = require("../supabaseClient");
const {
  validateEmail,
  validatePassword,
  validatePhone,
  validateIBAN,
  validateDateOfBirth,
  sanitizeString,
} = require("../middleware/validators");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + "-refresh";

// ── Helper: generate tokens ──────────────────────────────────
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" } // Short-lived access token
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: "30d" }
  );
}

// Root
router.get("/", (req, res) => {
  res.json({ message: "Auth API" });
});

// ── POST /auth/register/student ──────────────────────────────
router.post("/register/student", async (req, res) => {
  try {
    const {
      email, password, first_name, last_name, phone,
      school_name, field_of_study, academic_year,
      date_of_birth, iban, profile_image,
      student_card_front, student_card_back,
    } = req.body || {};

    // ── Validate all inputs ────────────────────────────────
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.error });

    const passCheck = validatePassword(password);
    if (!passCheck.valid) return res.status(400).json({ error: passCheck.error });

    if (!first_name || !last_name || first_name.trim().length < 1 || last_name.trim().length < 1) {
      return res.status(400).json({ error: "First name and last name are required" });
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) return res.status(400).json({ error: phoneCheck.error });

    const dobCheck = validateDateOfBirth(date_of_birth);
    if (!dobCheck.valid) return res.status(400).json({ error: dobCheck.error });

    if (!school_name || school_name.trim().length < 2) {
      return res.status(400).json({ error: "School name is required" });
    }

    const ibanCheck = validateIBAN(iban);
    if (!ibanCheck.valid) return res.status(400).json({ error: ibanCheck.error });

    // Sanitize text inputs
    const cleanFirst = sanitizeString(first_name);
    const cleanLast = sanitizeString(last_name);
    const cleanSchool = sanitizeString(school_name);
    const cleanField = field_of_study ? sanitizeString(field_of_study) : null;
    const cleanYear = academic_year ? sanitizeString(academic_year) : null;
    const cleanEmail = email.trim().toLowerCase();

    // ── Check existing user ────────────────────────────────
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      return res.status(500).json({ error: "Database error" });
    }
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // ── Hash password ──────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Create user ────────────────────────────────────────
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{
        email: cleanEmail,
        password_hash: hashedPassword,
        role: "student",
        phone: phone.replace(/\s/g, ""),
        created_at: new Date().toISOString(),
      }])
      .select("id, email, role")
      .single();

    if (insertError) {
      console.error("Registration insert error:", insertError);
      return res.status(500).json({ error: "Registration failed" });
    }

    // ── Create student profile ─────────────────────────────
    const { error: profileError } = await supabase
      .from("student_profiles")
      .insert([{
        id: newUser.id,
        first_name: cleanFirst,
        last_name: cleanLast,
        date_of_birth: date_of_birth,
        school_name: cleanSchool,
        field_of_study: cleanField,
        academic_year: cleanYear,
        iban: iban.replace(/\s/g, "").toUpperCase(),
        avatar_url: profile_image || null,
        verification_status: "pending",
      }]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // ── Store student card documents ───────────────────────
    const docInserts = [];
    if (student_card_front) {
      docInserts.push({ student_id: newUser.id, document_type: "student_card_front", file_url: student_card_front });
    }
    if (student_card_back) {
      docInserts.push({ student_id: newUser.id, document_type: "student_card_back", file_url: student_card_back });
    }
    if (docInserts.length > 0) {
      const { error: docError } = await supabase.from("student_documents").insert(docInserts);
      if (docError) console.error("Student document upload error:", docError);
    }

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    return res.status(201).json({
      message: "Student registered successfully",
      user: newUser,
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /auth/register/client ───────────────────────────────
router.post("/register/client", async (req, res) => {
  try {
    const { email, password, fullName, phone, preferred_language } = req.body || {};

    // ── Validate ───────────────────────────────────────────
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.error });

    const passCheck = validatePassword(password);
    if (!passCheck.valid) return res.status(400).json({ error: passCheck.error });

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: "Full name is required" });
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) return res.status(400).json({ error: phoneCheck.error });

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeString(fullName);

    // ── Check existing user ────────────────────────────────
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      return res.status(500).json({ error: "Database error" });
    }
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const allowedLangs = ["nl", "fr", "en"];
    const lang = allowedLangs.includes(preferred_language) ? preferred_language : "nl";

    // ── Create user ────────────────────────────────────────
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{
        email: cleanEmail,
        password_hash: hashedPassword,
        role: "client",
        phone: phone.replace(/\s/g, ""),
        preferred_language: lang,
        created_at: new Date().toISOString(),
      }])
      .select("id, email, role")
      .single();

    if (insertError) {
      console.error("Client registration error:", insertError);
      return res.status(500).json({ error: "Registration failed" });
    }

    // ── Create client profile ──────────────────────────────
    const parts = cleanName.trim().split(/\s+/);
    const first_name = parts[0] || null;
    const last_name = parts.slice(1).join(" ") || null;

    const { error: profileError } = await supabase
      .from("client_profiles")
      .insert([{ id: newUser.id, first_name, last_name }]);

    if (profileError) {
      console.error("Client profile creation error:", profileError);
    }

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    return res.status(201).json({
      message: "Client registered successfully",
      user: newUser,
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Client register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /auth/login ─────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, password_hash, is_active")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("Login lookup error:", error);
      return res.status(500).json({ error: "Login failed" });
    }

    // Use constant-time comparison message to prevent user enumeration
    if (!user) {
      // Hash a dummy password to prevent timing attacks
      await bcrypt.hash("dummy-timing-equalization", 12);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last_login_at
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    const { password_hash, is_active, ...userWithoutPassword } = user;
    const accessToken = generateAccessToken(userWithoutPassword);
    const refreshToken = generateRefreshToken(userWithoutPassword);

    return res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /auth/refresh ───────────────────────────────────────
// Exchange a refresh token for a new access token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    if (decoded.type !== "refresh") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    // Fetch fresh user data
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, is_active")
      .eq("id", decoded.id)
      .maybeSingle();

    if (error || !user || user.is_active === false) {
      return res.status(401).json({ error: "User not found or deactivated" });
    }

    const { is_active, ...userData } = user;
    const newAccessToken = generateAccessToken(userData);

    return res.json({ token: newAccessToken, user: userData });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token expired, please login again" });
    }
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ── GET /auth/me ─────────────────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, is_active")
      .eq("id", decoded.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const { is_active, ...userData } = user;
    return res.json({ user: userData });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ── POST /auth/forgot-password ───────────────────────────────
// Generates a password reset token and stores it in the DB
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Always return success to prevent user enumeration
    const successMsg = "If an account with that email exists, a reset link has been sent.";

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error || !user) {
      return res.json({ message: successMsg });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store in password_resets table (or user record)
    // Using a simple approach: store in a separate table
    await supabase.from("password_resets").upsert({
      user_id: user.id,
      token_hash: resetTokenHash,
      expires_at: expiresAt,
      used: false,
    }, { onConflict: "user_id" });

    // In production, send email with reset link
    // For now, log the token (remove in production)
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Password reset token for ${cleanEmail}: ${resetToken}`);
    }

    // TODO: Integrate email service (SendGrid, Mailgun, etc.)
    // await sendResetEmail(cleanEmail, resetToken);

    return res.json({ message: successMsg });
  } catch (err) {
    console.error("Forgot password error:", err);
    // Still return success to prevent enumeration
    return res.json({ message: "If an account with that email exists, a reset link has been sent." });
  }
});

// ── POST /auth/reset-password ────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) return res.status(400).json({ error: passCheck.error });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const { data: resetRecord, error: resetError } = await supabase
      .from("password_resets")
      .select("user_id, expires_at, used")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (resetError || !resetRecord) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: "Reset token already used" });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", resetRecord.user_id);

    // Mark token as used
    await supabase
      .from("password_resets")
      .update({ used: true })
      .eq("user_id", resetRecord.user_id);

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// ── POST /auth/change-password ───────────────────────────────
// For logged-in users to change their password
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const tokenStr = authHeader.split(" ")[1];
    const decoded = jwt.verify(tokenStr, JWT_SECRET);

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) return res.status(400).json({ error: passCheck.error });

    // Fetch user
    const { data: user, error } = await supabase
      .from("users")
      .select("id, password_hash")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", user.id);

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    console.error("Change password error:", err);
    res.status(500).json({ error: "Password change failed" });
  }
});

module.exports = router;
