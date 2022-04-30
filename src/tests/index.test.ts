import * as fs from "fs";
import * as svgToImg from "../index";
import { md5 } from "./helpers";
import * as rimraf from "rimraf";
import { imageSize as sizeOf } from "image-size";

const inputDir = "./src/tests/svg";
const outputDir = "./src/tests/img";
const svgBuffer = fs.readFileSync(`${inputDir}/camera.svg`);
const responsiveSvgBuffer = fs.readFileSync(`${inputDir}/logo.svg`);
const svgString = svgBuffer.toString("utf8");

// Create output directory
rimraf.sync(outputDir);
fs.mkdirSync(outputDir);

describe("SVG to image conversion", () => {
  test("From buffer to image", async () => {
    const data = await svgToImg.from(svgBuffer).to({
      type: "jpeg"
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "jpg",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("15d5786c3cc17ea65c3395e4e8bb4c89");
  });

  test("From string to image", async () => {
    const data = await svgToImg.from(svgString).to({
      type: "png"
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("b56c81f63a1acbe9e6dcdb206cdaa303");
  });

  test("Infer file type from file extension", async () => {
    await svgToImg.from(svgBuffer).to({
      path: `${outputDir}/image.jpg`
    });

    const data = fs.readFileSync(`${outputDir}/image.jpg`);

    expect(sizeOf(data as Buffer)).toEqual({
      type: "jpg",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("15d5786c3cc17ea65c3395e4e8bb4c89");
  });

  test("Unknown file extension", async () => {
    await svgToImg.from(svgBuffer).to({
      path: `${outputDir}/image.ext`
    });

    const data = fs.readFileSync(`${outputDir}/image.ext`);

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("b56c81f63a1acbe9e6dcdb206cdaa303");
  });

  test("Base64 encoded output", async () => {
    const data = await svgToImg.from(svgString).to({
      encoding: "base64"
    });

    expect(sizeOf(Buffer.from(data as string, "base64"))).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("b22da35f06e4395767255420c2a728f5");
  });

  test("HEX encoded output", async () => {
    const data = await svgToImg.from(svgString).to({
      encoding: "hex"
    });

    expect(sizeOf(Buffer.from(data as string, "hex"))).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("2209366f76a0525ee80ad1e398d6ecef");
  });

  test("JPEG compression", async () => {
    const data = await svgToImg.from(svgBuffer).toJpeg({
      quality: 0
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "jpg",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("06330f402fc4de97f8ed8f3cf36858ce");
  });

  test("WEBP compression", async () => {
    const data = await svgToImg.from(svgBuffer).toWebp({
      quality: 0
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "webp",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("6a3128451d839873bb879a5d60dceadb");
  });

  test("Custom width and height", async () => {
    const data = await svgToImg.from(svgString).to({
      width: 1000,
      height: 200
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 1000,
      height: 200
    });
    expect(md5(data)).toEqual("366e806f0de059e2902d596c65e15802");
  });

  test("Custom background color", async () => {
    const data = await svgToImg.from(svgString).to({
      background: "#09f"
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 406,
      height: 206
    });
    expect(md5(data)).toEqual("108367216847e82bef4dbde253a4eb72");
  });

  test("Malformed SVG", async () => {
    try {
      await svgToImg.from("THIS IS NO SVG").to({
        type: "png"
      });
    } catch (error) {
      expect((error as Error).message).toContain("Error: Malformed SVG");
    }
  });

  test("Responsive SVG (Infer natural dimensions)", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toPng();

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 187,
      height: 150
    });
    expect(md5(data)).toEqual("db1db547760095778783534aae8b4c2b");
  });

  test("Resize responsive SVG (Squashed)", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).to({
      width: 300,
      height: 100
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 300,
      height: 100
    });
    expect(md5(data)).toEqual("3f3af77da9e3c9766fbe79b95d75f93a");
  });

  test("Resize responsive SVG (Proportionally)", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).to({
      width: 300
    });

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 300,
      height: 241
    });
    expect(md5(data)).toEqual("816946f0558723d854dfd25f3b48f0db");
  });

  test("SVG to PNG shorthand", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toPng();

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 187,
      height: 150
    });
    expect(md5(data)).toEqual("db1db547760095778783534aae8b4c2b");
  });

  test("SVG to JPEG shorthand", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toJpeg();

    expect(sizeOf(data as Buffer)).toEqual({
      type: "jpg",
      width: 187,
      height: 150
    });
    fs.writeFileSync(`${outputDir}/da0a53cd944c1fbd56a64684969882cd.jpg`, data as Buffer);
    expect(md5(data)).toEqual("930d1b440fca8b379fdffe739823faf8");
  });

  test("SVG to WEBP shorthand", async () => {
    const data = await svgToImg.from(responsiveSvgBuffer).toWebp();

    expect(sizeOf(data as Buffer)).toEqual({
      type: "webp",
      width: 187,
      height: 150
    });
    expect(md5(data)).toEqual("78412b578f437f9ac8d27c76366d2c38");
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

    expect(sizeOf(data as Buffer)).toEqual({
      type: "png",
      width: 100,
      height: 100
    });
    expect(md5(data)).toEqual("4cc87ea04e80b3701c47ca1e78aa413a");
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
    } catch (error) {
      fail();
    }
  });
});

// Kill any remaining Chromium instances
// pkill -f Chromium
