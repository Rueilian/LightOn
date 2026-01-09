const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Data Schema
const dataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', dataSchema);

// API Routes

// POST /api/data - Save data from ESP32
app.post('/api/data', async (req, res) => {
  try {
    await connectDB();
    
    const { temperature, humidity } = req.body;
    
    if (temperature === undefined || humidity === undefined) {
      return res.status(400).json({ error: 'Missing temperature or humidity' });
    }
    
    const newData = new SensorData({ temperature, humidity });
    await newData.save();
    
    return res.status(200).json({ success: true, data: newData });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/latest - Get latest reading
app.get('/api/latest', async (req, res) => {
  try {
    await connectDB();
    const data = await SensorData.findOne().sort({ timestamp: -1 });
    return res.status(200).json(data || { temperature: 0, humidity: 0 });
  } catch (error) {
    console.error('Error fetching latest:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/history - Get last 100 readings
app.get('/api/history', async (req, res) => {
  try {
    await connectDB();
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Export the Express app for Vercel
module.exports = app;
