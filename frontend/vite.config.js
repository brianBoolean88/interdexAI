import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  server: {
    proxy: {
      // forward any request starting with /api to the Flask backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // keep the /api prefix when forwarding
      },
    },
  },
});
