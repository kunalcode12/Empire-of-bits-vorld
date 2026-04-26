import { NextResponse } from "next/server";

import {
  ColosseumCopilotError,
  getColosseumCopilotConfig,
  getColosseumCopilotStatus,
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
      error: "Unexpected error while checking Copilot status.",
    },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const status = await getColosseumCopilotStatus();

    return NextResponse.json({
      success: true,
      source: "Colosseum Copilot",
      configured: true,
      apiBase: getColosseumCopilotConfig().apiBase,
      data: status,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
