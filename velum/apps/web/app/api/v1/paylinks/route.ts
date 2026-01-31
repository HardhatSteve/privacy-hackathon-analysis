import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateApiRequest } from "@/lib/api-auth";
import { apiError } from "@/lib/api-errors";
import { CreatePaylinkSchema, createPaylink } from "@/lib/paylinks";

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);

  if ("error" in auth) {
    return apiError("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  try {
    const body = await request.json();
    const data = CreatePaylinkSchema.parse(body);
    const result = await createPaylink(data);

    return Response.json(result, {
      status: 201,
      headers: auth.headers,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", "Invalid request data", 400, {
        details: { issues: error.errors },
      });
    }
    console.error("Failed to create paylink:", error);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
