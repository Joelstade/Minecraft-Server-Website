require('dotenv').config();
const express = require('express'); // <- must come first
const app = express(); // <- now express is defined
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

// --- Environment variables ---
const PORT = process.env.PORT || 443;
const SECRET = process.env.JWT_SECRET || "supersecretkey";
const DEBUG_PATH_RAW = process.env.DEBUG_PATH || "/debug";
const EMAIL_USER = process.env.EMAIL_USER || "example@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "changeme";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";



// --- Sanitize route ---
function sanitizeRoute(route) {
  if (!route) return "/debug";
  try {
    const urlObj = new URL(route);
    return urlObj.pathname.startsWith("/") ? urlObj.pathname : "/" + urlObj.pathname;
  } catch {
    // Remove characters that break path-to-regexp
    const safePath = route.replace(/[:?#]/g, "").trim();
    return safePath.startsWith("/") ? safePath : "/" + safePath;
  }
}

const DEBUG_PATH = sanitizeRoute(DEBUG_PATH_RAW);
console.log("[INFO] DEBUG_PATH used for route:", DEBUG_PATH);

// --- Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- Nodemailer ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// --- Rate limiter ---
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, try again later." }
});

// --- File paths ---
const USERS_FILE = path.resolve(__dirname, 'users.json');
const FILES_JSON = path.resolve(__dirname, 'files.json');
const DOWNLOADS_DIR = path.resolve(__dirname, 'public', 'downloads');

// --- Helper functions ---
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]'); }
  catch (err) { console.error("Error reading users.json:", err); return []; }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// --- Authentication ---
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  });
}

// --- Safe route registration ---
function safeGet(route, handler) {
  const safeRoute = sanitizeRoute(route);
  console.log("[INFO] Registering GET route:", safeRoute);
  app.get(safeRoute, handler);
}

function safePost(route, handler) {
  const safeRoute = sanitizeRoute(route);
  console.log("[INFO] Registering POST route:", safeRoute);
  app.post(safeRoute, handler);
}

// --- Routes ---

// Debug
safeGet(DEBUG_PATH, (req, res) => res.send("Debug route working!"));

// Registration
safePost("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send({ message: 'Username, email, and password are required' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).send({ message: 'Password must include uppercase, lowercase, number, and symbol.' });
  }

  let users = readUsers();
  if (users.find(u => u.username === username)) return res.status(400).send({ message: 'Username exists' });
  if (users.find(u => u.email === email)) return res.status(400).send({ message: 'Email already registered' });

  const hashedPassword = bcrypt.hashSync(password, 12);
  users.push({ username, email, password: hashedPassword, active: false });
  writeUsers(users);

  const token = jwt.sign({ username, email }, SECRET, { expiresIn: '1d' });
  const activationLink = `${req.protocol}://${req.get('host')}/activate?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"Website Admin" <${EMAIL_USER}>`,
      to: email,
      subject: "Activate Your Account",
      html: `<p>Hello ${username},</p>
             <p>Thank you for registering. Please activate your account by clicking the link below:</p>
             <p><a href="${activationLink}">${activationLink}</a></p>
             <p>This link will expire in 24 hours.</p>`
    });

    // Respond only after email is sent
    res.send({ 
      message: 'Registration successful. Please check your email to activate your account.', 
      success: true 
    });

  } catch (err) {
    console.error("Failed to send activation email:", err);
    return res.status(500).send({ message: 'Could not send activation email.' });
  }
});



// Activation
safeGet("/activate", (req, res) => {
  const { token } = req.query;
  if (!token) return res.send("Invalid activation link.");

  try {
    const decoded = jwt.verify(token, SECRET);
    let users = readUsers();
    const user = users.find(u => u.username === decoded.username && u.email === decoded.email);
    if (!user) return res.send("User not found.");
    if (user.active) return res.send("Account already activated.");

    user.active = true;
    writeUsers(users);
    res.send("Your account has been activated! You can now log in.");
  } catch (err) {
    console.error("Activation error:", err);
    res.send("Activation link invalid or expired.");
  }
});

// Login
safePost("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).send({ message: 'Invalid credentials' });
  if (!user.active) return res.status(403).send({ message: 'Account not activated' });
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.send({ token });
});

// Protected downloads
safeGet("/download/:folder/:filename", authenticateToken, (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(DOWNLOADS_DIR, folder, filename);
  if (fs.existsSync(filePath)) return res.download(filePath);
  res.status(404).json({ message: 'File not found' });
});

// API list files
safeGet("/api/files", authenticateToken, (req, res) => {
  if (!fs.existsSync(FILES_JSON)) return res.json({});
  try {
    const data = JSON.parse(fs.readFileSync(FILES_JSON, 'utf8'));
    res.json(data);
  } catch {
    res.status(500).json({});
  }
});

// SPA fallback (after all other routes)
app.use((req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/download/")) {
    return res.status(404).send({ message: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'layout.html'));
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));