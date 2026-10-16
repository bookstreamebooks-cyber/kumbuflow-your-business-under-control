import { describe, expect, it } from "vitest";
import { buildCsv, csvCell, luandaDay } from "@/lib/csv";

describe("csv", () => {
  it("uses semicolons and decimal comma", () => {
    expect(buildCsv(["A", "B"], [["x", 1500]])).toBe("\uFEFFA;B\r\nx;1500,00");
  });
  it("neutralises formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
  });
  it("uses Luanda day for late UTC times", () => {
    expect(luandaDay("2026-10-14T23:30:00Z")).toBe("2026-10-15");
  });
});
