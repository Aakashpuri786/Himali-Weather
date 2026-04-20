import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins: PluginOption[] = [react(), tailwindcss()];
  try {
    const sourceTagsModulePath = new URL("./.vite-source-tags.js", import.meta.url).href;
    const module = (await import(sourceTagsModulePath)) as { sourceTags?: () => PluginOption };
    if (typeof module.sourceTags === "function") {
      plugins.push(module.sourceTags());
    }
  } catch {
    // Source tags are optional outside the generation environment.
  }
  return { plugins };
});
