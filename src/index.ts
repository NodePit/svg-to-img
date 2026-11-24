/// <reference types="node" preserve="true" />
// puppeteer-core is ESM-only: the resolution mode lets the CJS declarations import it under node16 resolution
import type * as puppeteer from "puppeteer-core" with { "resolution-mode": "import" };
import type * as PuppeteerFull from "puppeteer" with { "resolution-mode": "import" };
import { writeFile } from "node:fs/promises";
import { getFileTypeFromPath, renderSvg, stringifyFunction } from "./helpers";
import { config, defaultOptions, defaultPngShorthandOptions, defaultJpegShorthandOptions, defaultWebpShorthandOptions } from "./constants";
import { IBoundingBox, IOptions, IShorthandOptions, IConnectOptions } from "./typings";

/**
 * Opens the browser for conversions, and lets go of it when idle.
 *
 * @internal exported for the tests only; not part of the public API, it can change in any release
 */
export class BrowserSource {
  // conversions waiting for the browser to open
  private queue: Array<{ resolve: (result: puppeteer.Browser) => void; reject: (err: unknown) => void }> = [];
  private browserDestructionTimeout: NodeJS.Timeout | undefined;
  private browserInstance: puppeteer.Browser | undefined;
  private browserState: "closed" | "opening" | "open" = "closed";
  // conversions which called `getBrowser` and not yet `scheduleBrowserForDestruction`; the idle close waits for all
  private conversions = 0;

  /**
   * @param factory opens a browser when a conversion needs one
   * @param release lets go of the browser once it was idle for 500 ms; closes it by default
   */
  constructor(
    private readonly factory: () => Promise<puppeteer.Browser>,
    private readonly release: (browser: puppeteer.Browser) => Promise<void> = (browser) => browser.close()
  ) {}

