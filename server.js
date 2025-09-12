// server.js
//
require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json()); // parse JSON request bodies
app.use(cookieParser());  // parse cookies

// CORS for SPA if needed
app.use(cors({
  origin: 'http://localhost:3000', // change to your SPA origin
  credentials: true               // allow cookies to be sent
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'public', 'partials')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));

// Downloads routes
app.use('/downloads', require('./routes/downloads'));

// SPA fallback for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/partials')) return next();
  res.sendFile(path.join(__dirname, 'public', 'layout.html'));
});

// Start server
const PORT = process.env.PORT || 883;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Optional: database utilities
const { pool, printFilesTree } = require('./config/db');
printFilesTree();