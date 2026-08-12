import { readFile } from "node:fs/promises";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "sql-as-text",
      enforce: "pre",
      async load(id) {
        if (!id.endsWith(".sql")) return null;
        const content = await readFile(id, "utf8");
        return `export default ${JSON.stringify(content)};`;
      },
    },
    {
      // wrangler resolves these via module rules (Text for .txt, Data for
      // .wasm); vitest can't execute the emscripten loader source, so stub
      // them out.
      name: "sqljs-assets-stub",
      enforce: "pre",
      resolveId(id) {
        if (id.endsWith("/sql-wasm.js.txt") || id.endsWith("sql.js/dist/sql-wasm.wasm")) {
          return "\0" + id;
        }
        return null;
      },
      load(id) {
        if (id.endsWith("/sql-wasm.js.txt")) {
          return "export default '/* stubbed sql-wasm.js */';";
        }
        if (id.endsWith("sql.js/dist/sql-wasm.wasm")) {
          return "export default new ArrayBuffer(0);";
        }
        return null;
      },
    },
  ],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
