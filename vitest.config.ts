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
  ],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
