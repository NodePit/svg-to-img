# svg-to-img

A Node.js library to convert SVGs to PNG, JPEG and WebP images, built with [Puppeteer](https://github.com/puppeteer/puppeteer).

This is a fork of Etienne Martin’s [svg-to-img](https://github.com/etienne-martin/svg-to-img). It can [connect to a running browser](#svgtoimgconnectoptions) instead of launching one, and fixes a number of issues of the original library (see the [changelog](https://github.com/NodePit/svg-to-img/blob/master/changelog.md)).

[![node version](https://img.shields.io/node/v/%40nodepit%2Fsvg-to-img.svg)](https://www.npmjs.com/package/%40nodepit%2Fsvg-to-img)
[![npm version](https://img.shields.io/npm/v/%40nodepit%2Fsvg-to-img.svg)](https://www.npmjs.com/package/%40nodepit%2Fsvg-to-img)
[![npm monthly downloads](https://img.shields.io/npm/dm/%40nodepit%2Fsvg-to-img.svg)](https://www.npmjs.com/package/%40nodepit%2Fsvg-to-img)

## Getting started

### Requirements

- Node.js 22.12 or later
- A Chrome recent enough for Puppeteer 25. Chrome 78, as shipped in `browserless/chrome:1.x`, is too old; use e.g. `ghcr.io/browserless/chromium`

### Installation

```bash
npm install @nodepit/svg-to-img
```

The library depends on `puppeteer-core`, which does not download a browser. To convert with `from`, which launches a local Chrome, also install `puppeteer`, which downloads one:

```bash
npm install puppeteer
```

To use a browser which runs elsewhere, use `connect` instead.

If Chrome does not start on Linux, it is probably missing system libraries. Puppeteer’s [troubleshooting guide](https://pptr.dev/troubleshooting) lists them.

### Usage

```javascript
import * as svgToImg from "@nodepit/svg-to-img";

const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'/>";

// a PNG as a Buffer
const png = await svgToImg.from(svg).toPng();

// a JPEG saved as example.jpeg
await svgToImg.from(svg).toJpeg({ path: "./example.jpeg" });

// a WebP 300 pixels wide; the height scales proportionally
const webp = await svgToImg.from(svg).toWebp({ width: 300 });

// a PNG as a base64 string
const base64 = await svgToImg.from(svg).toPng({ encoding: "base64" });
```

To convert with a browser which runs elsewhere, e.g. in a Docker container, connect to it:

```javascript
const converter = svgToImg.connect({ browserWSEndpoint: "ws://localhost:3000" });

const image = await converter.from(svg).toPng();
```

## API

### svgToImg.from(svg)

- `svg` (`Buffer | string`): The SVG markup to convert.
- returns `Svg`, whose methods below convert it.

The first conversion launches a local Chrome with `puppeteer`, and the library closes it 500 ms after the last conversion.

### svgToImg.connect(options)

- `options` (`object`): Where to find the browser, with one of these properties:
  - `browserWSEndpoint` (`string`): The WebSocket URL of the browser, e.g. `ws://localhost:3000`.
  - `browserURL` (`string`): The HTTP URL of the browser’s remote debugging port, e.g. `http://localhost:9222`.
- returns `SvgToImg`, whose `from` method works like `svgToImg.from`.

The connection opens on the first conversion, so `connect` returns even when the browser cannot be reached; the conversion fails then (see [Errors](#errors)).

Each conversion renders on a page of its own and closes it afterwards, so the pages of other clients of the browser are never touched. 500 ms after the last conversion, the library disconnects from the browser and leaves it running.

### svg.to(options)

- `options` (`object`):
  - `type` (`"png" | "jpeg" | "webp"`): The image type. Defaults to `"png"`, or to the extension of `path`.
  - `path` (`string`): The file to save the image to, relative to the current working directory. Without `path`, the image is not saved.
  - `quality` (`number`): The quality of a JPEG or WebP image, between 0 and 1. Defaults to `1`.
  - `width` (`number`): The width of the image. Defaults to the width of the SVG, or scales proportionally to `height`.
  - `height` (`number`): The height of the image. Defaults to the height of the SVG, or scales proportionally to `width`.
  - `clip` (`object`): The region of the image to keep, with the `x` and `y` of its top-left corner, its `width` and its `height`.
  - `background` (`string`): The background color, as a [CSS color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value). JPEG images default to white.
  - `encoding` (`"base64" | "utf8" | "binary" | "hex"`): Returns the image as a string in this encoding instead of a `Buffer`.
  - `timeout` (`number`): The maximum time in milliseconds to render the SVG. Defaults to `30000`. Puppeteer’s own limit of 180 seconds applies as well, so a longer `timeout`, or `Infinity`, ends there.
- returns `Promise<Buffer | string>`: The image.

When converting SVGs from untrusted sources, limit how many conversions run at once: an SVG can keep its browser page and a CPU core busy until the timeout.

### svg.toPng([options]), svg.toJpeg([options]), svg.toWebp([options])

Shorthands for `to` with the `type` set. The `options` are those of `to`, except `type`.

### Errors

All conversion methods return a promise that rejects with an `Error` in these cases:

| Case                                                                              | Error                                                                                               |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| The input is not a valid SVG                                                      | message `Malformed SVG`                                                                             |
| The browser cannot be reached (`connect`)                                         | message lists the refused addresses, `code` is `ECONNREFUSED`; the next call tries to connect again |
| `puppeteer` is not installed, and you use `from` (which launches a local browser) | message ``NPM module `puppeteer` is not available…``                                                |
| The `path` option cannot be written                                               | the error of the file system, e.g. `ENOENT`                                                         |
| Rendering takes longer than the `timeout` option                                  | message `Rendering the SVG took longer than … ms`                                                   |

Errors of the browser itself (e.g. the browser crashes during the conversion) are passed on unchanged. After the browser disconnected, the next call opens a new one.

## Contributing

Please discuss a change in an issue before you make it. Update the readme and the tests along with the code, and add the change to `changelog.md` under `## [Unreleased]`.

The toolchain is pinned: pnpm by `packageManager`, Node.js by `.node-version`.

```bash
pnpm install
pnpm run lint     # ESLint, Prettier, the type check, Knip, and the changelog
pnpm test         # needs Chrome, which the install of `puppeteer` downloads
pnpm run build
```

### Releasing

1. In `changelog.md`, move the entries under `## [Unreleased]` to a new `## [X.Y.Z] - YYYY-MM-DD` section below it. The date follows a plain hyphen, and the empty `## [Unreleased]` heading stays. Add an `[X.Y.Z]` link comparing the previous version with `vX.Y.Z`, point the `[unreleased]` link at `vX.Y.Z...HEAD`, and commit.
2. Run `pnpm version <patch|minor|major>`, which makes the release commit and tag, and pushes both. If the changelog is not ready, [changelog-keeper](https://github.com/qqilihq/changelog-keeper) says which lines to write and the bump is undone. It checks after the version bump, the only point at which the new version is known, and never modifies the changelog.
3. The tag starts the publish workflow, which publishes to npm and creates the GitHub release.

## Authors

- **Etienne Martin** ([etiennemartin.ca](http://etiennemartin.ca/)): the original library
- **Philipp Katz** ([gitlab.com/qqilihq](https://gitlab.com/qqilihq)): this fork

## License

MIT, see [LICENSE](https://github.com/NodePit/svg-to-img/blob/master/LICENSE).
