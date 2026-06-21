import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // @peculiar/x509 -> tsyringe needs the reflect-metadata polyfill,
    // which the app loads from main.tsx.
    setupFiles: ["reflect-metadata"]
  }
});
