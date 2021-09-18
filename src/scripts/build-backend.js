/* eslint-disable no-console */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable promise/always-return */
const path = require("path");
const fs = require("fs")
const { build } = require("esbuild");

const root = path.resolve(__dirname, "..", "..");
const src = path.resolve(root, "src");

const inDir = path.resolve(src, "backend", "handlers");

build({
  entryPoints: fs.readdirSync(inDir)
                 .filter(fileName => !fileName.includes("spec"))
                 .map(fileName => path.resolve(inDir, fileName)),
  outdir: "backend",
  platform: "node",
  bundle: true,
  tsconfig: path.resolve(root, "tsconfig.json"),
  sourcemap: true,
})
  .then(() => {
    console.log("Successfully built backend");
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
