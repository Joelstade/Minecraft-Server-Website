require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 443;
const SECRET = process.env.JWT_SECRET || "supersecretkey";

// --- Sanitize DEBUG_URL ---
if (process.env.DEBUG_URL) {
  try {
    const urlObj = new URL(process.env.DEBUG_URL);
    // Only keep the path component
    process.env.DEBUG_URL = urlObj.pathname.startsWith('/') ? urlObj.pathname : '/' + urlObj.pathname;
    console.log("[INFO] DEBUG_URL sanitized to path:", process.env.DEBUG_URL);
  } catch {
    // If not a full URL, leave as-is
    console.log("[INFO] DEBUG_URL left as-is:", process.env.DEBUG_URL);
  }
}

const USERS_FILE = path.resolve(__dirname, 'users.json');
const FILES_JSON = path.resolve(__dirname, 'files.json');
const DOWNLOADS_DIR = path.resolve(__dirname, 'public', 'downloads');

// --- Nodemailer ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- Rate limiter for login ---
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, try again later." }
});

// --- Helper functions ---
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
  } catch (err) {
    console.error("Error reading users.json:", err);
    return [];
  }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

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

// --- Routes ---
// Registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send({ message: 'Username and password required' });

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) return res.status(400).send({ 
    message: 'Password must include uppercase, lowercase, number, and symbol.' 
  });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const normalizedIp = ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;

  let users = readUsers();
  if (users.find(u => u.username === username)) return res.status(400).send({ message: 'Username exists' });
  if (users.find(u => u.ip === normalizedIp)) return res.status(400).send({ message: 'IP already registered' });

  const hashedPassword = bcrypt.hashSync(password, 12);
  users.push({ username, password: hashedPassword, active: false, ip: normalizedIp });
  writeUsers(users);

  const token = jwt.sign({ username }, SECRET, { expiresIn: '1d' });

  // Always use relative path for activation
  const activationLink = `/activate?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"Website Admin" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New user registration",
      text: `New user: ${username} from IP: ${normalizedIp}\nActivate: ${activationLink}`,
    });
  } catch (err) {
    console.error("Email failed:", err);
  }

  res.send({ message: 'Registration successful. Check admin email.' });
});

// Activation
app.get('/activate', (req, res) => {
  const { token } = req.query;
  if (!token) return res.send("Invalid activation link.");

  try {
    const decoded = jwt.verify(token, SECRET);
    let users = readUsers();
    const user = users.find(u => u.username === decoded.username);
    if (!user) return res.send("User not found.");
    user.active = true;
    writeUsers(users);
    res.send("User activated! You can now login.");
  } catch (err) {
    res.send("Activation link invalid or expired.");
  }
});

// Login
app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);

  if (!user) return res.status(401).send({ message: 'Invalid credentials' });
  if (!user.active) return res.status(403).send({ message: 'Account not activated' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).send({ message: 'Invalid credentials' });

  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.send({ token });
});

// Protected downloads
app.get('/download/:folder/:filename', authenticateToken, (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(DOWNLOADS_DIR, folder, filename);
  if (fs.existsSync(filePath)) return res.download(filePath);
  res.status(404).json({ message: 'File not found' });
});

// API: list files
app.get('/api/files', authenticateToken, (req, res) => {
  if (!fs.existsSync(FILES_JSON)) return res.json({});
  try {
    const data = JSON.parse(fs.readFileSync(FILES_JSON, 'utf8'));
    res.json(data);
  } catch (err) {
    console.error("Failed to read files.json:", err);
    res.status(500).json({});
  }
});

// --- SPA fallback ---
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/download/')) {
    return res.status(404).send({ message: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'layout.html'));
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));