import mongoose from 'mongoose';

const TrafficLogSchema = new mongoose.Schema({
  ip: { type: String, required: true, index: true },
  country: { type: String, default: "Unknown" },
  region: { type: String, default: "Unknown" },
  city: { type: String, default: "Unknown" },
  path: { type: String, required: true },
  userAgent: { type: String, default: "Unknown" },
  duration: { type: Number, default: 0 }, // Session duration in seconds
  timestamp: { type: Date, default: Date.now, index: true }
});

// TTL Index to automatically clean logs after 90 days to prevent DB bloat
TrafficLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.models.TrafficLog || mongoose.model('TrafficLog', TrafficLogSchema);