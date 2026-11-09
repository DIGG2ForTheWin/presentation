// Part: Act 1, SDK today and the 30 MB wall (GHI-004).
//
// The main actions, as Domibus does them (Domibus 5.2.1 source) inside SDK (DIGG): the sending access point
// stamps the message (signs it) and locks it (encrypts it); it goes straight to the receiving access point,
// which unlocks it, checks the stamp (verifies the signature) and sends an acknowledgement back.
//
// Clean by design: pictures only, and the one line of text is the caption at the bottom. The only figure is the
// SDK limit, read from content.js. Smooth by design: one message object makes the whole trip on one route and
// carries its stamp and lock with it; every move uses the same two easings.
//
// One SVG in user units (viewBox 1600 × 900, "meet"), so the picture keeps its shape at any window size.
// Movement uses offset-path in user units with offset-distance in %, and transforms in % or unitless (ADR-013).
import content from "../../content.js";

const limit = `${content.sdkLimitMb} MB`;

// ---------------------------------------------------------------------------------------------------------------
// Geometry.

const P = (x, y) => ({ x, y });
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const cubicAt = (a, c1, c2, b, t) => {
  const u = 1 - t;
  return P(
    u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  );
};

/** A route from line and cubic segments, with the length at the end of each segment, so stops can be placed exactly. */
function track(start, ...segs) {
  let d = `M${start.x} ${start.y}`;
  let len = 0;
  let cur = start;
  const ends = [];
  for (const s of segs) {
    const to = s[s.length - 1];
    if (s[0] === "L") {
      d += ` L${to.x} ${to.y}`;
      len += dist(cur, to);
    } else {
      const [, c1, c2] = s;
      d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
      let prev = cur;
      for (let i = 1; i <= 64; i++) {
        const p = cubicAt(cur, c1, c2, to, i / 64);
        len += dist(prev, p);
        prev = p;
      }
    }
    cur = to;
    ends.push(len);
  }
  return { d, stops: ends.map((e) => `${((e / len) * 100).toFixed(3)}%`) };
}

const y = 430; // the line everything sits on
const hospA = 200;
const hospB = 1400;
const apA = 540;
const apB = 1060;

// SDK encloses the access points only: a pill from x 420 to 1180.
const sdk = { x: 420, y: 300, w: 760, h: 260, r: 130 };

// The message's one route: Hospital A → access point A → arc → access point B → Hospital B.
const route = track(
  P(270, y),
  ["L", P(apA, y)],
  ["C", P(apA + 173, y - 67), P(apB - 173, y - 67), P(apB, y)],
  ["L", P(1330, y)],
);
const [atApA, atApB] = route.stops;

const ackPath = `M${apB} ${y + 30} Q800 ${y + 140} ${apA} ${y + 30}`;
const studyPath = `M310 ${y} H480`; // toward SDK's edge, where it is stopped
// Outside SDK, the post: a USB stick out of Hospital A's door, into an envelope, into a van, to Hospital B's door.
const vanY = 690; // the van body's centre line
const roadY = vanY + 46;
const inVan = P(-40, -13); // the middle of the van's cargo box, relative to the van
const vanRoute = track(P(-180, vanY), ["L", P(hospA, vanY)], ["L", P(hospB, vanY)], ["L", P(1780, vanY)]);
const [vanAtA, vanAtB] = vanRoute.stops;
const envA = P(hospA + inVan.x, 600); // where the envelope is filled, just above the van's stop
const envB = P(hospB + inVan.x, vanY + inVan.y); // inside the van at Hospital B
const loadDrop = `translate(0, ${(((vanY + inVan.y - envA.y) / 58) * 100).toFixed(1)}%)`; // envelope height 58
const usbRoute = track(P(hospA, 478), ["L", P(hospA, 540)], ["L", P(envA.x, envA.y - 4)]);
const [usbOut] = usbRoute.stops;
const intoB = `M${envB.x} ${envB.y} L${hospB} 478`;
// Wheel turns that match the distance driven (wheel radius 15), so the wheels roll rather than spin.
const turn = (dx) => `rotate(${Math.round((dx / (2 * Math.PI * 15)) * 360)}deg)`;
const fromStart = (x) => x + 180; // distance driven from the van's start

// ---------------------------------------------------------------------------------------------------------------
// Pictures (no labels: the caption names each thing as it appears).

