# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Export the TS interface `IBoundingBox`, the type of the `clip` option

### Fixed

- An SVG with a backtick (`` ` ``) or `${…}` in it no longer fails with `SyntaxError` or `ReferenceError`: the SVG is passed to the browser as a JSON string instead of a template literal
- A backslash in an SVG is kept as it is: it was read as the start of an escape sequence, so e.g. `\n` in a text was drawn as a line break, and a CSS escape such as `content: "\201C"` failed with `SyntaxError`
- Converting with a browser that has no page open (possible with `connect`) no longer fails with `TypeError`: a page is opened
- `require("@nodepit/svg-to-img/package.json")` (or `require.resolve` of it) works again; the `exports` map of 4.0.0 had closed it with `ERR_PACKAGE_PATH_NOT_EXPORTED`
- After the browser disconnected (e.g. it crashed, or the endpoint given to `connect` restarted), every conversion failed with `Attempted to use detached Frame` until the process was restarted. The next conversion now opens a new browser
- A conversion which took longer than 500 ms failed with `Target closed` when another one finished first: the idle browser is now closed only after the last running conversion
- After a failed conversion (e.g. `Malformed SVG`), the browser stayed open, and a script which converted nothing else did not exit
- With `connect`, the idle browser is disconnected from, not closed: closing ended the browser at the endpoint, also for its other clients
- The usage examples in the readme import `@nodepit/svg-to-img`, not the unscoped `svg-to-img` (the original library this one is forked from)

### Security

- The text of an SVG can no longer run as JavaScript in the browser which renders it

## [4.0.0] - 2026-10-14

### Changed

- (breaking) Update to Puppeteer 25. It needs a current Chrome (tested with Chrome 156 and browserless v2); the Chrome 78 of `browserless/chrome:1.x` no longer works, use e.g. `ghcr.io/browserless/chromium` instead
- (breaking) Require at least Node version 22.12.0
- (breaking) Only the package entry point can be imported, deep imports into `dist` are no longer possible
- A malformed SVG now results in the error message `Malformed SVG` (without the `Error:` prefix)
- `puppeteer` is declared as an optional peer dependency. It is only needed if you let the library launch a local browser, it is not needed with `connect`
- Releases are published from GitHub Actions with provenance

### Security

- Resolve the known vulnerabilities in `ws`, `tar-fs`, and `extract-zip`, which were pulled in by the previous Puppeteer version

## [3.1.0] - 2022-07-30

### Changed

- Return types depending on whether a `Buffer` (no `encoding` specified) or `string` (`encoding` specified) is returned

## [3.0.0] - 2022-04-30

### Changed

- Set up GitHub CI
- Upgrade development dependencies (Typescript, ESLint, etc.) and related fixes
- (breaking) Depend on [`puppeteer-core`](https://github.com/puppeteer/puppeteer#puppeteer-core) to avoid Chromium download. If you rely on the included Chromium, simply add a dependency to `puppeteer@2.0.0` to your project
- Upgrade to latest Puppeteer library (v13.7.0)

### Breaking

- Require at least Node version 10.18.1

## [2.2.0] - 2020-12-14

### Added

- Export TS interfaces `IOptions`, `IShorthandOptions`, and `IConnectOptions`

## [2.1.1] - 2020-04-15

### Fixed

- Update README.md to reflect fork

## [2.1.0] - 2020-04-15

### Added

- Forked from Etienne Martin’s <a href="https://github.com/etienne-martin/svg-to-img">svg-to-img</a> and added possibility to connect to a Puppeteer endpoint (see <a href="https://github.com/etienne-martin/svg-to-img/pull/19">here</a>)

[unreleased]: https://github.com/NodePit/svg-to-img/compare/v4.0.0...HEAD
[4.0.0]: https://github.com/NodePit/svg-to-img/compare/v3.1.0...v4.0.0
[3.1.0]: https://github.com/NodePit/svg-to-img/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/NodePit/svg-to-img/compare/v2.2.0...v3.0.0
[2.2.0]: https://github.com/NodePit/svg-to-img/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/NodePit/svg-to-img/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/NodePit/svg-to-img/compare/v2.0.9...v2.1.0
