# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
