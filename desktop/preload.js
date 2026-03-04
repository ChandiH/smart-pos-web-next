// Preload script — exposes a minimal, safe API to the renderer
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("smartPOS", {
  platform: process.platform,
  isDesktop: true,
});
