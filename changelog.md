# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0-beta.0] – 2026-10-14
### Changed
* (breaking) Update to Puppeteer 25. It needs a current Chrome (tested with Chrome 156 and browserless v2); the Chrome 78 of `browserless/chrome:1.x` no longer works, use e.g. `ghcr.io/browserless/chromium` instead
* (breaking) Require at least Node version 22.12.0
* (breaking) Only the package entry point can be imported, deep imports into `dist` are no longer possible
* A malformed SVG now results in the error message `Malformed SVG` (without the `Error:` prefix)
* `puppeteer` is declared as an optional peer dependency. It is only needed if you let the library launch a local browser, it is not needed with `connect`
* Releases are published from GitHub Actions with provenance

### Security
* Resolve the known vulnerabilities in `ws`, `tar-fs`, and `extract-zip`, which were pulled in by the previous Puppeteer version

## [3.1.0] – 2022-07-30
### Changes
* Return types depending on whether a `Buffer` (no `encoding` specified) or `string` (`encoding` specified) is returned

## [3.0.0] – 2022-04-30
### Changed
* Set up GitHub CI
* Upgrade development dependencies (Typescript, ESLint, etc.) and related fixes
* (breaking) Depend on [`puppeteer-core`](https://github.com/puppeteer/puppeteer#puppeteer-core) to avoid Chromium download. If you rely on the included Chromium, simply add a dependency to `puppeteer@2.0.0` to your project
* Upgrade to latest Puppeteer library (v13.7.0)

### Breaking
* Require at least Node version 10.18.1

## [2.2.0] – 2020-12-14
### Added
* Export TS interfaces `IOptions`, `IShorthandOptions`, and `IConnectOptions`

## [2.1.1] – 2020-04-15
### Fixed
* Update README.md to reflect fork

## [2.1.0] – 2020-04-15
### Added
* Forked from Etienne Martin’s <a href="https://github.com/etienne-martin/svg-to-img">svg-to-img</a> and added possibility to connect to a Puppeteer endpoint (see <a href="https://github.com/etienne-martin/svg-to-img/pull/19">here</a>)
