import { NextResponse } from "next/server";

import {
  ColosseumCopilotError,
  type ColosseumProjectSearchRequest,
  searchColosseumProjects,
} from "@/lib/colosseum-copilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toErrorResponse(error: unknown) {
  if (error instanceof ColosseumCopilotError) {
    return NextResponse.json(
      {
        success: false,
        source: "Colosseum Copilot",
        error: error.message,
        details: error.details,
        retryAfter: error.retryAfter,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      success: false,
      source: "Colosseum Copilot",
      error: "Unexpected error while searching Copilot projects.",
    },
    { status: 500 },
  );
}

function normalizeProjectSearchRequest(
  body: Partial<ColosseumProjectSearchRequest>,
): ColosseumProjectSearchRequest {
  const query = body.query?.trim();

  if (!query) {
    throw new ColosseumCopilotError(
      "A non-empty query is required.",
      400,
      { field: "query" },
    );
  }

  const limit =
    typeof body.limit === "number"
      ? Math.min(Math.max(Math.trunc(body.limit), 1), 20)
      : 8;

  return {
    query,
    limit,
    diversify: body.diversify ?? true,
    filters: body.filters,
    hackathons: body.hackathons,
  };
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as Partial<ColosseumProjectSearchRequest>;
    const normalizedRequest = normalizeProjectSearchRequest(body);
    const results = await searchColosseumProjects(normalizedRequest);

    return NextResponse.json({
      success: true,
      source: "Colosseum Copilot",
      query: normalizedRequest.query,
      data: results,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
