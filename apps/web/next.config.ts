import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@ppa/core", "@ppa/db", "@ppa/jobs", "@ppa/sources"],
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
