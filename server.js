const path = require('path');
const express = require('express');
const app = express();
app.use(express.json()); // <- REQUIRED to parse JSON body

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve partials under /partials
app.use('/', express.static(path.join(__dirname, 'public', 'partials')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/downloads', require('./routes/downloads'));

app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — only for "app routes" (exclude /api and /partials)
app.use((req, res, next) => {
  // If request starts with /api or /partials, skip this handler
  if (req.path.startsWith('/api') || req.path.startsWith('/partials')) return next();
  
  // Otherwise, serve the SPA layout
  res.sendFile(path.join(__dirname, 'public', 'layout.html'));
});

// Start server
const PORT = process.env.PORT || 883;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
