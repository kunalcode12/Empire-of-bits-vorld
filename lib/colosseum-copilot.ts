const DEFAULT_COLOSSEUM_COPILOT_API_BASE =
  "https://copilot.colosseum.com/api/v1";
const COLOSSEUM_COPILOT_TIMEOUT_MS = 15_000;

export interface ColosseumCopilotStatusResponse {
  authenticated: boolean;
  expiresAt?: string;
  scope?: string;
  [key: string]: unknown;
}

export interface ColosseumProjectSearchRequest {
  query: string;
  limit?: number;
  diversify?: boolean;
  filters?: Record<string, unknown>;
  hackathons?: string[];
}

export interface ColosseumProjectSearchResponse {
  results?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export class ColosseumCopilotError extends Error {
  status: number;
  details?: unknown;
  retryAfter?: string | null;

  constructor(
    message: string,
    status = 500,
    details?: unknown,
    retryAfter?: string | null,
  ) {
    super(message);
    this.name = "ColosseumCopilotError";
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter ?? null;
  }
}

function getCopilotApiBase() {
  const configuredBase = process.env.COLOSSEUM_COPILOT_API_BASE?.trim();
  return (configuredBase || DEFAULT_COLOSSEUM_COPILOT_API_BASE).replace(
    /\/+$/,
    "",
  );
}

function getCopilotToken() {
  const token = process.env.COLOSSEUM_COPILOT_PAT?.trim();

  if (!token) {
    throw new ColosseumCopilotError(
      "Colosseum Copilot is not configured. Add COLOSSEUM_COPILOT_PAT to your environment variables.",
      503,
      {
        missingEnvVar: "COLOSSEUM_COPILOT_PAT",
        apiBaseEnvVar: "COLOSSEUM_COPILOT_API_BASE",
      },
    );
  }

  return token;
}

async function parseCopilotResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function copilotFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    COLOSSEUM_COPILOT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${getCopilotApiBase()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getCopilotToken()}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await parseCopilotResponse(response);

    if (!response.ok) {
      const fallbackMessage =
        response.status === 401
          ? "Colosseum Copilot rejected the PAT. Regenerate the token in Colosseum Arena and update COLOSSEUM_COPILOT_PAT."
          : response.status === 429
            ? "Colosseum Copilot rate limit reached. Wait and retry."
            : "Colosseum Copilot request failed.";

      throw new ColosseumCopilotError(
        typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
          ? payload.message
          : fallbackMessage,
        response.status,
        payload,
        response.headers.get("Retry-After"),
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ColosseumCopilotError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ColosseumCopilotError(
        "Colosseum Copilot request timed out after 15 seconds.",
        504,
      );
    }

    throw new ColosseumCopilotError(
      error instanceof Error
        ? `Unable to reach Colosseum Copilot: ${error.message}`
        : "Unable to reach Colosseum Copilot.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function getColosseumCopilotConfig() {
  return {
    apiBase: getCopilotApiBase(),
  };
}

export async function getColosseumCopilotStatus() {
  return copilotFetch<ColosseumCopilotStatusResponse>("/status", {
    method: "GET",
  });
}

export async function searchColosseumProjects(
  request: ColosseumProjectSearchRequest,
) {
  return copilotFetch<ColosseumProjectSearchResponse>("/search/projects", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
