import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 30 * 1000,
  use: {
    headless: true,
    baseURL: "http://localhost:3000",
    viewport: { width: 1300, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm start",
      cwd: "../backend",
      port: 5001,
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
    {
      command: "npm run build && npm run preview",
      port: 3000,
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
  ],
});
