import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: String,      // ← was ObjectId; now store the Firebase UID string
    required: true,
    unique: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  }
}, {
  timestamps: true
});

// find-or-create by string UID
cartSchema.statics.forUser = async function(uid) {
  let cart = await this.findOne({ user: uid });
  if (!cart) cart = await this.create({ user: uid });
  return cart;
};

export const Cart = mongoose.model('Cart', cartSchema);
