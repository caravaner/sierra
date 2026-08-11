const withPWA = require("@ducanh2912/next-pwa").default;
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Keeps pino out of the RSC bundle and traced into standalone output.
    // The webpack externals below are what actually fix dev — see the note there.
    serverComponentsExternalPackages: ["pino", "pino-pretty", "thread-stream"],
    // Ensures shared workspace packages are included in the standalone bundle
    outputFileTracingRoot: path.join(__dirname, "../../"),
    outputFileTracingIncludes: {
      "/**": [
        "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/*.node",
        "../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/*.node",
      ],
    },
  },
  transpilePackages: ["@sierra/api", "@sierra/auth", "@sierra/db", "@sierra/domain", "@sierra/logger", "@sierra/shared", "@sierra/notifications"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // @sierra/logger is transpiled, which drags pino into the server bundle
      // regardless of serverComponentsExternalPackages. Force it to stay a real
      // require() so thread-stream can find pino/lib/worker.js on disk.
      config.externals = [...config.externals, "pino", "pino-pretty", "thread-stream"];
    }
    return config;
  },
};

module.exports = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);
