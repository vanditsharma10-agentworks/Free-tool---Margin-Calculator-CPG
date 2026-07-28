const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output keeps the Docker image lean when we containerize the web service.
  output: "standalone",
  // Pin the workspace root to THIS project. A stray lockfile in a parent dir
  // (e.g. ~/package-lock.json) otherwise makes Next infer the wrong root.
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
