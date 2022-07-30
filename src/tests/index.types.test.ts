import { expectType } from "ts-expect";
import * as svgToImg from "../index";

describe("Return typing", () => {
  it("Has return type depending on options", () => {
    expectType<Promise<Buffer>>(svgToImg.from("data").to({}));
    expectType<Promise<Buffer>>(svgToImg.from("data").to({ type: "png" }));
    expectType<Promise<string>>(svgToImg.from("data").to({ type: "png", encoding: "base64" }));
    expectType<Promise<string>>(svgToImg.from("data").to({ type: "png", encoding: "utf8" }));
    expectType<Promise<string>>(svgToImg.from("data").to({ type: "png", encoding: "binary" }));
    expectType<Promise<string>>(svgToImg.from("data").to({ type: "png", encoding: "hex" }));

    expectType<Promise<Buffer>>(svgToImg.from("data").toPng());
    expectType<Promise<Buffer>>(svgToImg.from("data").toPng({ background: "#fff" }));
    expectType<Promise<string>>(svgToImg.from("data").toPng({ encoding: "base64" }));
    expectType<Promise<string>>(svgToImg.from("data").toPng({ encoding: "utf8" }));
    expectType<Promise<string>>(svgToImg.from("data").toPng({ encoding: "binary" }));
    expectType<Promise<string>>(svgToImg.from("data").toPng({ encoding: "hex" }));

    expectType<Promise<Buffer>>(svgToImg.from("data").toJpeg());
    expectType<Promise<Buffer>>(svgToImg.from("data").toJpeg({ background: "#fff" }));
    expectType<Promise<string>>(svgToImg.from("data").toJpeg({ encoding: "base64" }));
    expectType<Promise<string>>(svgToImg.from("data").toJpeg({ encoding: "utf8" }));
    expectType<Promise<string>>(svgToImg.from("data").toJpeg({ encoding: "binary" }));
    expectType<Promise<string>>(svgToImg.from("data").toJpeg({ encoding: "hex" }));

    expectType<Promise<Buffer>>(svgToImg.from("data").toWebp());
    expectType<Promise<Buffer>>(svgToImg.from("data").toWebp({ background: "#fff" }));
    expectType<Promise<string>>(svgToImg.from("data").toWebp({ encoding: "base64" }));
    expectType<Promise<string>>(svgToImg.from("data").toWebp({ encoding: "utf8" }));
    expectType<Promise<string>>(svgToImg.from("data").toWebp({ encoding: "binary" }));
    expectType<Promise<string>>(svgToImg.from("data").toWebp({ encoding: "hex" }));
  });
});
