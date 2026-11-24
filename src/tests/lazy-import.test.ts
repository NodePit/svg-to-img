import { describe, expect, test, vi } from "vitest";

// puppeteer-core is ESM-only: importing this library must not load it, otherwise CJS tooling (e.g. Jest in a consumer project)
// cannot import the library at all
const puppeteerCore = vi.hoisted(() => ({ loaded: false }));

vi.mock("puppeteer-core", () => {
  puppeteerCore.loaded = true;
  return {
    connect: () => {
      throw new Error("connect of the mocked puppeteer-core");
    }
  };
});

describe("Lazy loading of Puppeteer", () => {
  test("puppeteer-core is loaded when connecting, not when importing the library", async () => {
    const { connect } = await import("../index");

    expect(puppeteerCore.loaded).toBe(false);

    await expect(connect({ browserWSEndpoint: "ws://localhost:12345" }).from("<svg/>").toPng()).rejects.toThrow(
      "connect of the mocked puppeteer-core"
    );
    expect(puppeteerCore.loaded).toBe(true);
  });
});
