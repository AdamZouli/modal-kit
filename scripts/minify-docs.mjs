import path from "node:path";
import fs from "fs-extra";
import CleanCSS from "clean-css";
import { minify as minifyHtml } from "html-minifier-terser";
import { minify as minifyJs } from "terser";

const distDir = path.resolve("docs/.vitepress/dist");
const cleanCss = new CleanCSS({ level: 2 });

async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function minifyFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".map" || ext === ".json") {
    return;
  }

  const source = await fs.readFile(filePath, "utf8");

  if (ext === ".html") {
    const result = await minifyHtml(source, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true
    });
    await fs.writeFile(filePath, result, "utf8");
    return;
  }

  if (ext === ".css") {
    const result = cleanCss.minify(source);
    if (result.styles) {
      await fs.writeFile(filePath, result.styles, "utf8");
    }
    return;
  }

  if (ext === ".js") {
    const result = await minifyJs(source, {
      compress: true,
      mangle: true,
      format: { comments: false }
    });
    if (result.code) {
      await fs.writeFile(filePath, result.code, "utf8");
    }
  }
}

async function main() {
  if (!(await fs.pathExists(distDir))) {
    console.error(`Docs dist not found at ${distDir}. Run docs:build first.`);
    process.exit(1);
  }

  const files = await walkDir(distDir);
  for (const filePath of files) {
    await minifyFile(filePath);
  }
}

await main();
