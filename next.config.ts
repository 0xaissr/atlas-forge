import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  devIndicators: false,
  basePath: isProd ? "/atlas-forge" : "",
  assetPrefix: isProd ? "/atlas-forge/" : "",
};

export default nextConfig;
