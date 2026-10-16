// Step controller: keyboard input and every step animation.

/**
 * One animation within a step (ADR-003).
 * @typedef {object} Spec
 * @property {Element} target
 * @property {Keyframe[] | PropertyIndexedKeyframes} keyframes End keyframes only, unless a start is needed (ADR-004 rule 4).
 * @property {{duration: number, delay?: number, easing?: string}} timing The controller sets fill and endDelay itself.
 */

/**
 * Attaches the → / ← handler. The screen starts at step 0, the base state; the first → plays steps[0].
 * @param {Spec[][]} steps The whole story, in order.
 */
export function start(steps) {
  const held = []; // one Animation[] per step reached; its length is the current step
  let active = null; // the step playing: {anims, back}

  // Jumps the playing step to its end and holds. A check that arrives after a skip finds another run and does nothing.
  function settle(run) {
    if (active !== run) return;
    for (const a of run.anims) {
      a.finish();
      if (run.back) a.cancel();
    }
    active = null;
  }

  function play(anims, back) {
    const run = (active = { anims, back });
    // Checked every frame, not via `finished`: Chrome can leave that unresolved for seconds after a reverse ends.
    (function tick() {
      if (anims.every((a) => a.playState === "finished")) settle(run);
      else if (active === run) requestAnimationFrame(tick);
    })();
  }

  function forward(specs) {
    const end = (t) => (t.delay ?? 0) + (t.duration ?? 0);
    const stepEnd = Math.max(...specs.map((s) => end(s.timing)));
    return specs.map(({ target, keyframes, timing }) => {
      const a = target.animate(keyframes, { ...timing, fill: "both", endDelay: stepEnd - end(timing) });
      a.persist();
      return a;
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    if (active) return settle(active);
    if (e.key === "ArrowRight" && held.length < steps.length) {
      const anims = forward(steps[held.length]);
      held.push(anims);
      play(anims, false);
    } else if (e.key === "ArrowLeft" && held.length) {
      const anims = held.pop();
      for (const a of anims) a.reverse();
      play(anims, true);
    }
  });
}
