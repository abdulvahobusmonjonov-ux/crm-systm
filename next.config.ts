import type { NextConfig } from "next";

// Stage (pipeline) + Group (guruh) qo'llab-quvvatlash qo'shildi
const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/adapter-pg", "pg"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
