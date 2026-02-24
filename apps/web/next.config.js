const withPWA = require("@ducanh2912/next-pwa").default;
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Ensures shared workspace packages are included in the standalone bundle
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  transpilePackages: ["@sierra/api", "@sierra/db", "@sierra/domain", "@sierra/shared"],
};

module.exports = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);
