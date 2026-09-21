import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hotel Sherpa Soul | Thamel Kathmandu',
    short_name: 'Sherpa Soul',
    description: 'A tranquil sanctuary in Thamel, Kathmandu. No Restaurant. No Noise. Sleep Well. 6 clean rooms and shared kitchen.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#d97706',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
