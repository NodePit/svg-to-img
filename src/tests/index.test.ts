import * as fs from "fs";
import * as svgToImg from "../index";
import { PNG } from "pngjs";
import { imageSize as sizeOf } from "image-size";

const inputDir = "./src/tests/svg";
const outputDir = "./src/tests/img";
const svgBuffer = fs.readFileSync(`${inputDir}/camera.svg`);
const responsiveSvgBuffer = fs.readFileSync(`${inputDir}/logo.svg`);
const svgString = svgBuffer.toString("utf8");

// Exact bytes depend on the Chrome version and platform, so check pixels instead of hashes
const pixel = (png: Buffer, x: number, y: number) => {
  const { data, width } = PNG.sync.read(png);
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};

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
    try {
      await svgToImg.from("THIS IS NO SVG").to({
        type: "png"
      });
    } catch (error) {
      expect((error as Error).message).toContain("Malformed SVG");
    }
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
    await svgToImg.from(responsiveSvgBuffer).toJpeg();

    return new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
  });

  test("Test multiple requests in parallel", async () => {
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
    try {
      await convert.from("<svg xmlns='http://www.w3.org/2000/svg'/>").toPng();
      fail();
    } catch (error) {
      expect((error as Error).message).toContain("ECONNREFUSED");
    }
  });

  test("Propagates error when cannot connect with subsequent attempts", async () => {
    const convert = svgToImg.connect({ browserWSEndpoint: "ws://localhost:12345" });
    let errors = 0;
    for (let i = 0; i < 10; i++) {
      try {
        await convert.from("<svg xmlns='http://www.w3.org/2000/svg'/>").toPng();
        fail();
      } catch (error) {
        expect((error as Error).message).toContain("ECONNREFUSED");
        errors++;
      }
    }
    expect(errors).toBe(10);
  });

  test("Special character encoding", async () => {
    try {
      await svgToImg.from("<svg xmlns='http://www.w3.org/2000/svg'><text x='0' y='0'>äöüÄÖÜçéèñ</text></svg>").toPng();
    } catch {
      fail();
    }
  });
});

// Kill any remaining Chromium instances
// pkill -f Chromium
