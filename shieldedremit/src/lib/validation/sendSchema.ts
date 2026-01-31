import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

// Validate Solana address
const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// All supported currencies
const SUPPORTED_CURRENCIES = [
  "SOL",
  "USDC",
  "USDT",
  "USD1",
  "BONK",
  "AOL",
  "RADR",
  "ORE",
] as const;

export const sendFormSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Please enter a valid amount" })
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount exceeds maximum limit"),

  currency: z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: "Please select a currency" }),
  }),

  recipient: z
    .string()
    .min(1, "Recipient address is required")
    .refine(isValidSolanaAddress, "Invalid Solana address"),

  privacyLevel: z.enum(["none", "medium", "high"], {
    errorMap: () => ({ message: "Please select a privacy level" }),
  }),

  memo: z.string().max(200, "Memo too long").optional(),

  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type SendFormData = z.infer<typeof sendFormSchema>;

// Step-specific schemas for validation
export const amountStepSchema = sendFormSchema.pick({
  amount: true,
  currency: true,
});

export const recipientStepSchema = sendFormSchema.pick({
  recipient: true,
});

export const privacyStepSchema = sendFormSchema.pick({
  privacyLevel: true,
});

export const reviewStepSchema = sendFormSchema.pick({
  acceptTerms: true,
});
