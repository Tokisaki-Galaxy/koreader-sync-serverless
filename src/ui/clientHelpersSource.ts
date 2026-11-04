export const clientHelpersSource = `
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function deviceDisplayName(device, unknownLabel) {
  const fallback = unknownLabel || "Unknown device";
  const alias = String(device && device.alias != null ? device.alias : "").trim();
  const name = String(device && device.device != null ? device.device : "").trim();
  return alias || name || fallback;
}

function deviceDisplayNameWithSuffix(device, hasDuplicateName, unknownLabel) {
  const name = deviceDisplayName(device, unknownLabel);
  if (!hasDuplicateName || !device || !device.deviceId) return name;
  return name + " · " + String(device.deviceId).slice(0, 7);
}

function deviceRecordLabel(count, singular, plural) {
  const n = Number(count || 0);
  return n + " " + (n === 1 ? singular : plural);
}

function truncateId(value, head, tail) {
  const text = String(value == null ? "" : value);
  if (!text) return "-";
  if (text.length <= head + tail + 1) return text;
  return text.slice(0, head) + "…" + text.slice(-tail);
}

function deviceSharePercent(device, devices) {
  let total = 0;
  for (let i = 0; i < devices.length; i++) {
    const item = devices[i];
    total += Number(item.records != null ? item.records : item.count || 0);
  }
  if (total <= 0) return 0;
  const own = Number(device.records != null ? device.records : device.count || 0);
  return Math.round((own / total) * 100);
}
`;