const hospital = (x, cls) => `
  <g class="${cls}">
    <path d="M${x - 70} 500 V350 L${x} 292 L${x + 70} 350 V500 Z M${x - 22} 500 v-46 h44 v46" pathLength="1" class="a1-draw ${cls}-outline"/>
    <path d="M${x - 14} 380 h28 M${x} 366 v28" class="a1-soft ${cls}-cross"/>
  </g>`;

const accessPoint = (x, cls) => `
  <g class="${cls} a1-soft">
    <rect x="${x - 45}" y="${y - 45}" width="90" height="90" rx="12" class="a1-box"/>
    <path d="M${x - 24} ${y - 14} h48 M${x - 24} ${y + 2} h48 M${x - 24} ${y + 18} h28"/>
    <circle cx="${x + 18}" cy="${y + 18}" r="3" class="a1-dot"/>
  </g>`;

// An envelope centred on c; its flap folds from open (pointing up) to closed.
const envelopeShape = (c, closed = false) => `
    <rect x="${c.x - 44}" y="${c.y - 29}" width="88" height="58" rx="6" class="a1-box"/>
    <path d="M${c.x - 44} ${c.y - 29} L${c.x} ${c.y + 6} L${c.x + 44} ${c.y - 29}"${closed ? "" : ' class="a1-flap"'}/>`;
const envelope = (cls, c) => `<g class="${cls} a1-post a1-soft">${envelopeShape(c)}</g>`;

