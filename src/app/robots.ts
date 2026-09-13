import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/health', '/api/ical/'],
        disallow: ['/admin/', '/api/admin/', '/api/auth/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/api/auth/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/api/auth/'],
      },
    ],
    sitemap: 'https://hotelsherpasoul.com/sitemap.xml',
    host: 'https://hotelsherpasoul.com',
  };
}
