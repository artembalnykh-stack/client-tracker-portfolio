import { describe, expect, it } from "vitest";
import { canClientTransition } from "./status";

describe("canClientTransition", () => {
  it("allows client answers from waiting_client", () => {
    expect(canClientTransition("waiting_client", "in_progress")).toBe(true);
  });

  it("allows accept and rework from on_review", () => {
    expect(canClientTransition("on_review", "done")).toBe(true);
    expect(canClientTransition("on_review", "needs_rework")).toBe(true);
  });

  it("blocks admin-only transitions", () => {
    expect(canClientTransition("in_progress", "on_review")).toBe(false);
    expect(canClientTransition("in_progress", "waiting_client")).toBe(false);
    expect(canClientTransition("on_review", "in_progress")).toBe(false);
  });

  it("blocks unknown statuses", () => {
    expect(canClientTransition("new", "done")).toBe(false);
    expect(canClientTransition("done", "on_review")).toBe(false);
  });
});
