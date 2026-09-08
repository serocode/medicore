#!/usr/bin/env node
/**
 * Checks every colour pair the product actually renders against WCAG 2.2.
 *
 *   pnpm --filter @healthcare/web check:contrast
 *
 * Colours are read from src/index.css, so this measures the real tokens
 * rather than a copy of them that can drift. Add a pair here whenever you use
 * a new combination — a token that passes on white can fail on `surface`.
 *
 * Thresholds:
 *   4.5  normal text (1.4.3 Contrast Minimum)
 *   3.0  the boundary of a user interface component, and focus indicators
 *        (1.4.11 Non-text Contrast)
 *
 * Deliberately not checked: purely decorative edges — card borders, table
 * dividers, the timeline dots on the home page, the bullets in the legal
 * pages. 1.4.11 covers what is *required to identify* a component or its
 * state; a card's outline identifies nothing, and every one of those dots
 * sits beside text that carries the same meaning. `line` (#c0c9c4) is only
 * 1.61:1 on `surface` and that is fine for those uses — which is exactly why
 * form controls use `line-strong` instead.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(fileURLToPath(new URL("../src/index.css", import.meta.url)), "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2]]),
);

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const color = (name) => (name === "white" ? [255, 255, 255] : rgb(tokens[name]));

/** `layer` at `alpha` composited over `base`. */
const over = (layer, base, alpha) => layer.map((c, i) => Math.round(c * alpha + base[i] * (1 - alpha)));

const channel = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background, minimum, where it appears] */
const PAIRS = [
  ["ink", "surface", 4.5, "body text on the page"],
  ["ink", "white", 4.5, "body text on a card"],
  ["ink", "surface-low", 4.5, "text typed into an input"],
  ["ink", "surface-container", 4.5, "text on a hovered chip"],
  ["ink-muted", "surface", 4.5, "secondary text on the page"],
  ["ink-muted", "white", 4.5, "secondary text on a card"],
  ["ink-muted", "surface-low", 4.5, "secondary text in a panel"],
  ["ink-subtle", "surface", 4.5, "captions on the page"],
  ["ink-subtle", "white", 4.5, "captions on a card"],
  ["ink-subtle", "surface-low", 4.5, "captions in a panel"],
  ["ink-subtle", "surface-container", 4.5, "captions on a filled chip"],
  ["primary", "white", 4.5, "links and primary text on a card"],
  ["primary", "surface", 4.5, "links on the page"],
  ["primary", "surface-low", 4.5, "links in a panel"],
  ["primary", "primary-soft", 4.5, "text on a soft primary fill"],
  ["on-primary", "primary", 4.5, "primary button label"],
  ["on-primary", "primary-hover", 4.5, "primary button label, hovered"],
  ["on-primary", "primary-muted", 4.5, "avatar initials"],
  ["on-primary", "accent", 4.5, "avatar initials on accent"],
  ["on-primary-soft", "primary-soft", 4.5, "the active navigation pill"],
  ["on-primary-soft", "primary-soft-dim", 4.5, "avatar initials"],
  ["on-accent-soft", "accent-soft", 4.5, "accent panel text"],
  ["on-accent-soft", "accent-soft-dim", 4.5, "avatar initials"],
  ["accent", "white", 4.5, "accent text on a card"],
  ["accent", "surface-low", 4.5, "accent text in a panel"],
  ["danger", "white", 4.5, "field error messages"],
  ["danger", "surface", 4.5, "error text on the page"],
  ["danger", "surface-low", 4.5, "error text in a panel"],
  ["danger", "danger-soft", 4.5, "error text on a soft danger fill"],
  ["on-danger-soft", "danger-soft", 4.5, "the error banner"],
  ["on-neutral-soft", "neutral-soft", 4.5, "a neutral status badge"],
  ["on-inverse", "inverse", 4.5, "text on a dark panel"],
  ["on-inverse", "primary", 4.5, "text on the primary call-to-action block"],
  ["primary-soft", "primary", 4.5, "supporting text on that block"],
  // Component boundaries and focus indicators — 3:1.
  ["line-strong", "white", 3.0, "input border on a card [non-text]"],
  ["line-strong", "surface", 3.0, "input border on the page [non-text]"],
  ["line-strong", "surface-low", 3.0, "input border against its own fill [non-text]"],
  ["primary", "white", 3.0, "focus ring on a card [non-text]"],
  ["primary", "surface", 3.0, "focus ring on the page [non-text]"],
  ["primary", "surface-low", 3.0, "focus ring on an input [non-text]"],
];

