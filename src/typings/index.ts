export interface IBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IOptions {
  path?: string;
  type?: "jpeg" | "png" | "webp";
  quality?: number;
  width?: number;
  height?: number;
  clip?: IBoundingBox;
  background?: string;
  encoding?: "base64" | "utf8" | "binary" | "hex";
  timeout?: number;
}

export interface IShorthandOptions extends IOptions {
  type?: never;
}

export interface IConnectOptions {
  browserWSEndpoint?: string;
  browserURL?: string;
  /**
   * @deprecated Has no effect: Puppeteer 25 does not know this option. The SVG is rendered offline, from a data URL, so
   * no HTTPS errors occur either.
   */
  ignoreHTTPSErrors?: boolean;
}