  /**
   * Returns the browser, and opens it if none is open. Call `scheduleBrowserForDestruction` once for every call of
   * `getBrowser`, also when using the browser failed: the browser is released only 500 ms after the last of these calls.
   */
  public async getBrowser(): Promise<puppeteer.Browser> {
    this.conversions++;
    return new Promise((resolve: (result: puppeteer.Browser) => void, reject: (err: unknown) => void) => {
      /* istanbul ignore if */
      if (this.browserDestructionTimeout) {
        clearTimeout(this.browserDestructionTimeout);
      }

      /* istanbul ignore else */
      if (this.browserState === "closed") {
        // Browser is closed
        this.queue.push({ resolve, reject });
        this.browserState = "opening";
        this.factory()
          .then((browserInstance) => {
            this.browserInstance = browserInstance;
            this.browserState = "open";
            // A crashed or restarted browser is replaced by the next conversion. The idle close disconnects too, but it
            // has already let go of the browser, and a next one may be open by the time the event arrives
            browserInstance.once("disconnected", () => {
              if (this.browserInstance === browserInstance) {
                this.browserInstance = undefined;
                this.browserState = "closed";
              }
            });

            this.executeQueuedRequests(this.browserInstance);
          })
          .catch((error: unknown) => {
            this.browserState = "closed";
            // passes on what Puppeteer rejected with, which is not necessarily an Error
            const reason = unwrapConnectionError(error);
            // every conversion which waited for this browser fails, not only the one which started opening it
            for (const queued of this.queue.splice(0)) {
              queued.reject(reason);
            }
          });

        return;
      }

      /* istanbul ignore next */
      if (this.browserState === "opening") {
        // Queue request and wait for the browser to open
        return this.queue.push({ resolve, reject });
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

  /**
   * Lets go of a browser returned by `getBrowser`. When no other caller still uses it, the browser is passed to
   * `release` after 500 ms, unless `getBrowser` is called again before.
   */
  public scheduleBrowserForDestruction() {
    this.conversions--;
    if (this.conversions > 0) {
      return;
    }
    this.browserDestructionTimeout = global.setTimeout(() => {
      const browser = this.browserInstance;
      /* istanbul ignore next */
      if (browser) {
        this.browserInstance = undefined;
        this.browserState = "closed";
        void this.release(browser);
      }
    }, 500);
  }

  private executeQueuedRequests(browser: puppeteer.Browser) {
    for (const { resolve } of this.queue) {
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
    const svg = Buffer.isBuffer(inputSvg) ? inputSvg.toString("utf8") : inputSvg;
    const options = { ...defaultOptions, ...passedOptions };

    // Infer the file type from the file path if no type is provided
    if (!passedOptions.type && options.path) {
      const fileType = getFileTypeFromPath(options.path);

      if (config.supportedImageTypes.includes(fileType)) {
        options.type = fileType as IOptions["type"];
      }
    }

    let base64: string;
    try {
      const browser = await browserSource.getBrowser();
      // A page of its own, so that an SVG which keeps the page busy holds up no other conversion, and a page of another
      // client of a browser reached with `connect` is never used
      const page = await browser.newPage();
      try {
        // ⚠️ Offline mode is enabled to prevent any HTTP requests over the network
        await page.setOfflineMode(true);

        base64 = await withTimeout(
          page.evaluate(
            stringifyFunction(renderSvg, svg, {
              width: options.width,
              height: options.height,
              type: options.type,
              quality: options.quality,
              background: options.background,
              clip: options.clip,
              jpegBackground: config.jpegBackground
            })
          ) as Promise<string>,
          options.timeout ?? config.timeout
        );
      } finally {
        // fails when the browser is gone, which the conversion's own error already tells
        await page.close().catch(() => undefined);
      }
    } finally {
      // also after a failed conversion: an open browser keeps the process from exiting
      browserSource.scheduleBrowserForDestruction();
    }

    const buffer = Buffer.from(base64, "base64");

    if (options.path) {
      await writeFile(options.path, buffer);
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

// An SVG can keep the page busy for good (e.g. `<use>` elements nested to a billion copies): the conversion fails
// instead of waiting forever, and closing the page ends the rendering
async function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timedOut = new Promise<never>((_resolve, reject) => {
    // `setTimeout` takes a longer delay (e.g. `Infinity`) as 1 ms; Puppeteer's `protocolTimeout` ends the call earlier
    // anyway
    timer = setTimeout(() => reject(new Error(`Rendering the SVG took longer than ${timeout} ms`)), Math.min(timeout, 2 ** 31 - 1));
  });
  try {
    return await Promise.race([promise, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

// Puppeteer 25 rejects a failed connection with an `ErrorEvent` wrapping Node's `AggregateError` (one error per
// resolved address), which has an empty message
/* istanbul ignore next */
function unwrapConnectionError(error: unknown) {
  const cause = (error as { error?: unknown } | undefined)?.error ?? error;
  const { message, errors, code } = cause as { message?: string; errors?: Error[]; code?: string };
  if (message || !Array.isArray(errors)) return cause;
  return Object.assign(new Error(errors.map((e) => e.message).join("; "), { cause }), { code });
}

export class SvgToImg {
  constructor(private readonly browserSource: BrowserSource) {}
  public from(svg: Buffer | string) {
    return new Svg(svg, this.browserSource);
  }
}

const defaultBrowserSource = new BrowserSource(async () => {
  let puppeteerFull: typeof PuppeteerFull;
  try {
    // `puppeteer` is an optional peer dependency, so it is loaded only once a conversion needs it
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    puppeteerFull = require("puppeteer") as typeof PuppeteerFull;
  } catch {
    /* istanbul ignore next */
    throw new Error(
      "NPM module `puppeteer` is not available. Either add it as " +
        " dependency to your project, or use the `connect` function and supply " +
        "`browserWSEndpoint` if you want to use a running Puppeteer endpoint."
    );
  }

  return await puppeteerFull.launch(config.puppeteer);
});

export function from(svg: Buffer | string) {
  return new SvgToImg(defaultBrowserSource).from(svg);
}

/* istanbul ignore next */
export function connect(options: IConnectOptions) {
  return new SvgToImg(
    new BrowserSource(
      async () => {
        // puppeteer-core is ESM-only, load it when the first conversion needs it and not when this library is imported (CJS tooling like Jest cannot load it)
        const { connect } = await import("puppeteer-core");
        return connect(options);
      },
      // the browser belongs to whoever runs the endpoint, and may serve other clients: `close` would end it for all of them
      (browser) => browser.disconnect()
    )
  );
}

export { IBoundingBox, IOptions, IShorthandOptions, IConnectOptions };
