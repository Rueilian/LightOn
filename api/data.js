import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        return mongoose;
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

const dataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.models.SensorData || mongoose.model('SensorData', dataSchema);

export default async function handler(req, res) {
  if (req.method === 'POST') {
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
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      await connectDB();
      const data = await SensorData.findOne().sort({ timestamp: -1 });
      return res.status(200).json(data || { temperature: 0, humidity: 0 });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
