import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Admin API for managing API keys
 *
 * Protected by ADMIN_SECRET environment variable.
 * Header: x-admin-secret
 */

function validateAdminSecret(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error("ADMIN_SECRET not configured");
    return false;
  }

  const providedSecret = request.headers.get("x-admin-secret");
  if (!providedSecret) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  // timingSafeEqual requires buffers of same length
  if (providedSecret.length !== adminSecret.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(providedSecret),
    Buffer.from(adminSecret)
  );
}

/**
 * GET /api/admin/api-keys
 *
 * List all API keys (admin view)
 * Query params:
 *   - wallet: Filter by wallet address (optional)
 *   - includeRevoked: Include revoked keys (default: false)
 */
export async function GET(request: Request) {
  if (!validateAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const includeRevoked = searchParams.get("includeRevoked") === "true";

  const where: { ownerWallet?: string; revokedAt?: null } = {};
  if (wallet) where.ownerWallet = wallet;
  if (!includeRevoked) where.revokedAt = null;

  const keys = await prisma.apiKey.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    apiKeys: keys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      name: k.name,
      ownerWallet: k.ownerWallet,
      rateLimit: k.rateLimit,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString(),
      revokedAt: k.revokedAt?.toISOString(),
    })),
    total: keys.length,
  });
}

/**
 * PATCH /api/admin/api-keys
 *
 * Update an API key (rate limit, name)
 * Body:
 *   - id: API key ID
 *   - rateLimit: New rate limit (requests per minute)
 *   - name: New name (optional)
 */
const updateSchema = z.object({
  id: z.string().min(1),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  name: z.string().max(100).optional(),
});

export async function PATCH(request: Request) {
  if (!validateAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, rateLimit, name } = parsed.data;

  const existingKey = await prisma.apiKey.findUnique({ where: { id } });
  if (!existingKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const updateData: { rateLimit?: number; name?: string } = {};
  if (rateLimit !== undefined) updateData.rateLimit = rateLimit;
  if (name !== undefined) updateData.name = name;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    apiKey: {
      id: updated.id,
      prefix: updated.keyPrefix,
      name: updated.name,
      rateLimit: updated.rateLimit,
      ownerWallet: updated.ownerWallet,
    },
  });
}

/**
 * DELETE /api/admin/api-keys
 *
 * Force revoke an API key (admin override)
 * Query params:
 *   - id: API key ID to revoke
 */
export async function DELETE(request: Request) {
  if (!validateAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  const existingKey = await prisma.apiKey.findUnique({ where: { id } });
  if (!existingKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  if (existingKey.revokedAt) {
    return NextResponse.json(
      { error: "API key is already revoked" },
      { status: 400 }
    );
  }

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    message: `API key ${existingKey.keyPrefix}... revoked`,
  });
}
