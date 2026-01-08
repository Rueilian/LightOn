const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => console.error('✗ MongoDB connection error:', err.message));

// Data Schema
const dataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', dataSchema);

// API Routes

// Get latest data
app.get('/api/latest', async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(data || { temperature: 0, humidity: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all historical data
app.get('/api/history', async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save new data (called by ESP32)
app.post('/api/data', async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    const newData = new SensorData({ temperature, humidity });
    await newData.save();
    res.json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌐 Server running on port ${PORT}`);
  console.log(`📡 From Windows: Use your Windows IP (e.g., 192.168.x.x:${PORT})`);
  console.log(`   Find it with: ipconfig (in Windows PowerShell)`);
  console.log(`📊 Dashboard: http://YOUR_WINDOWS_IP:${PORT}`);
  console.log(`📡 ESP32 endpoint: http://YOUR_WINDOWS_IP:${PORT}/api/data\n`);
});
