import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import { postgresDateOnlyToLocalDate } from "./date-only";

describe("postgresDateOnlyToLocalDate", () => {
  it("maps Postgres date string to local calendar so format yyyy-MM-dd round-trips", () => {
    const d = postgresDateOnlyToLocalDate("1977-05-16");
    expect(format(d, "yyyy-MM-dd")).toBe("1977-05-16");
    expect(d.getFullYear()).toBe(1977);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(16);
  });

  it("uses date prefix of timestamptz strings as civil date", () => {
    const d = postgresDateOnlyToLocalDate("1977-05-16T00:00:00.000Z");
    expect(format(d, "yyyy-MM-dd")).toBe("1977-05-16");
  });
});
