import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
const path = require("path");
import { loadEnv } from "vite";

import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    vue(),
    vueJsx(),
    // legacy({
    //   targets: ["defaults", "not IE 11"],
    // }),
    {
      ...legacy({
        targets: ["defaults", "not IE 11"],
      }),
      apply: "build",
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  // server: {
  //   port: 3000,
  //   proxy: {
  //     '/api': {
  //       target: 'http://lelebk.com/api',
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/api/, '')
  //     }
  //   }
  // }
});
