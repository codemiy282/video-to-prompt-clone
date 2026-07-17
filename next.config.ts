import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate a minimal, production-ready standalone server for Docker.
  // See https://nextjs.org/docs/app/getting-started/deploying#docker
  output: "standalone",
};

export default nextConfig;
