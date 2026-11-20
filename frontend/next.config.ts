import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep repo free of auto-generated agent rule dumps.
  agentRules: false,
};

export default nextConfig;
