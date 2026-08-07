// Central helper for product imagery (redesign Phase 1.5).
// Products now arrive with `imageUrls` (streamed, cacheable media route).
// Legacy base64 `images` is supported as a fallback so the UI keeps working
// against an un-upgraded backend.

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/').replace(/\/$/, '');

type LegacyImage = { contentType?: string; data?: string };
export type ProductImageSource = {
  _id?: string;
  imageUrls?: Record<string, string>;
  images?: Record<string, LegacyImage | undefined>;
};

const KEYS = ['image1', 'image2', 'image3', 'image4', 'image5'] as const;
export type ImageKey = (typeof KEYS)[number];
export type ThumbWidth = 200 | 400 | 800;

/** Absolute URL for one product image, or null if absent. */
export const productImageUrl = (
  product: ProductImageSource | null | undefined,
  key: ImageKey = 'image1',
  width?: ThumbWidth,
): string | null => {
  if (!product) return null;

  const path = product.imageUrls?.[key];
  if (path) {
    const url = path.startsWith('http') ? path : `${API_URL}${path}`;
    return width ? `${url}?w=${width}` : url;
  }

  // Legacy base64 fallback
  const legacy = product.images?.[key];
  if (legacy?.data) {
    return `data:${legacy.contentType || 'image/jpeg'};base64,${legacy.data}`;
  }
  return null;
};

/** First available image (products may not populate image1 first). */
export const firstProductImage = (
  product: ProductImageSource | null | undefined,
  width?: ThumbWidth,
): string | null => {
  if (!product) return null;
  for (const key of KEYS) {
    const url = productImageUrl(product, key, width);
    if (url) return url;
  }
  return null;
};

/**
 * Thumbnail for cart/wishlist/order rows. Those endpoints populate products
 * without `imageUrls`, but the media route is deterministic from `_id`, so we
 * construct the URL directly. Pair with an <img onError> placeholder fallback.
 */
export const productThumbUrl = (
  product: ProductImageSource | null | undefined,
  width: ThumbWidth = 200,
): string | null => {
  if (!product) return null;
  const direct = firstProductImage(product, width);
  if (direct && !direct.startsWith('data:')) return direct;
  if (product._id) return `${API_URL}/images/products/${product._id}/image1?w=${width}`;
  return direct; // legacy base64 or null
};

/** All available image URLs, in gallery order. */
export const allProductImages = (
  product: ProductImageSource | null | undefined,
  width?: ThumbWidth,
): string[] =>
  KEYS.map((k) => productImageUrl(product, k, width)).filter((u): u is string => Boolean(u));
