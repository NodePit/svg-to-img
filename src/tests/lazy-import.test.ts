// puppeteer-core is ESM-only: importing this library must not load it, otherwise CJS tooling (e.g. Jest) cannot import the library at all
jest.mock("puppeteer-core", () => {
  throw new Error("puppeteer-core was loaded when importing the library");
});

describe("Lazy loading of Puppeteer", () => {
  test("Importing the library does not load puppeteer-core", async () => {
    await expect(import("../index")).resolves.toBeDefined();
  });

  test("Connecting loads puppeteer-core", async () => {
    const { connect } = await import("../index");
    await expect(connect({ browserWSEndpoint: "ws://localhost:12345" }).from("<svg/>").toPng()).rejects.toThrow(
      "puppeteer-core was loaded"
    );
  });
});
