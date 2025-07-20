/** @type {import('next').NextConfig} */
// This comment is to force a re-read of the configuration.
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
        pathname: '/**',
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
      // Exclude Genkit's server-side dependencies from the client-side bundle
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
