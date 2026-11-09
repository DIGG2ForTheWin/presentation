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

// Smoke strength: starts at content.js's value and scales how visible both hazes in index.html's #smoke filter are.
// + / - change it by 0.1 live, with nothing shown; a reload goes back to content.js's value.
const hazes = [...document.querySelectorAll("#smoke feFuncA")].map((f) => [f, Number(f.getAttribute("slope"))]);
let smoke = content.smoke;
const setSmoke = (v) => {
  smoke = Math.max(0, Math.round(v * 10) / 10);
  for (const [f, base] of hazes) f.setAttribute("slope", base * smoke);
};
setSmoke(smoke);
document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "+" || e.key === "=") setSmoke(smoke + 0.1);
  else if (e.key === "-" || e.key === "_") setSmoke(smoke - 0.1);
});

const stage = document.getElementById("stage");
const steps = [];
let shown = null; // scene of the last part that had steps

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
