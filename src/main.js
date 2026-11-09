// Part order and startup.
import { start } from "./controller.js";
import content from "../content.js";
import act1 from "./parts/act1-today.js";
import act2 from "./parts/act2-testing.js";
import act3 from "./parts/act3-poc.js";
import comparison from "./parts/comparison.js";
import recommendations from "./parts/recommendations.js";

/**
 * The part contract: what each file in src/parts/ default-exports.
 * @typedef {object} Part
 * @property {string} scene Markup for the part's own scene container, built from content.js.
 * @property {{target: string, keyframes: Keyframe[] | PropertyIndexedKeyframes, timing: object}[][]} steps
 *   In order. Each spec is a controller Spec whose target is a CSS selector, matched (first hit) inside this part's scene.
 */

/** @type {Part[]} The only place that defines part order (ADR-002). */
const parts = [act1, act2, act3, comparison, recommendations];

const handOver = { duration: 600, easing: "ease-in-out" }; // look to be confirmed by the team (FR-001)

// Smoke strength: starts at content.js's value and scales the whole of index.html's #smoke filter:
// how far the haze spreads (blur), swirls (displacement) and rises (offset), and how visible it is (alpha).
// + / - change it by 0.1 live, with nothing shown; a reload goes back to content.js's value.
const knobs = [
  ["feGaussianBlur", "stdDeviation"],
  ["feDisplacementMap", "scale"],
  ["feOffset", "dy"],
  ["feFuncA", "slope"],
].flatMap(([tag, attr]) =>
  [...document.querySelectorAll(`#smoke ${tag}`)].map((el) => [el, attr, Number(el.getAttribute(attr))]),
);
let smoke = content.smoke;
const setSmoke = (v) => {
  smoke = Math.max(0, Math.round(v * 10) / 10);
  for (const [el, attr, base] of knobs) el.setAttribute(attr, base * smoke);
};
setSmoke(smoke);
document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "+" || e.key === "=") setSmoke(smoke + 0.1);
  else if (e.key === "-" || e.key === "_") setSmoke(smoke - 0.1);
});

const stage = document.getElementById("stage");
const steps = [];
// The title on screen before the first →; Act 1's hand-over fades it out like any part change, and ← or Home bring it back.
const title = document.createElement("div");
title.className = "scene title";
title.innerHTML = `<svg viewBox="0 0 1600 900"><text x="800" y="450"></text></svg>`;
stage.append(title);
const titles = ["DIGG", "DOMIBUS"];
const titleText = title.querySelector("text");
// Shows one of the two wordmarks, shrunk to fit if it is wider than the screen allows (DOMIBUS is).
const setTitle = (word) => {
  titleText.textContent = word;
  title.querySelector("svg").setAttribute("aria-label", word);
  titleText.style.fontSize = "";
  const width = titleText.getComputedTextLength();
  if (width > 1400) titleText.style.fontSize = `${(parseFloat(getComputedStyle(titleText).fontSize) * 1400) / width}px`;
};
setTitle(content.title);
// T switches between the two, with nothing else shown.
document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.key.toLowerCase() !== "t") return;
  setTitle(titles[(titles.indexOf(titleText.textContent) + 1) % titles.length]);
});
let shown = title; // scene of the last part that had steps

parts.forEach((part, p) => {
  const scene = document.createElement("div");
  scene.className = "scene";
  scene.innerHTML = part.scene;
  stage.append(scene);

  part.steps.forEach((specs, s) => {
    const step = specs.map(({ target, keyframes, timing }) => {
      const el = scene.querySelector(target);
      if (!el) throw new Error(`Part ${p + 1}, step ${s + 1}: "${target}" matches nothing in its scene`);
      return { target: el, keyframes, timing };
    });
    if (s === 0) {
      step.push({ target: scene, keyframes: { opacity: 1, visibility: "visible" }, timing: handOver });
      if (shown) step.push({ target: shown, keyframes: { opacity: 0, visibility: "hidden" }, timing: handOver });
      shown = scene;
    }
    steps.push(step);
  });
});

start(steps);
