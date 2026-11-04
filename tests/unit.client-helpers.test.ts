import { describe, expect, it } from "vitest";
import {
  deviceDisplayName,
  deviceDisplayNameWithSuffix,
  deviceRecordLabel,
  deviceSharePercent,
  escapeHtml,
  truncateId,
} from "../src/ui/clientHelpers.mjs";

describe("client helpers", () => {
  it.each([
    ["<script>alert(1)</script>", "&lt;script&gt;alert(1)&lt;/script&gt;"],
    ['a & b "c" \'d\'', "a &amp; b &quot;c&quot; &#39;d&#39;"],
    [null, ""],
    [undefined, ""],
    [0, "0"],
    [42, "42"],
  ])("escapes %s", (input, expected) => {
    expect(escapeHtml(input)).toBe(expected);
  });

  it.each([
    [{ alias: "My Kindle", device: "Kindle" }, "My Kindle"],
    [{ alias: "  ", device: "Kindle" }, "Kindle"],
    [{ device: "  " }, "Unknown device"],
    [null, "Unknown device"],
  ])("resolves a device name from %j", (device, expected) => {
    expect(deviceDisplayName(device)).toBe(expected);
  });

  it("accepts a custom unknown label", () => {
    expect(deviceDisplayName({}, "未知设备")).toBe("未知设备");
  });

  it("adds a short id suffix only for duplicate display names", () => {
    expect(deviceDisplayNameWithSuffix({ device: "Kindle", deviceId: "DFE7C1108D" }, true)).toBe("Kindle · DFE7C11");
    expect(deviceDisplayNameWithSuffix({ alias: "My Kindle", deviceId: "DFE7C1108D" }, true)).toBe("My Kindle · DFE7C11");
    expect(deviceDisplayNameWithSuffix({ device: "Kindle", deviceId: "DFE7C1108D" }, false)).toBe("Kindle");
    expect(deviceDisplayNameWithSuffix({ device: "Kindle" }, true)).toBe("Kindle");
    expect(deviceDisplayNameWithSuffix({}, true)).toBe("Unknown device");
  });

  it.each([
    [0, "record", "records", "0 records"],
    [1, "record", "records", "1 record"],
    [5, "record", "records", "5 records"],
    [1, "条记录", "条记录", "1 条记录"],
    [5, "条记录", "条记录", "5 条记录"],
  ])("formats %i records", (count, singular, plural, expected) => {
    expect(deviceRecordLabel(count, singular, plural)).toBe(expected);
  });

  it.each([
    ["DFE7C1108D224A93A5B9D57428370490", 8, 6, "DFE7C110…370490"],
    ["short", 8, 6, "short"],
    ["", 8, 6, "-"],
    [null, 8, 6, "-"],
  ])("truncates %s", (value, head, tail, expected) => {
    expect(truncateId(value, head, tail)).toBe(expected);
  });

  it("computes share percentages from records and count fields", () => {
    expect(deviceSharePercent({ records: 3 }, [{ records: 3 }, { records: 1 }])).toBe(75);
    expect(deviceSharePercent({ count: 2 }, [{ count: 2 }, { count: 2 }])).toBe(50);
    expect(deviceSharePercent({ records: 0 }, [])).toBe(0);
    expect(deviceSharePercent({ records: 0 }, [{ records: 0 }])).toBe(0);
  });
});
