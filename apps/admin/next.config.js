/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@sierra/api", "@sierra/db", "@sierra/domain", "@sierra/shared"],
};

module.exports = nextConfig;
