import path from "node:path";
import url from "node:url";
import { defineBuildConfig } from "unbuild";
import pkg from "./package.json";

export default defineBuildConfig({
  entries: ["src/index"],
  outDir: "dist",
  declaration: true,
  clean: true,
  failOnWarn: false,
  externals: [
    ...Object.keys(pkg?.devDependencies || {}),
    ...Object.keys(pkg?.dependencies || {}),
  ],
  rollup: {
    inlineDependencies: false,
    esbuild: {
      target: "node16",
      minify: true,
    },
  },
});
