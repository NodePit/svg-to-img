/// <reference types="node" />
import * as puppeteer from "puppeteer-core";
import { IOptions, IShorthandOptions, IConnectOptions } from "./typings";
export declare class BrowserSource {
    private readonly factory;
    private queue;
    private browserDestructionTimeout;
    private browserInstance;
    private browserState;
    constructor(factory: () => Promise<puppeteer.Browser>);
    getBrowser(): Promise<puppeteer.Browser>;
    scheduleBrowserForDestruction(): void;
    private executeQueuedRequests;
}
export declare class Svg {
    private readonly svg;
    private browserSource;
    constructor(svg: Buffer | string, browserSource: BrowserSource);
    to(options: Omit<IOptions, "encoding">): Promise<Buffer>;
    to(options: IOptions): Promise<string>;
    toPng(options?: Omit<IShorthandOptions, "encoding">): Promise<Buffer>;
    toPng(options?: IShorthandOptions): Promise<string>;
    toJpeg(options?: Omit<IShorthandOptions, "encoding">): Promise<Buffer>;
    toJpeg(options?: IShorthandOptions): Promise<string>;
    toWebp(options?: Omit<IShorthandOptions, "encoding">): Promise<Buffer>;
    toWebp(options?: IShorthandOptions): Promise<string>;
    private convertSvg;
}
export declare class SvgToImg {
    private readonly browserSource;
    constructor(browserSource: BrowserSource);
    from(svg: Buffer | string): Svg;
}
export declare const from: (svg: Buffer | string) => Svg;
export declare const connect: (options: IConnectOptions) => SvgToImg;
export { IOptions, IShorthandOptions, IConnectOptions };
