/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'alicialectura.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/alicia-lee.firebasestorage.app/o/**',
      },
      {
        protocol: 'https',
        hostname: 'ejemplo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'canal.bibliomanager.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cardenasyabogados.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;