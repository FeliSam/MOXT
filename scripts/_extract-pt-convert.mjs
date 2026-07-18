import fs from "node:fs";
const src = fs.readFileSync("scripts/pt-to-es-bulk.mjs", "utf8");
const start = src.indexOf("/** Multi-word / phrase replacements");
const end = src.indexOf("const enFlat = flatten(en)");
const chunk = src.slice(start, end);
const tail = `
function flatten(node, prefix = "", out = {}) {
  if (node == null || typeof node !== "object" || Array.isArray(node)) {
    if (prefix) out[prefix] = node;
    return out;
  }
  for (const [k, v] of Object.entries(node)) {
    const p = prefix ? \`\${prefix}.\${k}\` : k;
    if (v != null && typeof v === "object" && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}

function setPath(root, dotted, value) {
  const parts = dotted.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (node[key] == null || typeof node[key] !== "object" || Array.isArray(node[key])) node[key] = {};
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
}

function escapeString(value) {
  return String(value)
    .replace(/\\\\/g, "\\\\\\\\")
    .replace(/"/g, '\\\\"')
    .replace(/\\n/g, "\\\\n")
    .replace(/\\r/g, "\\\\r")
    .replace(/\\t/g, "\\\\t");
}

function serialize(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);
  if (typeof value === "string") return \`"\${escapeString(value)}"\`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every((v) => typeof v === "string")) {
      return \`[\\n\${value.map((v) => \`\${padInner}"\${escapeString(v)}",\`).join("\\n")}\\n\${pad}]\`;
    }
    return \`[\\n\${value.map((v) => \`\${padInner}\${serialize(v, indent + 1)},\`).join("\\n")}\\n\${pad}]\`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  return \`{\\n\${entries
    .map(([k, v]) => {
      const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return \`\${padInner}\${key}: \${serialize(v, indent + 1)},\`;
    })
    .join("\\n")}\\n\${pad}}\`;
}

export { flatten, setPath, serialize, ptToEs };
`;
fs.writeFileSync("scripts/pt-to-es-convert.mjs", chunk + tail, "utf8");
console.log("ok", chunk.length);
