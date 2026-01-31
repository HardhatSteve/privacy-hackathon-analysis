import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { apiError } from "@/lib/api-errors";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "failed"]),
});

/**
 * PATCH /api/v1/transactions/:signature
 *
 * Update transaction status by signature.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ signature: string }> }
) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) {
    return apiError("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  const { signature } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid request data", 400, {
      details: { issues: parsed.error.errors },
    });
  }

  const { status } = parsed.data;

  const transaction = await prisma.transactionLog.findUnique({
    where: { signature },
  });

  if (!transaction) {
    return apiError("NOT_FOUND", "Transaction not found", 404);
  }

  // Verify ownership
  if (transaction.apiKeyId !== auth.apiKey.id) {
    return apiError("UNAUTHORIZED", "Not authorized to update this transaction", 403);
  }

  const updated = await prisma.transactionLog.update({
    where: { signature },
    data: { status },
  });

  return Response.json(
    {
      signature: updated.signature,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    },
    { headers: auth.headers }
  );
}
