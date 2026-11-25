import "server-only";

/**
 * Incremental Server-Sent Events parser. Chunks may split anywhere: inside a
 * line, inside a multi-byte character, between "\r" and "\n". Feed bytes or
 * strings, get back the `data` payload of each completed event.
 */
export class SseParser {
  private decoder = new TextDecoder("utf-8");
  private buffer = "";
  private dataLines: string[] = [];

  /** Decode and parse a chunk of bytes. */
  pushBytes(chunk: Uint8Array): string[] {
    return this.push(this.decoder.decode(chunk, { stream: true }));
  }

  push(text: string): string[] {
    this.buffer += text;
    const events: string[] = [];

    for (;;) {
      const match = /\r\n|\n|\r/.exec(this.buffer);
      if (!match) break;
      // A lone "\r" at the very end may be the first half of "\r\n".
      if (match[0] === "\r" && match.index === this.buffer.length - 1) break;

      const rawLine = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      const event = this.consumeLine(rawLine);
      if (event !== null) events.push(event);
    }

    return events;
  }

  /** Call when the stream ends. Emits a final event that lacked a blank line. */
  end(): string[] {
    const events: string[] = [];
    const tail = this.decoder.decode();
    if (tail) events.push(...this.push(tail));

    if (this.buffer.length > 0) {
      const event = this.consumeLine(this.buffer.replace(/\r$/, ""));
      this.buffer = "";
      if (event !== null) events.push(event);
    }
    if (this.dataLines.length > 0) {
      events.push(this.dataLines.join("\n"));
      this.dataLines = [];
    }
    return events;
  }

  private consumeLine(line: string): string | null {
    if (line === "") {
      if (this.dataLines.length === 0) return null;
      const data = this.dataLines.join("\n");
      this.dataLines = [];
      return data;
    }
    if (line.startsWith(":")) return null;

    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "data") this.dataLines.push(value);
    return null;
  }
}
