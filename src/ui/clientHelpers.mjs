export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function deviceDisplayName(device, unknownLabel = "Unknown device") {
  const alias = String(device && device.alias != null ? device.alias : "").trim();
  const name = String(device && device.device != null ? device.device : "").trim();
  return alias || name || unknownLabel;
}

export function deviceDisplayNameWithSuffix(device, hasDuplicateName, unknownLabel = "Unknown device") {
  const name = deviceDisplayName(device, unknownLabel);
  if (!hasDuplicateName || !device || !device.deviceId) return name;
  return name + " · " + String(device.deviceId).slice(0, 7);
}

export function deviceRecordLabel(count, singular, plural) {
  const n = Number(count || 0);
  return n + " " + (n === 1 ? singular : plural);
}

export function truncateId(value, head, tail) {
  const text = String(value == null ? "" : value);
  if (!text) return "-";
  if (text.length <= head + tail + 1) return text;
  return text.slice(0, head) + "…" + text.slice(-tail);
}

export function deviceSharePercent(device, devices) {
  const recordCount = (item) => Number(item.records != null ? item.records : item.count || 0);
  const total = devices.reduce((sum, item) => sum + recordCount(item), 0);
  if (total <= 0) return 0;
  return Math.round((recordCount(device) / total) * 100);
}
