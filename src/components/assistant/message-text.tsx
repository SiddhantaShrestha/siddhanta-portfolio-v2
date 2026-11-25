import { Fragment } from "react";
import { parseMessage } from "@/lib/assistant/shared/format-message";
import type { InlineRun } from "@/lib/assistant/shared/format-message";

function Runs({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((run, index) => (
        <Fragment key={index}>
          {run.bold ? (
            <strong className="font-semibold">{run.text}</strong>
          ) : (
            run.text
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Assistant text as real paragraphs and lists. Built from React elements
 * only, so model output can never inject HTML.
 */
export function MessageText({ text }: { text: string }) {
  const blocks = parseMessage(text);
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index}>
              <Runs runs={block.runs} />
            </p>
          );
        }
        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag
            key={index}
            className={
              block.ordered
                ? "list-decimal space-y-1 pl-5 marker:text-muted"
                : "list-disc space-y-1 pl-5 marker:text-accent"
            }
          >
            {block.items.map((runs, itemIndex) => (
              <li key={itemIndex} className="pl-1">
                <Runs runs={runs} />
              </li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}
