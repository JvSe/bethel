import "@bethel/env/web";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
};

export default nextConfig;

if (process.env.NODE_ENV !== "production") {
  void initOpenNextCloudflareForDev();
}