/**
 * Translucent layers, which Tailwind's `/40` utilities produce and a naive
 * token-to-token check would miss entirely.
 *
 * [foreground, [[layer, alpha], ...] painted over base, base, minimum, where]
 */
const COMPOSITES = [
  ["on-accent-soft", [["accent-soft", 0.4]], "surface", 4.5, "demo panel text"],
  ["ink", [["white", 0.8], ["accent-soft", 0.4]], "surface", 4.5, "demo account name"],
  ["ink-muted", [["white", 0.8], ["accent-soft", 0.4]], "surface", 4.5, "demo account headline"],
  ["ink-subtle", [["white", 0.8], ["accent-soft", 0.4]], "surface", 4.5, "demo account role"],
  ["accent", [["white", 0.8], ["accent-soft", 0.4]], "surface", 3.0, "demo role icon [non-text]"],
  ["on-primary-soft", [["primary-soft", 0.5]], "white", 4.5, "success message on a card"],
  ["on-primary-soft", [["primary-soft", 0.5]], "surface", 4.5, "success message on the page"],
  ["on-accent-soft", [["accent-soft", 0.6]], "white", 4.5, "info message on a card"],
  ["on-accent-soft", [["accent-soft", 0.6]], "surface", 4.5, "info message on the page"],
];

/**
 * Translucent *foregrounds* — `text-on-primary/70`, `border-primary-soft/70`.
 * The alpha applies to the ink, not to a layer behind it.
 *
 * [foreground, alpha, background, minimum, where]
 */
const FADED_FOREGROUNDS = [
  ["on-primary", 0.7, "primary", 4.5, "the count inside an active tab"],
  ["primary-soft", 0.7, "primary", 3.0, "outlined button on the CTA block [non-text]"],
];

const failures = [];
const report = [];

for (const [fg, bg, minimum, where] of PAIRS) {
  const ratio = contrast(color(fg), color(bg));
  if (ratio < minimum) failures.push({ what: `${fg} on ${bg}`, ratio, minimum, where });
  report.push([ratio, minimum, `${fg} on ${bg}`, where]);
}

for (const [fg, alpha, bg, minimum, where] of FADED_FOREGROUNDS) {
  const ratio = contrast(over(color(fg), color(bg), alpha), color(bg));
  if (ratio < minimum) failures.push({ what: `${fg}/${alpha * 100} on ${bg}`, ratio, minimum, where });
  report.push([ratio, minimum, `${fg}/${alpha * 100} on ${bg}`, where]);
}

for (const [fg, layers, base, minimum, where] of COMPOSITES) {
  let bg = color(base);
  for (const [layer, alpha] of [...layers].reverse()) bg = over(color(layer), bg, alpha);
  const ratio = contrast(color(fg), bg);
  if (ratio < minimum) failures.push({ what: `${fg} over ${base}`, ratio, minimum, where });
  report.push([ratio, minimum, `${fg} over ${base}`, where]);
}

for (const [ratio, minimum, what, where] of report) {
  const mark = ratio >= minimum ? "ok  " : "FAIL";
  console.log(`${mark} ${ratio.toFixed(2).padStart(6)} (needs ${minimum})  ${what} — ${where}`);
}

console.log();
if (failures.length > 0) {
  console.error(`${failures.length} pair(s) below the threshold:`);
  for (const f of failures) {
    console.error(`  ${f.what}: ${f.ratio.toFixed(2)} < ${f.minimum} — ${f.where}`);
  }
  process.exit(1);
}
console.log(`All ${report.length} colour pairs meet WCAG 2.2 AA.`);
