import { describe, it, expect } from "vitest";
import {
  stellarAssetCodeSchema,
  quoteSchema,
} from "../src/modules/payments/payments.schema";

describe("stellarAssetCodeSchema", () => {
  it("accepts valid 1-12 alphanumeric codes", () => {
    expect(stellarAssetCodeSchema.safeParse("USDC").success).toBe(true);
  });

  it("accepts single character code", () => {
    expect(stellarAssetCodeSchema.safeParse("A").success).toBe(true);
  });

  it("accepts 12-character code (max length)", () => {
    expect(stellarAssetCodeSchema.safeParse("ABCDEFGHIJKL").success).toBe(true);
  });

  it("accepts mixed case alphanumeric", () => {
    expect(stellarAssetCodeSchema.safeParse("AbCd1234").success).toBe(true);
  });

  it("accepts XLM (native asset special case)", () => {
    expect(stellarAssetCodeSchema.safeParse("XLM").success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = stellarAssetCodeSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 12 characters", () => {
    const result = stellarAssetCodeSchema.safeParse("ABCDEFGHIJKLM");
    expect(result.success).toBe(false);
  });

  it("rejects spaces in asset code", () => {
    const result = stellarAssetCodeSchema.safeParse("US DC");
    expect(result.success).toBe(false);
  });

  it("rejects hyphens in asset code", () => {
    const result = stellarAssetCodeSchema.safeParse("USD-CDC");
    expect(result.success).toBe(false);
  });

  it("rejects unicode/emoji in asset code", () => {
    const result = stellarAssetCodeSchema.safeParse("USD\u{1F600}");
    expect(result.success).toBe(false);
  });

  it("rejects special characters", () => {
    const result = stellarAssetCodeSchema.safeParse("US$DC");
    expect(result.success).toBe(false);
  });

  it("rejects underscores", () => {
    const result = stellarAssetCodeSchema.safeParse("US_DC");
    expect(result.success).toBe(false);
  });
});

describe("quoteSchema", () => {
  it("accepts a valid quote request with XLM", () => {
    const result = quoteSchema.safeParse({
      assetCode: "XLM",
      amount: "100.50",
      destination: "GABC123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid quote request with USDC", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USDC",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(true);
  });

  it("rejects quote with invalid asset code containing space", () => {
    const result = quoteSchema.safeParse({
      assetCode: "US DC",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with missing amount", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USDC",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with missing destination", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USDC",
      amount: "50",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with empty asset code", () => {
    const result = quoteSchema.safeParse({
      assetCode: "",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with emoji in asset code", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USD\u{1F600}",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-decimal amounts like abc, -5, 1.2.3, 1e999 and amounts with >7 decimals", () => {
    const malformed = ["abc", "-5", "1.2.3", "1e999", "1.12345678", ""];
    for (const val of malformed) {
      const result = quoteSchema.safeParse({
        assetCode: "USDC",
        amount: val,
        destination: "GXYZ789",
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects invalid currency codes (lowercase, digits) and accepts 3 uppercase letters", () => {
    const invalidCurrencies = ["usd", "123", "US", "USDC", "US!"];
    for (const curr of invalidCurrencies) {
      const result = quoteSchema.safeParse({
        currency: curr,
        amount: "50.00",
        destination: "GXYZ789",
      });
      expect(result.success).toBe(false);
    }

    const validResult = quoteSchema.safeParse({
      currency: "USD",
      amount: "50.00",
      destination: "GXYZ789",
    });
    expect(validResult.success).toBe(true);
  });

  it("parses valid decimal values like 7.50 and 100.00 with normalized output unchanged", () => {
    const res1 = quoteSchema.safeParse({
      currency: "USD",
      amount: "7.50",
      destination: "GXYZ789",
    });
    expect(res1.success).toBe(true);
    if (res1.success) {
      expect(res1.data.amount).toBe("7.50");
    }

    const res2 = quoteSchema.safeParse({
      assetCode: "USDC",
      amount: "100.00",
      destination: "GXYZ789",
    });
    expect(res2.success).toBe(true);
    if (res2.success) {
      expect(res2.data.amount).toBe("100.00");
    }
  });
});
