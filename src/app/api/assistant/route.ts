import {
  createDefaultDeps,
  handleAssistantRequest,
} from "@/lib/assistant/server/handler";
import type { HandlerDeps } from "@/lib/assistant/server/handler";

/**
 * POST only. All logic lives in lib/assistant/server so it can be tested
 * without Next. No route segment config on purpose: Cache Components rejects
 * `runtime`, and nothing here needs `dynamic`.
 */
let deps: HandlerDeps | null = null;

export async function POST(request: Request): Promise<Response> {
  deps ??= createDefaultDeps();
  return handleAssistantRequest(request, deps);
}
