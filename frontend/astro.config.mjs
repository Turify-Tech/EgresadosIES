import { defineConfig } from "astro/config";

export default defineConfig({
    server: {
        port: 4321,
        host: true,
    },
    output: "server",
    build: {
        assets: "assets",
    },
    // Configuración para páginas dinámicas
    trailingSlash: "ignore",
});
