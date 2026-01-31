import { describe, test, expect } from "@jest/globals";
import {
  validateEvmAddress,
  validateSolanaAddress,
  validateTokenName,
  validateTokenSymbol,
  validateDecimals,
  validateAndParseSupply,
  ValidationError,
} from "../validation";

describe("Validation Utilities", () => {
  describe("validateEvmAddress", () => {
    test("should validate correct EVM address", () => {
      expect(
        validateEvmAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
      ).toBe(true);
    });

    test("should reject invalid EVM address", () => {
      expect(validateEvmAddress("invalid")).toBe(false);
      expect(validateEvmAddress("0x123")).toBe(false);
    });
  });

  describe("validateTokenName", () => {
    test("should accept valid token names", () => {
      expect(() => validateTokenName("My Token")).not.toThrow();
      expect(() => validateTokenName("Test-Token_123")).not.toThrow();
    });

    test("should reject invalid token names", () => {
      expect(() => validateTokenName("")).toThrow(ValidationError);
      expect(() => validateTokenName("a".repeat(101))).toThrow(ValidationError);
      expect(() => validateTokenName("Token<script>")).toThrow(ValidationError);
    });
  });

  describe("validateTokenSymbol", () => {
    test("should accept valid symbols", () => {
      expect(() => validateTokenSymbol("MTK")).not.toThrow();
      expect(() => validateTokenSymbol("TEST123")).not.toThrow();
    });

    test("should reject invalid symbols", () => {
      expect(() => validateTokenSymbol("")).toThrow(ValidationError);
      expect(() => validateTokenSymbol("mtk")).toThrow(ValidationError);
      expect(() => validateTokenSymbol("TEST-TOKEN")).toThrow(ValidationError);
    });
  });

  describe("validateDecimals", () => {
    test("should accept valid decimals for EVM", () => {
      expect(() => validateDecimals(18, "evm")).not.toThrow();
      expect(() => validateDecimals(6, "evm")).not.toThrow();
    });

    test("should accept valid decimals for Solana", () => {
      expect(() => validateDecimals(9, "solana")).not.toThrow();
      expect(() => validateDecimals(6, "solana")).not.toThrow();
    });

    test("should reject invalid decimals", () => {
      expect(() => validateDecimals(19, "evm")).toThrow(ValidationError);
      expect(() => validateDecimals(10, "solana")).toThrow(ValidationError);
      expect(() => validateDecimals(-1, "evm")).toThrow(ValidationError);
    });
  });

  describe("validateAndParseSupply", () => {
    test("should parse valid supply correctly", () => {
      expect(validateAndParseSupply("1000000", 18)).toBe(
        BigInt("1000000000000000000000000"),
      );
      expect(validateAndParseSupply("1,000,000", 6)).toBe(
        BigInt("1000000000000"),
      );
    });

    test("should handle decimal supplies", () => {
      expect(validateAndParseSupply("1000.5", 2)).toBe(BigInt("100050"));
    });

    test("should reject invalid supplies", () => {
      expect(() => validateAndParseSupply("0", 18)).toThrow(ValidationError);
      expect(() => validateAndParseSupply("-100", 18)).toThrow(ValidationError);
      expect(() => validateAndParseSupply("invalid", 18)).toThrow(
        ValidationError,
      );
    });
  });
});