const ring = (cx, cy, r, cls) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="a1-ring ${cls}"/>`;

const caption = (n, text) => `<text x="800" y="830" class="a1-caption a1-c${n}">${text}</text>`;

// Edited in content.js; there must be one per step.
const captions = content.act1Captions.map((c) => c.replaceAll("{limit}", limit));
if (captions.length !== 15) throw new Error(`content.js act1Captions needs exactly 15 sentences, one per step; it has ${captions.length}`);

const scene = `
<style>
  .a1 { width: 100%; height: 100%; display: block; font-size: 34px; }
  .a1 text { fill: var(--ink); stroke: none; text-anchor: middle; }
  .a1 path, .a1 rect, .a1 circle { fill: none; stroke: var(--ink); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
  .a1 .a1-box { fill: var(--bg); }
  .a1 .a1-route { stroke: var(--route); }
  .a1 .a1-dot { fill: var(--ink); stroke: none; }

  /* Base state: nothing shown until its step (ADR-004). Every moving part scales and drifts from its own box. */
  .a1 g, .a1 path, .a1 rect, .a1 circle, .a1 text { transform-box: fill-box; transform-origin: 50% 50%; }
  .a1 .a1-draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
  .a1 .a1-soft { opacity: 0; transform: scale(0.92); }
  .a1 .a1-ring, .a1 .a1-hidden { opacity: 0; }
  .a1 .a1-caption { opacity: 0; transform: translate(0, 40%); }
  /* Travellers place themselves on their route in the SVG's own coordinates, so not from their own box. */
  .a1 .a1-traveller { opacity: 0; offset-rotate: 0deg; offset-distance: 0%; transform-box: view-box; transform-origin: 0 0; }

  .a1 .a1-sdk { stroke: var(--route); }
  .a1 .a1-sdk-fill { fill: var(--route); stroke: none; opacity: 0; }
  .a1 .a1-arc { stroke: var(--route); opacity: 0.4; }

  .a1 .a1-stamp { opacity: 0; transform-origin: 50% 100%; transform: translate(0, -90%); }
  /* Grows about the message's own centre (its 0 0), whatever the stamp inside it is doing. */
  .a1 .a1-msg-body { transform-box: view-box; transform-origin: 0 0; }
  .a1 .a1-door-l, .a1 .a1-door-r { opacity: 0; transform: scaleX(0); }
  .a1 .a1-door-l { transform-origin: 0% 50%; }
  .a1 .a1-door-r { transform-origin: 100% 50%; }
  .a1 .a1-latch { opacity: 0; transform: scale(0); }
  .a1 .a1-seal { opacity: 0; transform: scale(0.4); }
  .a1 .a1-seal-glow { fill: var(--route); stroke: none; opacity: 0; }
  .a1 .a1-scan { fill: var(--route); stroke: none; opacity: 0; }

  .a1 .a1-slice { opacity: 0; transform: translate(-30%, 0) scale(0.9); }
  .a1 .a1-wall { stroke: var(--limit); stroke-width: 5; }
  .a1 .a1-road { stroke-dasharray: 2 16; opacity: 0; }
  .a1 .a1-flap { transform-origin: 50% 0%; transform: scaleY(-1); }
  /* The old way, the post, is the one warm thing besides the wall. */
  .a1 .a1-post path, .a1 .a1-post rect, .a1 .a1-post circle, .a1 path.a1-post { stroke: var(--limit); }
  .a1 .a1-post .a1-dot { fill: var(--limit); stroke: none; }
</style>
<svg class="a1" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-label="Act 1: SDK today">
  <!-- SDK, around the access points -->
  <rect x="${sdk.x}" y="${sdk.y}" width="${sdk.w}" height="${sdk.h}" rx="${sdk.r}" class="a1-sdk-fill"/>
  <rect x="${sdk.x}" y="${sdk.y}" width="${sdk.w}" height="${sdk.h}" rx="${sdk.r}" pathLength="1" class="a1-draw a1-sdk"/>

  ${hospital(hospA, "a1-hosp-a")}
  ${hospital(hospB, "a1-hosp-b")}
  <path d="M270 ${y} H${apA - 45}" pathLength="1" class="a1-draw a1-link-a"/>
  <path d="M${apB + 45} ${y} H1330" pathLength="1" class="a1-draw a1-link-b"/>
  <path d="M${apA} ${y} C${apA + 173} ${y - 67} ${apB - 173} ${y - 67} ${apB} ${y}" pathLength="1" class="a1-draw a1-arc"/>
  ${accessPoint(apA, "a1-ap-a")}
  ${accessPoint(apB, "a1-ap-b")}

  ${ring(hospB, 410, 110, "a1-ring-b")}
  ${ring(apA, y, 70, "a1-ring-ap")}
  ${ring(hospB, 410, 110, "a1-ring-post")}

  <!-- The message: one object for the whole trip. It carries its own stamp, seal, doors and scan line,
       so each lands exactly on it wherever it is. -->
  <g class="a1-traveller a1-msg" style="offset-path: path('${route.d}')">
   <g class="a1-msg-body">
    <path d="M-28 -36 H14 L28 -22 V36 H-28 Z" class="a1-box"/>
    <path d="M14 -36 V-22 H28"/>
    <path d="M-17 -16 h26 M-17 -4 h34 M-17 8 h20"/>
    <g class="a1-seal">
      <circle cx="-10" cy="23" r="13" class="a1-box"/>
      <circle cx="-10" cy="23" r="13" class="a1-seal-glow"/>
      <path d="M-15 23 l4 4 l6 -8"/>
    </g>
    <g class="a1-door-l">
      <rect x="-33" y="-41" width="33" height="82" rx="4" class="a1-box"/>
      <path d="M-25 -31 V31 M-9 -8 V8"/>
    </g>
    <g class="a1-door-r">
      <rect x="0" y="-41" width="33" height="82" rx="4" class="a1-box"/>
      <path d="M25 -31 V31 M9 -8 V8"/>
    </g>
    <rect x="-12" y="-5" width="24" height="10" rx="3" class="a1-box a1-latch"/>
    <rect x="-30" y="-40" width="60" height="4" rx="2" class="a1-scan"/>
    <g class="a1-stamp">
      <circle cx="-10" cy="-62" r="12"/>
      <rect x="-15" y="-50" width="10" height="58" rx="3" class="a1-box"/>
      <rect x="-28" y="8" width="36" height="16" rx="4" class="a1-box"/>
      <path d="M-26 28 h32"/>
    </g>
   </g>
  </g>

  <!-- The acknowledgement -->
  <g class="a1-traveller a1-ack" style="offset-path: path('${ackPath}')">
    <path d="M-18 -23 H8 L18 -13 V23 H-18 Z" class="a1-box"/>
    <path d="M-9 1 l6 6 l11 -12"/>
  </g>

  <!-- The DICOM study, and SDK's edge turning into a wall -->
  <path d="M${sdk.x + sdk.r} ${sdk.y} A${sdk.r} ${sdk.r} 0 0 0 ${sdk.x + sdk.r} ${sdk.y + sdk.h}" pathLength="1" class="a1-draw a1-wall"/>
  <g class="a1-traveller a1-study" style="offset-path: path('${studyPath}')">
    <g class="a1-study-body">
      ${[3, 2, 1, 0]
        .map(
          (k) => `<g class="a1-slice a1-slice-${k}">
        <rect x="${-34 + k * 7}" y="${-42 - k * 7}" width="60" height="74" rx="5" class="a1-box"/>
        ${k === 0 ? `<path d="M-24 -10 q 18 -16 36 0 q -18 16 -36 0 Z M-18 14 h28"/>` : ""}
      </g>`,
        )
        .join("")}
    </g>
  </g>

  <!-- Outside SDK: the post -->
  <path d="M60 ${roadY} H1540" class="a1-road a1-post"/>
  <g class="a1-traveller a1-usb a1-post" style="offset-path: path('${usbRoute.d}')">
    <rect x="-40" y="-18" width="62" height="36" rx="8" class="a1-box"/>
    <path d="M22 -10 h16 v20 h-16 M27 -4 h6 M27 4 h6"/>
    <circle cx="-22" cy="0" r="4" class="a1-dot"/>
  </g>
  ${envelope("a1-env-a", envA)}
  <g class="a1-traveller a1-env-b a1-post" style="offset-path: path('${intoB}')">${envelopeShape(P(0, 0), true)}</g>
  <!-- Drawn after both envelopes, so an envelope inside it is hidden by its cargo box -->
  <g class="a1-traveller a1-van a1-post" style="offset-path: path('${vanRoute.d}')">
    <path d="M30 -22 H66 L90 4 V24 H30 Z" class="a1-box"/>
    <path d="M40 -12 H62 L78 4 H40 Z"/>
    <rect x="-110" y="-50" width="140" height="74" rx="8" class="a1-box"/>
    <g class="a1-wheel a1-wheel-1"><circle cx="-70" cy="30" r="15" class="a1-box"/><path d="M-70 17 V43 M-83 30 H-57"/></g>
    <g class="a1-wheel a1-wheel-2"><circle cx="58" cy="30" r="15" class="a1-box"/><path d="M58 17 V43 M45 30 H71"/></g>
  </g>

  ${captions.map((c, i) => caption(i + 1, c)).join("")}
</svg>`;

// ---------------------------------------------------------------------------------------------------------------
// Steps. Declarative only; the controller plays, reverses and skips them (ADR-003).

const glide = "cubic-bezier(.65, 0, .35, 1)"; // moves: gentle start, gentle stop
const settle = "cubic-bezier(.22, 1, .36, 1)"; // arrivals: quick, then softly into place

const appear = (target, delay = 0, duration = 900) => ({
  target,
  keyframes: { opacity: 1, transform: "scale(1)" },
  timing: { duration, delay, easing: settle },
});
const draw = (target, delay = 0, duration = 1400) => ({ target, keyframes: { strokeDashoffset: 0 }, timing: { duration, delay, easing: glide } });
const to = (target, keyframes, duration, delay = 0, easing = glide) => ({ target, keyframes, timing: { duration, delay, easing } });
// Starts invisible: the controller fills backwards, so a visible first keyframe would show during the delay.
const pulse = (target, delay = 0) => ({
  target,
  keyframes: [{ opacity: 0, transform: "scale(0.7)" }, { opacity: 0.6, offset: 0.15 }, { opacity: 0, transform: "scale(1.35)" }],
  timing: { duration: 1400, delay, easing: "ease-out" },
});

// Captions drift: the old one rises away, then the new one rises into place.
const swap = (n) => [
  to(`.a1-c${n}`, { opacity: 1, transform: "translate(0, 0)" }, 800, n > 1 ? 350 : 300, settle),
  ...(n > 1 ? [to(`.a1-c${n - 1}`, { opacity: 0, transform: "translate(0, -40%)" }, 450, 0, "ease-in")] : []),
];

const stampDown = 1600;
const zoom = 1.7; // the message's size while an access point works on it

const steps = [
  // 1. Two hospitals.
  [
    draw(".a1-hosp-a-outline", 0, 1600),
    appear(".a1-hosp-a-cross", 900),
    draw(".a1-hosp-b-outline", 250, 1600),
    appear(".a1-hosp-b-cross", 1150),
    ...swap(1),
  ],
  // 2. Each gets its access point.
  [appear(".a1-ap-a", 0), appear(".a1-ap-b", 200), draw(".a1-link-a", 300, 1100), draw(".a1-link-b", 500, 1100), ...swap(2)],
  // 3. SDK closes around the access points.
  [draw(".a1-sdk", 0, 2200), to(".a1-sdk-fill", { opacity: 0.04 }, 1200, 1200, "ease-out"), ...swap(3)],
  // 4. The message goes to access point A.
  [
    to(".a1-msg", [{ opacity: 0, offsetDistance: "0%" }, { opacity: 1, offset: 0.25 }, { opacity: 1, offsetDistance: atApA }], 1600),
    ...swap(4),
  ],
  // 5. The message grows so the work on it is easy to see; the stamp comes down, presses, lifts away.
  [
    to(".a1-msg-body", { transform: `scale(${zoom})` }, 800, 0, glide),
    to(
      ".a1-stamp",
      [
        { opacity: 0, transform: "translate(0, -90%)" },
        { opacity: 1, transform: "translate(0, -55%)", offset: 0.3 },
        { opacity: 1, transform: "translate(0, 0) scale(1, 1)", offset: 0.5, easing: "ease-in" },
        { opacity: 1, transform: "translate(0, 0) scale(1.04, 0.9)", offset: 0.56 },
        { opacity: 1, transform: "translate(0, -55%) scale(1, 1)", offset: 0.82 },
        { opacity: 0, transform: "translate(0, -90%)" },
      ],
      stampDown,
      600,
      "ease-in-out",
    ),
    to(".a1-seal", { opacity: 1, transform: "scale(1)" }, 600, 600 + stampDown * 0.53, settle),
    ...swap(5),
  ],
  // 6. Two doors swing shut over the message and a latch slides across them.
  [
    to(".a1-door-l", { opacity: 1, transform: "scaleX(1)" }, 1000, 0, glide),
    to(".a1-door-r", { opacity: 1, transform: "scaleX(1)" }, 1000, 0, glide),
    to(".a1-latch", { opacity: 1, transform: "scale(1)" }, 500, 950, settle),
    ...swap(6),
  ],
  // 7. Straight across to access point B.
  [
    to(".a1-msg-body", { transform: "scale(1)" }, 700, 0, glide),
    draw(".a1-arc", 200, 1800),
    to(".a1-msg", { offsetDistance: atApB }, 2200, 500),
    ...swap(7),
  ],
  // 8. Unlocked: the latch slides away and the doors swing open.
  [
    to(".a1-msg-body", { transform: `scale(${zoom})` }, 800, 0, glide),
    to(".a1-latch", { opacity: 0, transform: "scale(0)" }, 400, 700, glide),
    to(".a1-door-l", { opacity: 0, transform: "scaleX(0)" }, 1000, 1050, glide),
    to(".a1-door-r", { opacity: 0, transform: "scaleX(0)" }, 1000, 1050, glide),
    ...swap(8),
  ],
  // 9. A scan line passes over the stamp; the stamp lights up: the signature checks out.
  [
    to(
      ".a1-scan",
      [
        { opacity: 0, transform: "translate(0, 0)" },
        { opacity: 0.9, offset: 0.1 },
        { transform: "translate(0, 1900%)", offset: 0.5 },
        { opacity: 0.9, transform: "translate(0, 0)", offset: 0.9 },
        { opacity: 0, transform: "translate(0, 0)" },
      ],
      1800,
      0,
      "ease-in-out",
    ),
    to(".a1-seal-glow", { opacity: 0.6 }, 600, 1500, "ease-out"),
    ...swap(9),
  ],
  // 10. The acknowledgement goes back; the message shrinks back and carries on into Hospital B.
  [
    to(".a1-msg-body", { transform: "scale(1)" }, 700, 0, glide),
    to(".a1-ack", [{ opacity: 0, offsetDistance: "0%" }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0, offsetDistance: "100%" }], 2000),
    pulse(".a1-ring-ap", 1800),
    to(".a1-msg", [{ offsetDistance: atApB, opacity: 1 }, { opacity: 1, offset: 0.75 }, { offsetDistance: "100%", opacity: 0 }], 1600, 900),
    pulse(".a1-ring-b", 2200),
    ...swap(10),
  ],
  // 11. The arc fades back; a DICOM study builds up, slice by slice.
  [
    to(".a1-arc", { opacity: 0.2 }, 800),
    to(".a1-study", { opacity: 1 }, 10, 200),
    ...[3, 2, 1, 0].map((k, i) => to(`.a1-slice-${k}`, { opacity: 1, transform: "translate(0, 0) scale(1)" }, 900, 250 + i * 200, settle)),
    ...swap(11),
  ],
  // 12. It heads for SDK; SDK's edge turns into a wall; it is pushed back.
  [
    draw(".a1-wall", 600, 900),
    to(
      ".a1-study",
      [
        { offsetDistance: "0%" },
        { offsetDistance: "46%", offset: 0.5, easing: "ease-in" },
        { offsetDistance: "36%", offset: 0.62, easing: "ease-out" },
        { offsetDistance: "20%" },
      ],
      2200,
      0,
      settle,
    ),
    ...swap(12),
  ],
  // 13. The study goes back into Hospital A; a USB stick comes out of its door.
  [
    to(".a1-study", [{ offsetDistance: "20%", opacity: 1 }, { offsetDistance: "0%", opacity: 0 }], 1000, 0, glide),
    to(".a1-wall", { strokeDashoffset: 1 }, 900, 300, glide),
    to(".a1-usb", [{ opacity: 0, offsetDistance: "0%" }, { opacity: 1, offset: 0.3 }, { opacity: 1, offsetDistance: usbOut }], 1300, 900, settle),
    ...swap(13),
  ],
  // 14. An envelope opens beneath it; the stick drops in and the flap folds shut.
  [
    appear(".a1-env-a", 0, 700),
    to(".a1-usb", [{ offsetDistance: usbOut, opacity: 1 }, { opacity: 1, offset: 0.7 }, { offsetDistance: "100%", opacity: 0 }], 1000, 600, "ease-in"),
    to(".a1-env-a .a1-flap", { transform: "scaleY(1)" }, 700, 1600, glide),
    ...swap(14),
  ],
  // 15. A van drives up, takes the envelope, drives to Hospital B, hands it in at the door and leaves.
  [
    to(".a1-road", { opacity: 0.4 }, 900, 0, "ease-out"),
    to(
      ".a1-van",
      [
        { offsetDistance: "0%", opacity: 0 },
        { opacity: 1, offset: 0.05 },
        { offsetDistance: vanAtA, offset: 0.2, easing: glide },
        { offsetDistance: vanAtA, offset: 0.275, easing: glide },
        { offsetDistance: vanAtB, offset: 0.725, easing: glide },
        { offsetDistance: vanAtB, offset: 0.825, easing: glide },
        { opacity: 1, offset: 0.95 },
        { offsetDistance: "100%", opacity: 0 },
      ],
      8000,
      0,
      "linear",
    ),
    ...[".a1-wheel-1", ".a1-wheel-2"].map((w) =>
      to(
        w,
        [
          { transform: "rotate(0deg)" },
          { transform: turn(fromStart(hospA)), offset: 0.2, easing: glide },
          { transform: turn(fromStart(hospA)), offset: 0.275, easing: glide },
          { transform: turn(fromStart(hospB)), offset: 0.725, easing: glide },
          { transform: turn(fromStart(hospB)), offset: 0.825, easing: glide },
          { transform: turn(fromStart(1780)) },
        ],
        8000,
        0,
        "linear",
      ),
    ),
    // Down into the cargo box (the van hides it), then gone before the van drives off and would reveal it.
    to(".a1-env-a", { transform: `${loadDrop} scale(1)` }, 550, 1600, "ease-in"),
    to(".a1-env-a", { opacity: 0 }, 10, 2150, "linear"),
    // At Hospital B it rises out of the van and in at the door.
    to(".a1-env-b", [{ opacity: 0, offsetDistance: "0%" }, { opacity: 1, offset: 0.02 }, { opacity: 1, offset: 0.75 }, { opacity: 0, offsetDistance: "100%" }], 1300, 5900, glide),
    pulse(".a1-ring-post", 6900),
    ...swap(15),
  ],
];

export default { scene, steps };
