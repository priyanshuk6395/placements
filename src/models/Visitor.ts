import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Visitor || mongoose.model('Visitor', VisitorSchema);