import { prisma } from "@/lib/db";
import { z } from "zod";

export const CreatePaylinkSchema = z.object({
  recipientUtxoPubkey: z.string().min(1),
  recipientEncryptionKey: z.string().min(1),
  token: z.enum(["ANY", "SOL", "USDC", "USDT"]).optional().default("ANY"),
  amountLamports: z
    .string()
    .optional()
    .transform((val) => (val ? BigInt(val) : null)),
  memo: z.string().max(140).optional(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

export type CreatePaylinkInput = z.infer<typeof CreatePaylinkSchema>;

export async function createPaylink(data: CreatePaylinkInput) {
  const paylink = await prisma.paylink.create({
    data: {
      recipientUtxoPubkey: data.recipientUtxoPubkey,
      recipientEncryptionKey: data.recipientEncryptionKey,
      token: data.token,
      amountLamports: data.amountLamports,
      memo: data.memo,
      expiresAt: data.expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    id: paylink.id,
    url: `${baseUrl}/pay/${paylink.id}`,
  };
}

export async function fetchPaylink(id: string) {
  // First check if paylink exists (findUnique doesn't throw)
  const paylink = await prisma.paylink.findUnique({
    where: { id },
  });

  if (!paylink) {
    return { error: "NOT_FOUND" as const };
  }

  // Check expiration before incrementing view count
  if (paylink.expiresAt && new Date() > paylink.expiresAt) {
    // Use deleteMany to avoid throwing if already deleted (race condition)
    await prisma.paylink.deleteMany({ where: { id } });
    return { error: "EXPIRED" as const };
  }

  // Increment view count using updateMany (doesn't throw if not found)
  await prisma.paylink.updateMany({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    data: {
      id: paylink.id,
      recipientUtxoPubkey: paylink.recipientUtxoPubkey,
      recipientEncryptionKey: paylink.recipientEncryptionKey,
      token: paylink.token,
      amountLamports: paylink.amountLamports?.toString() ?? null,
      memo: paylink.memo,
      createdAt: paylink.createdAt.toISOString(),
    },
  };
}
