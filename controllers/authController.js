const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const SECRET = process.env.JWT_SECRET || 'supersecretkey';
const EMAIL_USER = process.env.EMAIL_USER || 'example@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'changeme';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:supersecret@localhost:5432/app_db';

const pool = new Pool({ connectionString: DATABASE_URL });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// --- Registration ---
exports.register = async (req, res) => {
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
      from: `"Website Admin" <${EMAIL_USER}>`,
      to: email,
      subject: "Activate Your Account",
      html: `<p>Hello ${username},</p><p>Activate: <a href="${activationLink}">${activationLink}</a></p>`
    });

    res.json({ success: true, message: 'Registration successful. Check your email.' });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- Activation ---
exports.activate = async (req, res) => {
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
    if (user.active) {
      return res.json({ success: true, message: 'Account already activated' });
    }

    await pool.query('UPDATE users SET active=true WHERE id=$1', [user.id]);
    res.json({ success: true, message: 'Account activated successfully' });
  } catch (err) {
    console.error('[ACTIVATE] Error:', err);
    res.status(400).json({ success: false, message: 'Activation link invalid or expired' });
  }
};

// --- Login ---
exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (!userRes.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Account not activated' });
    }

    const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};