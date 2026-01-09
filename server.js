const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SIMPLE TEST
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => console.error('✗ MongoDB connection error:', err.message));

const dataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', dataSchema);

// API Routes
app.post('/api/data', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    const { temperature, humidity } = req.body;
    
    if (temperature === undefined || humidity === undefined) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    const data = new SensorData({ temperature, humidity });
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/latest', async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
