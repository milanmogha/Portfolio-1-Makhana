// utils/compressExistingImages.js
// One-time migration script to compress all existing product images

import mongoose from 'mongoose';
import sharp from 'sharp';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

// Load environment variables
dotenv.config();

// Image compression function (same as in productController)
const compressImage = async (buffer, originalMimetype) => {
  try {
    const startSize = buffer.length;
    
    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 80,
        progressive: true
      })
      .toBuffer();
    
    const endSize = compressedBuffer.length;
    const reduction = ((1 - endSize / startSize) * 100).toFixed(1);
    
    return {
      data: compressedBuffer,
      contentType: 'image/jpeg',
      originalSize: startSize,
      compressedSize: endSize,
      reduction: reduction
    };
  } catch (err) {
    console.error('❌ Compression failed:', err.message);
    return null;
  }
};

const migrateImages = async () => {
  try {
    console.log('🚀 Starting image compression migration...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Fetch all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to process\n`);
    
    let totalProcessed = 0;
    let totalImagesCompressed = 0;
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let errors = 0;
    
    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n[${i + 1}/${products.length}] Processing: ${product.name}`);
      
      let productUpdated = false;
      const imageKeys = Object.keys(product.images || {});
      
      if (imageKeys.length === 0) {
        console.log('  ⏭️  No images to compress');
        continue;
      }
      
      // Compress each image in the product
      for (const key of imageKeys) {
        const image = product.images[key];
        
        if (!image || !image.data) {
          console.log(`  ⚠️  ${key}: No image data`);
          continue;
        }
        
        const originalSize = image.data.length;
        
        // Skip if already compressed (less than 300KB)
        if (originalSize < 300 * 1024) {
          console.log(`  ✓ ${key}: Already optimized (${(originalSize / 1024).toFixed(0)}KB)`);
          continue;
        }
        
        console.log(`  🔄 ${key}: Compressing ${(originalSize / 1024).toFixed(0)}KB...`);
        
        const compressed = await compressImage(image.data, image.contentType);
        
        if (compressed) {
          product.images[key] = {
            data: compressed.data,
            contentType: compressed.contentType
          };
          
          totalImagesCompressed++;
          totalOriginalSize += compressed.originalSize;
          totalCompressedSize += compressed.compressedSize;
          productUpdated = true;
          
          console.log(`  ✅ ${key}: ${(compressed.originalSize / 1024).toFixed(0)}KB → ${(compressed.compressedSize / 1024).toFixed(0)}KB (${compressed.reduction}% reduction)`);
        } else {
          errors++;
          console.log(`  ❌ ${key}: Compression failed`);
        }
      }
      
      // Save the product if any images were compressed
      if (productUpdated) {
        await product.save();
        totalProcessed++;
        console.log(`  💾 Saved product with compressed images`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Products processed: ${totalProcessed}`);
    console.log(`🖼️  Images compressed: ${totalImagesCompressed}`);
    console.log(`📉 Total size reduction: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`💾 Space saved: ${((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)}MB (${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)}%)`);
    if (errors > 0) {
      console.log(`⚠️  Errors: ${errors}`);
    }
    console.log('='.repeat(60));
    console.log('\n✨ Migration completed successfully!\n');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateImages();
