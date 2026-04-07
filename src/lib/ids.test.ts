import { describe, expect, it, vi } from "vitest";

vi.mock("expo-crypto", () => ({
  randomUUID: () => "550e8400-e29b-41d4-a716-446655440000",
}));

import { newUuid } from "./ids";

describe("newUuid", () => {
  it("returns RFC4122 v4-shaped id", () => {
    const id = newUuid();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
