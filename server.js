require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS for SPA
app.use(cors({
  origin: ['https://create.scienceontheweb.net'], // use HTTPS only
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/routeDownloads', require('./routes/routeDownloads'));

// SPA fallback
app.get(['/downloads', '/register', '/home'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'layout.html'));
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/partials')) return next();
  res.sendFile(path.join(__dirname, 'public', 'layout.html'));
});

// HTTPS server
const httpsOptions = {
  key: fs.readFileSync('/certs/privkey.pem'),
  cert: fs.readFileSync('/certs/fullchain.pem')
};

https.createServer(httpsOptions, app).listen(443, () => {
  console.log('✅ HTTPS server running on port 443');
});

// HTTP → HTTPS redirect
const httpApp = express();
httpApp.use((req, res) => {
  const host = req.headers.host.replace(/:\d+$/, '');
  res.redirect(`https://${host}${req.url}`);
});
http.createServer(httpApp).listen(80, () => {
  console.log('➡️ HTTP redirecting to HTTPS on port 80');
});

// Optional: database utilities
const { pool, printFilesTree } = require('./config/db');
printFilesTree();