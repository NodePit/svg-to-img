import * as fs from "node:fs";
import puppeteer, { type Browser } from "puppeteer";
import { describe, expect, test } from "vitest";
import * as svgToImg from "../index";
import { config } from "../constants";
import { PNG } from "pngjs";
import { imageSize as sizeOf } from "image-size";

const inputDir = "./src/tests/svg";
const outputDir = "./src/tests/img";
const svgBuffer = fs.readFileSync(`${inputDir}/camera.svg`);
const responsiveSvgBuffer = fs.readFileSync(`${inputDir}/logo.svg`);
const svgString = svgBuffer.toString("utf8");

// Exact bytes depend on the Chrome version and platform, so check pixels instead of hashes
function pixel(png: Buffer, x: number, y: number) {
  const { data, width } = PNG.sync.read(png);
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

// Create output directory
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir);

describe("SVG to image conversion", () => {
  test("From buffer to image", async () => {
    const data = await svgToImg.from(svgBuffer).to({
      type: "jpeg"
    });

    expect(sizeOf(data)).toEqual({
      type: "jpg",
      width: 406,
      height: 206
    });
  });

  test("From string to image", async () => {
    const data = await svgToImg.from(svgString).to({
      type: "png"
    });

    // transparent background, but the camera is drawn
    expect(pixel(data, 0, 0)[3]).toBe(0);
    expect(PNG.sync.read(data).data.some((value, i) => i % 4 === 3 && value > 0)).toBe(true);

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
  });

  test("Infer file type from file extension", async () => {
    await svgToImg.from(svgBuffer).to({
      path: `${outputDir}/image.jpg`
    });

    const data = fs.readFileSync(`${outputDir}/image.jpg`);

    expect(sizeOf(data)).toEqual({
      type: "jpg",
      width: 406,
      height: 206
    });
  });

  test("Path which cannot be written", async () => {
    await expect(
      svgToImg.from(svgBuffer).to({
        path: `${outputDir}/missing-directory/image.png`
      })
    ).rejects.toThrow("ENOENT");
  });

  test("Unknown file extension", async () => {
    await svgToImg.from(svgBuffer).to({
      path: `${outputDir}/image.ext`
    });

    const data = fs.readFileSync(`${outputDir}/image.ext`);

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
  });

  test("Base64 encoded output", async () => {
    const data = await svgToImg.from(svgString).to({
      encoding: "base64"
    });

    expect(sizeOf(Buffer.from(data, "base64"))).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
  });

  test("HEX encoded output", async () => {
    const data = await svgToImg.from(svgString).to({
      encoding: "hex"
    });

    expect(sizeOf(Buffer.from(data, "hex"))).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
  });

  test("JPEG compression", async () => {
    const data = await svgToImg.from(svgBuffer).toJpeg({
      quality: 0
    });

    expect(sizeOf(data)).toEqual({
      type: "jpg",
      width: 406,
      height: 206
    });
  });

  test("WEBP compression", async () => {
    const data = await svgToImg.from(svgBuffer).toWebp({
      quality: 0
    });

    expect(sizeOf(data)).toEqual({
      type: "webp",
      width: 406,
      height: 206
    });
  });

  test("Custom width and height", async () => {
    const data = await svgToImg.from(svgString).to({
      width: 1000,
      height: 200
    });

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 1000,
      height: 200
    });
  });

  test("Custom background color", async () => {
    const data = await svgToImg.from(svgString).to({
      background: "#09f"
    });

    expect(pixel(data, 0, 0)).toEqual([0, 153, 255, 255]);

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
  });

  test("Malformed SVG", async () => {
    await expect(
      svgToImg.from("THIS IS NO SVG").to({
        type: "png"
      })
    ).rejects.toThrow("Malformed SVG");
  });

  test("Responsive SVG (Infer natural dimensions)", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toPng();

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 187,
      height: 150
    });
  });

  test("Resize responsive SVG (Squashed)", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).to({
      width: 300,
      height: 100
    });

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 300,
      height: 100
    });
  });

  test("Resize responsive SVG (Proportionally)", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).to({
      width: 300
    });

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 300,
      height: 241
    });
  });

  test("SVG to PNG shorthand", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toPng();

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 187,
      height: 150
    });
  });

  test("SVG to JPEG shorthand", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toJpeg();

    expect(sizeOf(data)).toEqual({
      type: "jpg",
      width: 187,
      height: 150
    });
    fs.writeFileSync(`${outputDir}/da0a53cd944c1fbd56a64684969882cd.jpg`, data);
  });

  test("SVG to WEBP shorthand", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toWebp();

    expect(sizeOf(data)).toEqual({
      type: "webp",
      width: 187,
      height: 150
    });
  });

  test("Clip the image", async () => {
    const data = await svgToImg.from(svgBuffer).toPng({
      clip: {
        x: 10,
        y: 10,
        width: 100,
        height: 100
      }
    });

    expect(sizeOf(data)).toEqual({
      type: "png",
      width: 100,
      height: 100
    });
  });

  test("Wait for browser destruction", async () => {
    await expect(svgToImg.from(responsiveSvgBuffer).toJpeg()).resolves.toBeInstanceOf(Buffer);

    await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
  });

  test("Multiple requests in a row", async () => {
    let errors = 0;

    for (let i = 0; i < 10; i++) {
      try {
        await svgToImg.from("<svg xmlns='http://www.w3.org/2000/svg'/>").toPng();
      } catch (error) {
        console.log(error);
        errors++;
      }
    }

    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    expect(errors).toBe(0);
  });

  test("Propagates error when cannot connect", async () => {
    const convert = svgToImg.connect({ browserWSEndpoint: "ws://localhost:12345" });
    await expect(convert.from("<svg xmlns='http://www.w3.org/2000/svg'/>").toPng()).rejects.toThrow("ECONNREFUSED");
  });

  test("Propagates error when cannot connect with subsequent attempts", async () => {
    const convert = svgToImg.connect({ browserWSEndpoint: "ws://localhost:12345" });
    for (let i = 0; i < 10; i++) {
      await expect(convert.from("<svg xmlns='http://www.w3.org/2000/svg'/>").toPng()).rejects.toThrow("ECONNREFUSED");
    }
  });

  test("Browser without an open page", async () => {
    const browserSource = new svgToImg.BrowserSource(async () => {
      // the arguments `from` launches with, which a CI runner without a user namespace sandbox needs
      const browser = await puppeteer.launch(config.puppeteer);
      for (const page of await browser.pages()) {
        await page.close();
      }
      return browser;
    });
    const data = await new svgToImg.SvgToImg(browserSource)
      .from("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>")
      .toPng();

    expect(sizeOf(data)).toEqual({ type: "png", width: 10, height: 10 });
  });

  test("Browser which disconnects is replaced", async () => {
    const browsers: Browser[] = [];
    const browserSource = new svgToImg.BrowserSource(async () => {
      const browser = await puppeteer.launch(config.puppeteer);
      browsers.push(browser);
      return browser;
    });
    const convert = new svgToImg.SvgToImg(browserSource);
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>";

    await convert.from(svg).toPng();
    const disconnected = new Promise((resolve) => browsers[0]!.once("disconnected", resolve));
    browsers[0]!.process()!.kill("SIGKILL");
    await disconnected;
    const data = await convert.from(svg).toPng();

    expect(sizeOf(data)).toEqual({ type: "png", width: 10, height: 10 });
    expect(browsers).toHaveLength(2);
  });

  test("Browser closed when idle does not mark the next browser closed", async () => {
    const browsers: Browser[] = [];
    let launches = 0;
    let firstDisconnected: Promise<unknown> = Promise.resolve();
    const browserSource = new svgToImg.BrowserSource(async () => {
      launches++;
      // the second browser is still opening when the first one disconnects
      await firstDisconnected;
      const browser = await puppeteer.launch(config.puppeteer);
      browsers.push(browser);
      return browser;
    });
    const convert = new svgToImg.SvgToImg(browserSource);
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>";

    await convert.from(svg).toPng();
    const firstBrowser = browsers[0]!;
    firstDisconnected = new Promise((resolve) => firstBrowser.once("disconnected", resolve));
    const close = firstBrowser.close.bind(firstBrowser);
    const closing = new Promise<void>((resolve) => {
      firstBrowser.close = () => {
        resolve();
        return close();
      };
    });
    await closing;
    const second = convert.from(svg).toPng();
    await firstDisconnected;
    const third = convert.from(svg).toPng();
    await Promise.all([second, third]);

    expect(launches).toBe(2);
  });

  test("Browser is not closed while another conversion still uses it", async () => {
    const browserSource = new svgToImg.BrowserSource(() => puppeteer.launch(config.puppeteer));
    // stands in for a conversion which is still running
    const browser = await browserSource.getBrowser();

    await new svgToImg.SvgToImg(browserSource).from("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>").toPng();
    // well over the 500 ms after which an idle browser is closed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(browser.connected).toBe(true);
    browserSource.scheduleBrowserForDestruction();
    await expect.poll(() => browser.connected, { timeout: 2000 }).toBe(false);
  });

  test("Browser is closed after a failed conversion", async () => {
    const browsers: Browser[] = [];
    const browserSource = new svgToImg.BrowserSource(async () => {
      const browser = await puppeteer.launch(config.puppeteer);
      browsers.push(browser);
      return browser;
    });

    await expect(new svgToImg.SvgToImg(browserSource).from("<svg").toPng()).rejects.toThrow("Malformed SVG");

    expect(browsers[0]!.connected).toBe(true);
    await expect.poll(() => browsers[0]!.connected, { timeout: 2000 }).toBe(false);
  });

  test("Idle browser is passed to release", async () => {
    const released: Browser[] = [];
    const browserSource = new svgToImg.BrowserSource(
      () => puppeteer.launch(config.puppeteer),
      async (browser) => {
        released.push(browser);
        await browser.close();
      }
    );
    const browser = await browserSource.getBrowser();

    browserSource.scheduleBrowserForDestruction();

    expect(released).toHaveLength(0);
    await expect.poll(() => released.length, { timeout: 2000 }).toBe(1);
    expect(released[0]).toBe(browser);
  });

  test("Release which rejects does not end the process", async () => {
    const browserSource = new svgToImg.BrowserSource(
      () => puppeteer.launch(config.puppeteer),
      async (browser) => {
        await browser.close();
        throw new Error("Release failed");
      }
    );
    const browser = await browserSource.getBrowser();

    browserSource.scheduleBrowserForDestruction();

    await expect.poll(() => browser.connected, { timeout: 2000 }).toBe(false);
    // an unhandled rejection is reported once the microtasks after the release ran
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test("Browser reached with connect stays open when idle", async () => {
    const remote = await puppeteer.launch(config.puppeteer);
    try {
      const convert = svgToImg.connect({ browserWSEndpoint: remote.wsEndpoint() });
      await convert.from("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>").toPng();
      // the idle browser is let go of after 500 ms
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(remote.connected).toBe(true);
      expect(await remote.version()).toMatch(/Chrome/);
    } finally {
      await remote.close();
    }
  });

  test("Special character encoding", async () => {
    await expect(
      svgToImg.from("<svg xmlns='http://www.w3.org/2000/svg'><text x='0' y='0'>äöüÄÖÜçéèñ</text></svg>").toPng()
    ).resolves.toBeInstanceOf(Buffer);
  });

  test("SVG with text which looks like code", async () => {
    // a backtick broke the code which runs in the browser, and a `${…}` ran in it
    const data = await svgToImg
      .from("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><text>`a` ${notDefined} ä</text></svg>")
      .toPng();

    expect(sizeOf(data)).toEqual({ type: "png", width: 10, height: 10 });
  });
});

// Kill any remaining Chromium instances
// pkill -f Chromium
