import mongoose from 'mongoose';

// NOTE: previously `type`, `applicableCategories` and `applicableProducts`
// were passed as extra arguments to the Schema constructor, so Mongoose
// silently dropped them (FREE_SHIPPING coupons could never work). They now
// live in the single schema definition where they belong.
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    heading: { type: String, required: true },
    description: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 },

    // Users (user ids) who have already redeemed this coupon
    usedBy: [{ type: String }],

    // If a coupon is invisible, only assignedTo can use it.
    assignedTo: { type: String, default: null },

    // if true → show publicly. if false → only assignedTo can call apply.
    visible: { type: Boolean, default: true },

    type: {
      type: String,
      enum: ['DISCOUNT', 'FREE_SHIPPING'],
      default: 'DISCOUNT'
    },

    applicableCategories: {
      type: [String],
      default: []
    },
    applicableProducts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Product',
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Coupon', couponSchema);
