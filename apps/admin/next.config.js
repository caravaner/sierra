const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Ensures shared workspace packages are included in the standalone bundle
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  transpilePackages: ["@sierra/api", "@sierra/auth", "@sierra/db", "@sierra/domain", "@sierra/logger", "@sierra/notifications", "@sierra/shared"],
};

module.exports = nextConfig;
