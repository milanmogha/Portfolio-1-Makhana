export const getProductImage = (product) => {
  // 1. Try to get the Base64 image from the database buffer
  if (product?.images?.image1?.data) {
    return `data:${product.images.image1.contentType};base64,${product.images.image1.data}`;
  }
  
  // 2. Fallback: Try a direct URL if it exists (for future Cloudinary use)
  if (product?.imageUrl) {
    return product.imageUrl;
  }

  // 3. Last Resort: Return a placeholder
  return "https://placehold.co/400x400?text=No+Image";
};