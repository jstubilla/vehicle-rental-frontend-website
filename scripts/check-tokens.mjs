/**
 * Guards the "design must be swappable" rule. Fails if it finds hardcoded
 * colors anywhere except tokens.css, or hardcoded pixel/rem sizes outside the UI kit.
 * Run with: npm run check:tokens
 * Add `token-check-ignore` to a line to skip it (use rarely, with a reason).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SRC = "src";
const TOKENS_FILE = join("src", "styles", "tokens.css");
const UI_KIT_DIR = join("src", "components", "ui") + sep;

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white";

const rules = [
  { name: "hex color", re: /#[0-9a-fA-F]{3,8}\b/g, uiKitToo: true },
  { name: "rgb/hsl/oklch color", re: /\b(?:rgba?|hsla?|oklch|oklab)\(/g, uiKitToo: true },
  {
    name: "Tailwind default palette class (use a semantic token like bg-primary)",
    re: new RegExp(
      `\\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|divide|accent|decoration)-(?:${PALETTE})(?:-\\d{2,3})?\\b`,
      "g",
    ),
    uiKitToo: true,
  },
  {
    name: "hardcoded size in arbitrary value (add a token instead)",
    re: /\[[^\]\s]*\d(?:px|rem|em|vh|vw)[^\]\s]*\]/g,
    uiKitToo: false,
  },
  { name: "inline style attribute", re: /style=\{\{/g, uiKitToo: false },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|css)$/.test(entry)) yield full;
  }
}

const problems = [];

for (const file of walk(SRC)) {
  if (file === TOKENS_FILE) continue;
  const inUiKit = file.startsWith(UI_KIT_DIR);
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      if (line.includes("token-check-ignore")) return;
      for (const rule of rules) {
        if (inUiKit && !rule.uiKitToo) continue;
        rule.re.lastIndex = 0;
        const match = rule.re.exec(line);
        if (match) {
          problems.push(`${relative(".", file)}:${index + 1}  ${rule.name}: ${match[0]}`);
        }
      }
    });
}

if (problems.length > 0) {
  console.error("Design token check failed:\n");
  problems.forEach((p) => console.error("  " + p));
  console.error(`\n${problems.length} problem(s). Move values into src/styles/tokens.css.`);
  process.exit(1);
}
console.log("Design token check passed.");
