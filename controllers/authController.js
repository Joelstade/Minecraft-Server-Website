// controllers/authController.js
// Handles user registration, account activation, and login (cookie-based JWT)

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const transporter = require('../utils/mailer');

const SECRET = process.env.JWT_SECRET || 'supersecretkey';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:supersecret@localhost:5432/app_db';
const pool = new Pool({ connectionString: DATABASE_URL });

// --- Registration ---
async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ success: false, message: 'Weak password' });
  }

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username=$1 OR email=$2',
      [username, email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    await pool.query(
      'INSERT INTO users(username,email,password,active) VALUES($1,$2,$3,$4)',
      [username, email, hashedPassword, false]
    );

    const token = jwt.sign({ username, email }, SECRET, { expiresIn: '1d' });
    const activationLink = `${req.protocol}://${req.get('host')}/api/auth/activate?token=${token}`;

    await transporter.sendMail({
      from: `"Website Admin" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New User Registration Activation",
      html: `<p>Hello Admin,</p>
             <p>New user <strong>${username}</strong> has registered with email <strong>${email}</strong>.</p>
             <p>Activate account: <a href="${activationLink}">${activationLink}</a></p>`
    });

    res.json({ success: true, message: 'Registration successful. Check your email.' });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// --- Activation ---
async function activate(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Missing token' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const userRes = await pool.query(
      'SELECT * FROM users WHERE username=$1 AND email=$2',
      [decoded.username, decoded.email]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRes.rows[0];
    if (user.active) return res.json({ success: true, message: 'Account already activated' });

    await pool.query('UPDATE users SET active=true WHERE id=$1', [user.id]);
    res.json({ success: true, message: 'Account activated successfully' });
  } catch (err) {
    console.error('[ACTIVATE] Error:', err);
    res.status(400).json({ success: false, message: 'Activation link invalid or expired' });
  }
}

// --- Login (cookie-based JWT, HTTPS only) ---
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (!userRes.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = userRes.rows[0];
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.active) return res.status(403).json({ success: false, message: 'Account not activated' });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET,
      { expiresIn: '12h' }
    );

    // Enforce HTTPS-only cookies in production
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,            // ✅ HTTPS-only
      sameSite: 'None',        // Required for cross-site cookies in HTTPS
      maxAge: 12 * 60 * 60 * 1000
    });

    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// --- Logout ---
async function logout(req, res) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
}

module.exports = { register, activate, login, logout };
