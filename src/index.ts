/// <reference types="node" preserve="true" />
import { connect as connectToBrowser } from "puppeteer-core";
// puppeteer-core is ESM-only: the resolution mode lets the CJS declarations import it under node16 resolution
import type * as puppeteer from "puppeteer-core" with { "resolution-mode": "import" };
import { getFileTypeFromPath, renderSvg, stringifyFunction, writeFileAsync } from "./helpers";
import { config, defaultOptions, defaultPngShorthandOptions, defaultJpegShorthandOptions, defaultWebpShorthandOptions } from "./constants";
import { IOptions, IShorthandOptions, IConnectOptions } from "./typings";

export class BrowserSource {
  private queue: Array<(result: puppeteer.Browser) => void> = [];
  private browserDestructionTimeout: NodeJS.Timeout | undefined;
  private browserInstance: puppeteer.Browser | undefined;
  private browserState: "closed" | "opening" | "open" = "closed";

  constructor(private readonly factory: () => Promise<puppeteer.Browser>) {}

  public async getBrowser(): Promise<puppeteer.Browser> {
    return new Promise((resolve: (result: puppeteer.Browser) => void, reject: (err: unknown) => void) => {
      /* istanbul ignore if */
      if (this.browserDestructionTimeout) {
        clearTimeout(this.browserDestructionTimeout);
      }

      /* istanbul ignore else */
      if (this.browserState === "closed") {
        // Browser is closed
        this.queue.push(resolve);
        this.browserState = "opening";
        this.factory()
          .then((browserInstance) => {
            this.browserInstance = browserInstance;
            this.browserState = "open";

            this.executeQueuedRequests(this.browserInstance);
          })
          .catch((error) => {
            this.browserState = "closed";
            reject(unwrapConnectionError(error));
          });

        return;
      }

      /* istanbul ignore next */
      if (this.browserState === "opening") {
        // Queue request and wait for the browser to open
        return this.queue.push(resolve);
      }

      /* istanbul ignore next */
      if (this.browserState === "open") {
        // Browser is already open
        if (this.browserInstance) {
          return resolve(this.browserInstance);
        }
      }
    });
  }

  public scheduleBrowserForDestruction() {
    /* istanbul ignore if */
    if (this.browserDestructionTimeout) {
      clearTimeout(this.browserDestructionTimeout);
    }
    this.browserDestructionTimeout = global.setTimeout(async () => {
      /* istanbul ignore next */
      if (this.browserInstance) {
        this.browserState = "closed";
        await this.browserInstance.close();
      }
    }, 500);
  }

  private executeQueuedRequests(browser: puppeteer.Browser) {
    for (const resolve of this.queue) {
      resolve(browser);
    }
    // Clear items from the queue
    this.queue.length = 0;
  }
}

export class Svg {
  constructor(
    private readonly svg: Buffer | string,
    private browserSource: BrowserSource
  ) {}

  public async to(options: Omit<IOptions, "encoding">): Promise<Buffer>;
  public async to(options: IOptions): Promise<string>;
  public async to(options: IOptions): Promise<Buffer | string> {
    return this.convertSvg(this.svg, options, this.browserSource);
  }

  public async toPng(options?: Omit<IShorthandOptions, "encoding">): Promise<Buffer>;
  public async toPng(options?: IShorthandOptions): Promise<string>;
  public async toPng(options?: IShorthandOptions): Promise<Buffer | string> {
    return this.convertSvg(this.svg, { ...defaultPngShorthandOptions, ...options }, this.browserSource);
  }

  public async toJpeg(options?: Omit<IShorthandOptions, "encoding">): Promise<Buffer>;
  public async toJpeg(options?: IShorthandOptions): Promise<string>;
  public async toJpeg(options?: IShorthandOptions): Promise<Buffer | string> {
    return this.convertSvg(this.svg, { ...defaultJpegShorthandOptions, ...options }, this.browserSource);
  }

  public async toWebp(options?: Omit<IShorthandOptions, "encoding">): Promise<Buffer>;
  public async toWebp(options?: IShorthandOptions): Promise<string>;
  public async toWebp(options?: IShorthandOptions): Promise<Buffer | string> {
    return this.convertSvg(this.svg, { ...defaultWebpShorthandOptions, ...options }, this.browserSource);
  }

  private async convertSvg(
    inputSvg: Buffer | string,
    passedOptions: Omit<IOptions, "encoding">,
    browserSource: BrowserSource
  ): Promise<Buffer>;
  private async convertSvg(inputSvg: Buffer | string, passedOptions: IOptions, browserSource: BrowserSource): Promise<string>;
  private async convertSvg(inputSvg: Buffer | string, passedOptions: IOptions, browserSource: BrowserSource): Promise<Buffer | string> {
    const svg = Buffer.isBuffer(inputSvg) ? (inputSvg as Buffer).toString("utf8") : inputSvg;
    const options = { ...defaultOptions, ...passedOptions };
    const browser = await browserSource.getBrowser();
    const page = (await browser.pages())[0];

    // ⚠️ Offline mode is enabled to prevent any HTTP requests over the network
    await page.setOfflineMode(true);

    // Infer the file type from the file path if no type is provided
    if (!passedOptions.type && options.path) {
      const fileType = getFileTypeFromPath(options.path);

      if (config.supportedImageTypes.includes(fileType)) {
        options.type = fileType as IOptions["type"];
      }
    }

    const base64 = (await page.evaluate(
      stringifyFunction(renderSvg, svg, {
        width: options.width,
        height: options.height,
        type: options.type,
        quality: options.quality,
        background: options.background,
        clip: options.clip,
        jpegBackground: config.jpegBackground
      })
    )) as string;

    browserSource.scheduleBrowserForDestruction();

    const buffer = Buffer.from(base64, "base64");

    if (options.path) {
      await writeFileAsync(options.path, buffer);
    }

    if (options.encoding === "base64") {
      return base64;
    }

    if (!options.encoding) {
      return buffer;
    }

    return buffer.toString(options.encoding);
  }
}

// Puppeteer 25 rejects a failed connection with an `ErrorEvent` wrapping Node's `AggregateError` (one error per
// resolved address), which has an empty message
/* istanbul ignore next */
const unwrapConnectionError = (error: unknown) => {
  const cause = (error as { error?: unknown } | undefined)?.error ?? error;
  const { message, errors, code } = cause as { message?: string; errors?: Error[]; code?: string };
  if (message || !Array.isArray(errors)) return cause;
  return Object.assign(new Error(errors.map((e) => e.message).join("; "), { cause }), { code });
};

export class SvgToImg {
  constructor(private readonly browserSource: BrowserSource) {}
  public from(svg: Buffer | string) {
    return new Svg(svg, this.browserSource);
  }
}

const defaultBrowserSource = new BrowserSource(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const puppeteerFull = require("puppeteer");

    return puppeteerFull.launch(config.puppeteer);
  } catch {
    /* istanbul ignore next */
    throw new Error(
      "NPM module `puppeteer` is not available. Either add it as " +
        " dependency to your project, or use the `connect` function and supply " +
        "`browserWSEndpoint` if you want to use a running Puppeteer endpoint."
    );
  }
});

export const from = (svg: Buffer | string) => {
  return new SvgToImg(defaultBrowserSource).from(svg);
};

/* istanbul ignore next */
export const connect = (options: IConnectOptions) => {
  return new SvgToImg(new BrowserSource(async () => connectToBrowser(options)));
};

export { IOptions, IShorthandOptions, IConnectOptions };
