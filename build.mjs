import { build } from "esbuild";
import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, "dist");

await mkdir(distDir, { recursive: true });

await build({
    entryPoints: [resolve(__dirname, "src/main.ts")],
    outfile: resolve(distDir, "app.js"),
    bundle: true,
    format: "iife",
    target: "es2020",
    minify: true,
    sourcemap: false,
    logLevel: "info"
});

await cp(resolve(__dirname, "src/index.html"), resolve(distDir, "index.html"));
await cp(resolve(__dirname, "src/styles.css"), resolve(distDir, "styles.css"));

console.log("Build completed: dist/index.html");
