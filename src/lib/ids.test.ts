import { describe, expect, it } from "vitest";
import { newUuid } from "./ids";

describe("newUuid", () => {
  it("returns RFC4122 v4-shaped id", () => {
    const id = newUuid();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
