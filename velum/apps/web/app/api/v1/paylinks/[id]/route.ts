import { NextRequest } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { apiError } from "@/lib/api-errors";
import { fetchPaylink } from "@/lib/paylinks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request);

  if ("error" in auth) {
    return apiError("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  try {
    const { id } = await params;
    const result = await fetchPaylink(id);

    if ("error" in result) {
      if (result.error === "EXPIRED") {
        return apiError("EXPIRED", "Paylink has expired", 410);
      }
      return apiError("NOT_FOUND", "Paylink not found", 404);
    }

    return Response.json(result.data, {
      headers: auth.headers,
    });
  } catch (error) {
    console.error("Failed to fetch paylink:", error);
    return apiError("NOT_FOUND", "Paylink not found", 404);
  }
}
