import mongoose from 'mongoose';

const PlacementSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "N/A" },
  enrollmentNo: { type: String, required: true },
  gender: { type: String, default: "" },
  branch: { type: String, default: "" },
  batchYear: { type: Number, required: true, index: true },
  company: { type: String, required: true },
  website: { type: String, lowercase: true, trim: true },
  logoData: { type: String, default: null },
  ctc: { type: Number, default: 0 }, // STRICTLY FOR LPA
  stipend: { type: Number, default: 0 }, // NEW: STRICTLY FOR MONTHLY STIPEND (e.g., 50000)
  offerType: { type: String, default: "Full-Time" },
  date: { type: String, default: "" },
  linkedin: { type: String, trim: true },
}, { timestamps: true });

PlacementSchema.index({ enrollmentNo: 1, company: 1, offerType: 1, batchYear: 1 }, { unique: true });

export default mongoose.models.Placement || mongoose.model('Placement', PlacementSchema);