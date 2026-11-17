import mongoose from 'mongoose';

const securityIncidentSchema = new mongoose.Schema(
  {
    incidentType: {
      type: String,
      default: 'OBSCENE_IMAGE_REVIEW',
      enum: ['OBSCENE_IMAGE_REVIEW', 'PROHIBITED_CONTENT', 'FOUL_LANGUAGE_ABUSE'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: { type: String, default: 'Anonymous / Guest' },
    userEmail: { type: String, default: 'Not provided' },
    ipAddress: { type: String, required: true, index: true },
    location: {
      country: { type: String, default: 'Unknown' },
      countryCode: { type: String, default: '' },
      region: { type: String, default: 'Unknown' },
      city: { type: String, default: 'Unknown' },
      zip: { type: String, default: '' },
      isp: { type: String, default: 'Unknown' },
      coordinates: {
        lat: Number,
        lon: Number,
      },
      timezone: String,
      raw: { type: mongoose.Schema.Types.Mixed },
    },
    userAgent: { type: String, default: '' },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    productName: { type: String, default: 'N/A' },
    reviewComment: { type: String, default: '' },
    reviewRating: { type: Number },
    flaggedImageUrl: { type: String },
    cloudinaryPublicId: { type: String },
    aiVerdict: { type: String, default: 'UNSAFE' },
    aiReason: { type: String, default: 'Image contains obscene, sexually explicit, or prohibited content.' },
    aiCategories: [{ type: String }],
    aiConfidence: { type: Number },
    aiModelUsed: { type: String, default: 'openrouter' },
    emailSentTo: { type: String, default: 'manjusatelier@gmail.com' },
    emailSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

securityIncidentSchema.index({ createdAt: -1 });

export default mongoose.model('SecurityIncident', securityIncidentSchema);
