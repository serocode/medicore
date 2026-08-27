import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  dts: false,
  // Bundle the workspace packages' TypeScript source directly so the
  // production output doesn't depend on them being pre-built.
  noExternal: ["@healthcare/dal", "@healthcare/domain", "@healthcare/application"],
});
