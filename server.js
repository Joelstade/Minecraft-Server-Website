require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const fs = require('fs');

// --- Environment variables ---
const PORT = process.env.PORT || 883;
const SECRET = process.env.JWT_SECRET || "supersecretkey";
const EMAIL_USER = process.env.EMAIL_USER || "example@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "changeme";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:supersecret@localhost:5432/app_db";
const DOWNLOADS_DIR = path.resolve(__dirname, 'public', 'downloads');

// --- Postgres pool ---
const pool = new Pool({ connectionString: DATABASE_URL });

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// --- Authentication middleware ---
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  });
}

// --- API Routes (must come BEFORE static middleware) ---

// Debug
app.get("/api/debug", (req, res) => res.json({ message: "Debug route working!" }));

// Registration
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  console.log('[REGISTER] Incoming request:', { username, email });

  if (!username || !email || !password) {
    console.warn('[REGISTER] Missing fields:', { username, email, password });
    return res.status(400).json({ message: 'Missing fields' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    console.warn('[REGISTER] Weak password for user:', username);
    return res.status(400).json({ message: 'Weak password' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (userExists.rows.length > 0) {
      console.warn('[REGISTER] Username or email exists:', { username, email });
      return res.status(400).json({ message: 'Username or email exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    await pool.query(
      'INSERT INTO users(username,email,password,active) VALUES($1,$2,$3,$4)',
      [username, email, hashedPassword, false]
    );

    const token = jwt.sign({ username, email }, SECRET, { expiresIn: '1d' });
    const activationLink = `${req.protocol}://${req.get('host')}/activate?token=${token}`;
    console.log('[REGISTER] User created. Sending activation email:', activationLink);

    await transporter.sendMail({
      from: `"Website Admin" <${EMAIL_USER}>`,
      to: email,
      subject: "Activate Your Account",
      html: `<p>Hello ${username},</p><p>Activate: <a href="${activationLink}">${activationLink}</a></p>`
    });

    console.log('[REGISTER] Registration successful for user:', username);
    res.json({ message: 'Registration successful. Check your email.', success: true });
  } catch (err) {
    console.error('[REGISTER] Registration failed:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Activation
app.get("/activate", async (req, res) => {
  const { token } = req.query;
  console.log('[ACTIVATE] Incoming token:', token);

  if (!token) {
    console.warn('[ACTIVATE] Missing token');
    return res.send("Invalid activation link.");
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    console.log('[ACTIVATE] Token decoded:', decoded);

    const userRes = await pool.query(
      'SELECT * FROM users WHERE username=$1 AND email=$2',
      [decoded.username, decoded.email]
    );

    if (!userRes.rows.length) {
      console.warn('[ACTIVATE] User not found for token:', decoded);
      return res.send("User not found");
    }

    const user = userRes.rows[0];
    if (user.active) {
      console.info('[ACTIVATE] Account already activated:', user.username);
      return res.send("Account already activated");
    }

    await pool.query('UPDATE users SET active=true WHERE id=$1', [user.id]);
    console.log('[ACTIVATE] Account activated for user:', user.username);
    res.send("Account activated! You can now log in.");
  } catch (err) {
    console.error('[ACTIVATE] Activation failed:', err);
    res.send("Activation link invalid or expired.");
  }
});

// Login
app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  console.log('[LOGIN] Incoming request for user:', username);

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (!userRes.rows.length) {
      console.warn('[LOGIN] Invalid credentials for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    if (!bcrypt.compareSync(password, user.password)) {
      console.warn('[LOGIN] Password mismatch for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.active) {
      console.warn('[LOGIN] Account not activated for user:', username);
      return res.status(403).json({ message: 'Account not activated' });
    }

    const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
    console.log('[LOGIN] Login successful for user:', username);
    res.json({ token });
  } catch (err) {
    console.error('[LOGIN] Login failed:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get("/downloads", authenticateToken, (req, res) => {
  const folder = req.query.folder;
  const name = req.query.name;

  // Validate
  if (!folder || !name) return res.status(400).json({ message: 'Missing folder or filename' });

  const filePath = path.join(DOWNLOADS_DIR, folder, name);
  if (fs.existsSync(filePath)) return res.download(filePath);

  res.status(404).json({ message: 'File not found' });
});

// Files API with logging
app.get("/api/files", authenticateToken, async (req, res) => {
  console.log('[API FILES] Fetching files for user:', req.user?.username);
  try {
    const result = await pool.query("SELECT id, folder, name, uploaded_at FROM files ORDER BY id DESC");
    console.log('[API FILES] Retrieved rows:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('[API FILES] Failed to fetch files:', err);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
});

// SPA fallback logging
app.get("/", (req, res) => {
  console.log('[FALLBACK] Incoming path:', req.path);
  if (req.path.startsWith("/api/") || req.path.startsWith("/layout")) {
    console.warn('[FALLBACK] Not found for path:', req.path);
    return res.status(404).json({ message: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'layout.html'));
});


// --- Static middleware (after API routes) ---
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
