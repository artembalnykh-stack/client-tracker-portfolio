import { describe, expect, it } from "vitest";
import { clampPercent, pointToPercent } from "./pins";

const rect = { left: 100, top: 50, width: 400, height: 200 };

describe("pointToPercent", () => {
  it("maps the center to 50/50", () => {
    expect(pointToPercent(300, 150, rect)).toEqual({ x: 50, y: 50 });
  });

  it("maps the top-left corner to 0/0", () => {
    expect(pointToPercent(100, 50, rect)).toEqual({ x: 0, y: 0 });
  });

  it("maps the bottom-right corner to 100/100", () => {
    expect(pointToPercent(500, 250, rect)).toEqual({ x: 100, y: 100 });
  });

  it("clamps points outside the image", () => {
    expect(pointToPercent(0, 0, rect)).toEqual({ x: 0, y: 0 });
    expect(pointToPercent(900, 900, rect)).toEqual({ x: 100, y: 100 });
  });

  it("survives a resized wrapper", () => {
    expect(
      pointToPercent(250, 100, { left: 0, top: 0, width: 500, height: 400 }),
    ).toEqual({ x: 50, y: 25 });
  });

  it("returns zeroes for a zero-sized box", () => {
    expect(
      pointToPercent(10, 10, { left: 0, top: 0, width: 0, height: 0 }),
    ).toEqual({ x: 0, y: 0 });
  });
});

describe("clampPercent", () => {
  it("keeps values in range", () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(50)).toBe(50);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});
