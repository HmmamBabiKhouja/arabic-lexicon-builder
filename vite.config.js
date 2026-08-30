import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    root: ".",

    build: {
        outDir: "www",
        emptyOutDir: true
    },

    server: {
        host: "0.0.0.0",
        port: 5500
    }
});