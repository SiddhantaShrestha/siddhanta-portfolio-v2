// @types/node 20 predates node:sqlite. Only what the tests use is declared.
declare module "node:sqlite" {
  type Value = string | number | null | bigint | Uint8Array;
  interface StatementSync {
    all(...params: Value[]): unknown[];
    get(...params: Value[]): unknown;
    run(...params: Value[]): unknown;
  }
  export class DatabaseSync {
    constructor(path: string);
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
