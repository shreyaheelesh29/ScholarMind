import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Match Uvicorn's default IPv4 bind address on Windows. Using `localhost`
      // can resolve to ::1 while the backend is only listening on 127.0.0.1.
      "/api": "http://127.0.0.1:8000",
    },
  },
});
