const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

__path = process.cwd();

// 👉 Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__path, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/qr', require('./qr'));
app.use('/code', require('./pair'));

// Specific HTML pages
app.use('/pair', (req, res) => {
  res.sendFile(path.join(__path, 'pair.html'));
});

app.use('/', (req, res) => {
  res.sendFile(path.join(__path, 'main.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

module.exports = app;
