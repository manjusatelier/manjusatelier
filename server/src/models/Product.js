import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    images: [{ type: String, required: true }],
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true }],
    material: { type: String, trim: true },
    dimensions: { type: String, trim: true },
    careInstructions: { type: String, trim: true },
    color: { type: String, trim: true },
    includedInBox: [{ type: String, trim: true }],
    packageNote: { type: String, trim: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    tags: [{ type: String, trim: true }],
    badges: [{ type: String, enum: ['New', 'Sale', 'Limited', 'Handmade'] }],
    featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Final price after discount
productSchema.virtual('finalPrice').get(function finalPrice() {
  return Math.round(this.price * (1 - this.discount / 100));
});

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

export default mongoose.model('Product', productSchema);
