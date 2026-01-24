/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Enable SharedArrayBuffer for FFmpeg.wasm multi-threading
        // BUT use credentialless mode to allow YouTube iframes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            // Use 'credentialless' instead of 'require-corp' to allow YouTube iframes
            // This still enables SharedArrayBuffer but is more permissive
            value: 'credentialless',
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
