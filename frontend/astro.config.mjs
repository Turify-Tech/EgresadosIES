import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
    server: {
        port: 4321,
        host: true,
    },
    output: "server",
    adapter: vercel(),
    build: {
        assets: "assets",
    },
    // Configuración para páginas dinámicas
    trailingSlash: "ignore",
});
