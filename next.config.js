/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'alicialectura.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'ejemplo.com',
      },
      {
        protocol: 'http',
        hostname: 'canal.bibliomanager.com',
      },
      {
        protocol: 'https',
        hostname: 'cardenasyabogados.com',
      },
      {
        protocol: 'https',
        hostname: 'digitalwayltda.com',
      },
       {
        protocol: 'http',
        hostname: 'digitalwayltda.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
};

module.exports = nextConfig;
