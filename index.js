// finance-api/index.js (Updated Auth Section)
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // <-- New
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'hackathon-super-secret-key'; // Keep this safe in prod!

// Add root level endpoint to identify API is running
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Personal Finance Tracker API is up and running!' });
});

// In-memory databases
let users = [{id: 1, username: 'admin', pin: '1234'}]; 
let transactions = [];

// --- AUTH ROUTE (The PIN System) ---
app.post('/api/auth/pin-login', (req, res) => {
  const { username, pin } = req.body;

  // Find user or create them (Lazy Registration for speed)
  let user = users.find(u => u.username === username);
  
  if (!user) {
    user = { id: Date.now().toString(), username, pin };
    users.push(user);
  } else if (user.pin !== pin) {
    return res.status(401).json({ error: 'Incorrect PIN.' });
  }

  // Generate the session token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, username: user.username });
});

// --- MIDDLEWARE (To protect your routes) ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
};

// --- PROTECTED ROUTES ---
app.get('/api/transactions', authenticate, (req, res) => {
  // Only return transactions for the logged-in user
  const userTx = transactions.filter(t => t.userId === req.userId);
  res.json(userTx);
});

app.post('/api/transactions', authenticate, (req, res) => {
  const { type, amount, category } = req.body;
  const newTx = { 
    id: Date.now(), 
    userId: req.userId, // Tie to the specific user
    type, 
    amount: Number(amount), 
    category, 
    date: new Date().toISOString() 
  };
  transactions.push(newTx);
  res.status(201).json(newTx);
});

// ... (Keep the AI Insights route here, but add the `authenticate` middleware to it) ...

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));