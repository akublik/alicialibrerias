/** @type {import('next').NextConfig} */
// Added a comment to force re-reading the config file
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
      {
        hostname: 'digitalwayltda.com',
        port: '',
        pathname: '/**',
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
