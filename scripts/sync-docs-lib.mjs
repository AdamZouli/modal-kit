import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsLib = path.join(root, "docs", "public", "lib");

const packages = [
  { name: "core", file: "index.js" },
  { name: "ui", file: "index.js", alsoCss: true },
  { name: "web-components", file: "index.js" }
];

for (const pkg of packages) {
  const src = path.join(root, "packages", pkg.name, "dist", "index.js");
  const destDir = path.join(docsLib, pkg.name);
  fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(src)) {
    console.warn(`skip ${pkg.name}: missing ${src} (run npm run build first)`);
    continue;
  }
  fs.copyFileSync(src, path.join(destDir, pkg.file));
  console.log(`synced ${pkg.name}`);
  if (pkg.alsoCss) {
    const cssSrc = path.join(root, "packages", "ui", "styles.css");
    fs.copyFileSync(cssSrc, path.join(root, "docs", "public", "examples", "styles.css"));
    console.log("synced ui styles.css -> docs/public/examples/styles.css");
  }
}
