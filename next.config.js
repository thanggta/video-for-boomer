/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Enable SharedArrayBuffer for FFmpeg.wasm multi-threading
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Suppress webpack warning for dynamic expressions in ffmpeg.wasm
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;
