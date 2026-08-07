import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema({
  user: {
    type: String, // Firebase UID
    required: true,
    unique: true, // Each user has only one wishlist document
    ref: 'User'
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Helper to find-or-create a wishlist for a user
WishlistSchema.statics.forUser = async function(uid) {
  let wishlist = await this.findOne({ user: uid });
  if (!wishlist) {
    wishlist = await this.create({ user: uid, items: [] });
  }
  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', WishlistSchema);
export default Wishlist;