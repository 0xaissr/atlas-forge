import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/atlas-forge" : "";

const nextConfig: NextConfig = {
  output: "export",
  devIndicators: false,
  basePath,
  assetPrefix: isProd ? "/atlas-forge/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
