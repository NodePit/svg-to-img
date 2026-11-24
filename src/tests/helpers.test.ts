/**
 * @vitest-environment jsdom
 */

import "vitest-canvas-mock";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getFileTypeFromPath, stringifyFunction, renderSvg } from "../helpers";
import { config } from "../constants";

beforeEach(() => {
  // Mock img.addEventListener("load|error", () => {});
  Element.prototype.addEventListener = vi.fn((event, callback: EventListener) => {
    if (event === "load") {
      setTimeout(callback, 10);
    }
  });
});

describe("Helper functions", () => {
  test("Get file type from path", () => {
    const fileType = getFileTypeFromPath("test.jpg");

    expect(fileType).toBe("jpeg");
  });

  test("Stringify function", () => {
    const func = stringifyFunction((str: string, obj: object, num: number) => [str, obj, num], "a", { a: 1 }, 1);

    expect(func).toMatch(/\)\("a",\{"a":1\},1\)$/);
    expect(eval(func)).toEqual(["a", { a: 1 }, 1]);
  });

  test("Stringify function with a string which looks like code", () => {
    const text = "`a` ${notDefined} \"b\" 'c' \\n \u2028 äöü";
    const func = stringifyFunction((str: string) => str, text);

    expect(eval(func)).toBe(text);
  });

  test("Render SVG with all options", async () => {
    const base64 = await renderSvg("<svg xmlns='http://www.w3.org/2000/svg'/>", {
      width: 100,
      height: 100,
      type: "jpeg",
      quality: 1,
      background: "#09f",
      jpegBackground: config.jpegBackground
    });

    // `toDataURL` of vitest-canvas-mock (taken from jest-canvas-mock) always returns this
    expect(base64).toBe("00");
  });

  test("Render SVG with default options", async () => {
    const base64 = await renderSvg("<svg xmlns='http://www.w3.org/2000/svg'/>", {
      type: "png",
      quality: 1,
      jpegBackground: config.jpegBackground
    });

    expect(base64).toBe("00");
  });

  test("Render SVG with clipping options", async () => {
    const base64 = await renderSvg("<svg xmlns='http://www.w3.org/2000/svg'/>", {
      clip: {
        x: 10,
        y: 10,
        width: 100,
        height: 100
      },
      type: "jpeg",
      quality: 1,
      jpegBackground: config.jpegBackground
    });

    expect(base64).toBe("00");
  });

  test("Malformed SVG", async () => {
    Element.prototype.addEventListener = vi.fn((event, callback: EventListener) => {
      if (event === "error") {
        setTimeout(callback, 10);
      }
    });

    await expect(
      renderSvg("THIS IS NO SVG", {
        type: "png",
        quality: 1,
        jpegBackground: config.jpegBackground
      })
    ).rejects.toThrow("Malformed SVG");
  });
});
