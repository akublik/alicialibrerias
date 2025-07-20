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
    ],
  },
   webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push(
        '@opentelemetry/exporter-jaeger',
        '@opentelemetry/instrumentation-http',
        '@opentelemetry/instrumentation-grpc',
        '@opentelemetry/instrumentation-fs',
        'firebase-admin'
      );
    }
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
};

module.exports = nextConfig;
