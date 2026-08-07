// product.js

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    subCategory: { type: String, trim: true },

    price: { type: Number, required: true },

    weightKg: {
      type: Number,
      default: 0.5,
      min: 0.01,
      max: 50,
    },

    stock: { type: Number, required: true },
    details: { type: String },
    discount: { type: Number, default: 0 },

    images: {
      image1: { data: Buffer, contentType: String },
      image2: { data: Buffer, contentType: String },
      image3: { data: Buffer, contentType: String },
      image4: { data: Buffer, contentType: String },
      image5: { data: Buffer, contentType: String },
    },

    rating: {
      count: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
