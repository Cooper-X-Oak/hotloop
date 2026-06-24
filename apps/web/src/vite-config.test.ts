import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config.js";

describe("web dev server config", () => {
  it("proxies API requests to the local HotLoop server", () => {
    const config = viteConfig as {
      server?: {
        proxy?: Record<string, unknown>;
      };
    };

    expect(config.server?.proxy?.["/api"]).toEqual({
      target: "http://127.0.0.1:8787",
      changeOrigin: true
    });
  });
});
