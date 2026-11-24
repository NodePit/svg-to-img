import { IOptions } from "./typings";

export const config = {
  supportedImageTypes: ["jpeg", "png", "webp"],
  jpegBackground: "#fff",
  // milliseconds a conversion may take to render, unless the `timeout` option says otherwise
  timeout: 30_000,
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
};

export const defaultOptions: IOptions = {
  quality: 1,
  type: "png"
};

export const defaultPngShorthandOptions: IOptions = {
  type: "png"
};

export const defaultJpegShorthandOptions: IOptions = {
  type: "jpeg"
};

export const defaultWebpShorthandOptions: IOptions = {
  type: "webp"
};
