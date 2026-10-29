/* WhatsApp-style doodle wallpaper: small line drawings tiled across the background. */

const D = {
  star: "M20 4 L24.5 15 L36 16 L27 24 L30 36 L20 29.5 L10 36 L13 24 L4 16 L15.5 15 Z",
  heart: "M20 34 C6 24 4 14 11 9 C15 6 19 8 20 12 C21 8 25 6 29 9 C36 14 34 24 20 34 Z",
  book: "M5 8 H19 V32 H5 Z M19 8 H35 V32 H19 Z M9 14 H15 M9 19 H15 M23 14 H31 M23 19 H31",
  pencil: "M7 33 L9.5 24 L27 6.5 L33.5 13 L16 30.5 Z M23.5 10 L30 16.5 M9.5 24 L16 30.5",
  cup: "M7 14 H27 V26 C27 31 23 34 17 34 C11 34 7 31 7 26 Z M27 17 H31 C35 17 35 25 29 25 H27 M13 5 C11 8 15 9 13 12 M19 5 C17 8 21 9 19 12",
  moon: "M26 5 C16 7 11 17 15 26 C19 35 31 35 35 28 C27 30 20 22 26 5 Z",
  cloud: "M10 29 C3 29 3 19 11 19 C12 11 23 10 25 18 C32 16 36 27 29 29 Z",
  clock: "M20 7 A13 13 0 1 0 20.01 7 Z M20 13 V20 L26 24",
  tick: "M7 7 H33 V33 H7 Z M12 20 L18 26 L29 13",
  bolt: "M23 4 L10 22 H19 L16 36 L30 16 H21 Z",
  flower: "M20 15 A5 5 0 1 0 20.01 15 Z M20 15 C15 6 25 6 20 15 M25 20 C34 15 34 25 25 20 M20 25 C25 34 15 34 20 25 M15 20 C6 25 6 15 15 20",
  note: "M14 31 V9 L31 5 V27 M14 31 A4.5 4 0 1 1 9.5 27 A4.5 4 0 0 1 14 31 M31 27 A4.5 4 0 1 1 26.5 23 A4.5 4 0 0 1 31 27",
  wave: "M3 20 C7 9 11 31 15 20 S23 9 27 20 S35 31 38 20",
  weights: "M5 15 V25 M9 11 V29 M9 20 H31 M31 11 V29 M35 15 V25",
  bulb: "M20 5 C12 5 8 12 12 19 C14 22 15 24 15 27 H25 C25 24 26 22 28 19 C32 12 28 5 20 5 Z M16 31 H24 M17.5 35 H22.5",
  drop: "M20 5 C14 14 9 19 9 25 A11 11 0 0 0 31 25 C31 19 26 14 20 5 Z",
};

/* [shape, x, y, rotation, scale] inside a 340 x 340 tile */
const LAYOUT = [
  ["star", 14, 12, -12, 1], ["cup", 98, 22, 8, 1], ["moon", 190, 8, 14, 1], ["book", 270, 26, -8, 1],
  ["heart", 52, 84, 10, 0.95], ["tick", 142, 74, -6, 0.95], ["cloud", 226, 82, 6, 1], ["pencil", 296, 96, 18, 0.95],
  ["bolt", 12, 150, 8, 1], ["clock", 92, 148, -10, 1], ["flower", 176, 142, 12, 1], ["note", 262, 160, -14, 1],
  ["wave", 40, 222, -6, 1], ["bulb", 118, 226, 8, 1], ["weights", 202, 224, -10, 1], ["drop", 282, 228, 10, 0.95],
  ["star", 68, 292, 14, 0.8], ["heart", 168, 296, -12, 0.8], ["moon", 244, 292, -20, 0.85], ["cup", 18, 286, -8, 0.8],
];

function tile(color, opacity) {
  const items = LAYOUT.map(([name, x, y, rot, s]) =>
    `<g transform="translate(${x} ${y}) rotate(${rot} 20 20) scale(${s})"><path d="${D[name]}"/></g>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><g fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${items}</g></svg>`;
}

const cache = {};
export function doodleUrl(theme) {
  if (!cache[theme]) {
    const svg = theme === "dark" ? tile("#8ab8ff", 0.16) : tile("#1557b0", 0.2);
    cache[theme] = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  return cache[theme];
}

export const doodleSvg = tile;
