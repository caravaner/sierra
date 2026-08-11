const withPWA = require("@ducanh2912/next-pwa").default;
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
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
};

module.exports = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);
