import { ASSISTANT_LIMITS } from "@/lib/assistant/shared/protocol";
import type { ChatTurn } from "@/lib/assistant/shared/protocol";

/**
 * Builds the messages array for a request: the last few completed turns plus
 * the new question, clipped so the server will accept it. The server treats
 * all of this as untrusted anyway. This only keeps honest requests valid.
 */
export function buildRequestMessages(
  completed: ChatTurn[],
  question: string,
): ChatTurn[] {
  const clip = (turn: ChatTurn): ChatTurn => {
    const max =
      turn.role === "user"
        ? ASSISTANT_LIMITS.maxUserChars
        : ASSISTANT_LIMITS.maxAssistantChars;
    return { role: turn.role, content: turn.content.trim().slice(0, max) };
  };

  const turns = [...completed, { role: "user" as const, content: question }]
    .map(clip)
    .filter((turn) => turn.content.length > 0)
    .slice(-ASSISTANT_LIMITS.maxMessages);

  let total = turns.reduce((sum, turn) => sum + turn.content.length, 0);
  while (turns.length > 1 && total > ASSISTANT_LIMITS.maxTotalChars) {
    const dropped = turns.shift();
    total -= dropped?.content.length ?? 0;
  }
  return turns;
}
