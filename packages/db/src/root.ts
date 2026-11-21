import fs from "node:fs";
import path from "node:path";

let cachedRoot: string | null = null;

/**
 * Encontra a raiz do monorepo subindo até achar `ppa.config.json`.
 * Funciona tanto rodando da web (apps/web), do worker (apps/worker)
 * quanto de scripts dentro de packages/*.
 */
export function findRepoRoot(start = process.cwd()): string {
  if (cachedRoot) return cachedRoot;
  let current = path.resolve(/*turbopackIgnore: true*/ start);
  for (let depth = 0; depth < 10; depth += 1) {
    if (fs.existsSync(path.join(current, "ppa.config.json"))) {
      cachedRoot = current;
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  cachedRoot = path.resolve(/*turbopackIgnore: true*/ start);
  return cachedRoot;
}
