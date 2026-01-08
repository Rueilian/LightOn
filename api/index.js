const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
if (!global.mongooseConnected) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('✓ Connected to MongoDB');
      global.mongooseConnected = true;
    })
    .catch(err => console.error('✗ MongoDB connection error:', err.message));
}

// Data Schema
const dataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', dataSchema);

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

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
    
    if (temperature === undefined || humidity === undefined) {
      return res.status(400).json({ error: 'Missing temperature or humidity' });
    }
    
    const newData = new SensorData({ temperature, humidity });
    await newData.save();
    
    res.status(200).json({ success: true, data: newData });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
