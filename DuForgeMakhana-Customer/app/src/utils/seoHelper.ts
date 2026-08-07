// src/utils/seoHelper.ts

export const generateProductSchema = (product: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.details,
    image: product.imageUrl || product.image,
    price: product.price.toString(),
    priceCurrency: 'INR',
    aggregateRating: product.rating && {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average?.toString() || '4.5',
      reviewCount: product.rating.count?.toString() || '0',
    },
    availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Makhana E-Store',
    },
  };
};

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export const generateLocalBusinessSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Makhana E-Store',
    image: 'https://makhanahealthking.com/web-app-manifest-512x512.png',
    description: 'Premium quality makhana (fox nuts) and healthy snacks online store',
    url: 'https://makhanahealthking.com',
    telephone: '[your-phone-number]',
    email: '[your-email]',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '[Your Street Address]',
      addressLocality: '[Your City]',
      addressRegion: '[Your State]',
      postalCode: '[Your Postal Code]',
      addressCountry: 'IN',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '21:00',
    },
    sameAs: [
      'https://www.facebook.com/makhanahealthking',
      'https://www.instagram.com/makhanahealthking',
      'https://www.twitter.com/makhanahealthking',
    ],
  };
};

export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};
