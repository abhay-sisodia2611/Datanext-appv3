import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      "bc805573-7ce6-49bd-8b35-32db6f8e4b58-00-20x57cpiaiia1.sisko.replit.dev"
    ]
  }
});
