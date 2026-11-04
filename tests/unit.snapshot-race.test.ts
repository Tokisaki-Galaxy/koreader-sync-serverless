import { describe, expect, it } from "vitest";
import { getStatisticsSnapshot } from "../src/db";
import type { DatabaseAdapter, SqlStatement } from "../src/database/adapter";

type MetaRow = {
  schema_version: number;
  device: string;
  device_id: string;
  snapshot_json: string;
  statistics_summary_json: string | null;
  revision: number;
};

function fakeStatement(handlers: {
  first?: () => Promise<unknown>;
  all?: () => Promise<unknown[]>;
}): SqlStatement {
  return {
    bind() {
      return this;
    },
    async first() {
      return (await handlers.first?.()) as never;
    },
    async all() {
      return { results: (await handlers.all?.()) as never[] };
    },
    async run() {
      return { meta: { changes: 0 } };
    },
  };
}

describe("statistics snapshot read races", () => {
  it("reloads the metadata row when a concurrent write switches to inline storage", async () => {
    const rows: MetaRow[] = [
      {
        schema_version: 20221111,
        device: "Kindle",
        device_id: "k-1",
        snapshot_json: "",
        statistics_summary_json: null,
        revision: 1,
      },
      {
        schema_version: 20221111,
        device: "Kindle",
        device_id: "k-1",
        snapshot_json: '{"books":[]}',
        statistics_summary_json: null,
        revision: 2,
      },
    ];
    let metaCalls = 0;

    const adapter: DatabaseAdapter = {
      prepare(sql: string) {
        if (sql.includes("FROM statistics_snapshot_chunk")) {
          return fakeStatement({ all: async () => [] });
        }
        if (sql.includes("FROM statistics_snapshot") && sql.includes("WHERE user_id = ?")) {
          return fakeStatement({
            first: async () => rows[Math.min(metaCalls++, rows.length - 1)],
          });
        }
        throw new Error("unexpected SQL: " + sql);
      },
      async batch() {},
    };

    const result = await getStatisticsSnapshot(adapter, 1);
    expect(metaCalls).toBeGreaterThanOrEqual(2);
    expect(result?.snapshot_json).toBe('{"books":[]}');
  });

  it("reassembles chunk rows when the metadata row has no inline snapshot", async () => {
    const adapter: DatabaseAdapter = {
      prepare(sql: string) {
        if (sql.includes("FROM statistics_snapshot_chunk")) {
          return fakeStatement({ all: async () => [{ data: '{"books":' }, { data: "[]}" }] });
        }
        if (sql.includes("FROM statistics_snapshot") && sql.includes("WHERE user_id = ?")) {
          return fakeStatement({
            first: async () => ({
              schema_version: 20221111,
              device: "Kindle",
              device_id: "k-1",
              snapshot_json: "",
              statistics_summary_json: null,
              revision: 1,
            }),
          });
        }
        throw new Error("unexpected SQL: " + sql);
      },
      async batch() {},
    };

    const result = await getStatisticsSnapshot(adapter, 1);
    expect(result?.snapshot_json).toBe('{"books":[]}');
  });
});
