import path from "node:path";
import { config } from "dotenv";
import { findRepoRoot } from "@ppa/db";

config({ path: path.join(findRepoRoot(), ".env") });
