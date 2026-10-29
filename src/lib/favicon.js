/* The browser-tab icon: a red circle that fills up as non-negotiables get done. */

const RED = "#e0212f";

export function drawFavicon(done, total) {
  if (typeof document === "undefined") return;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext && canvas.getContext("2d");
  if (!g) return;
  const c = size / 2;
  const r = size / 2 - 4;
  const frac = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;

  g.clearRect(0, 0, size, size);
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.fillStyle = "rgba(224,33,47,0.14)";
  g.fill();
  if (frac > 0) {
    g.beginPath();
    g.moveTo(c, c);
    g.arc(c, c, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    g.closePath();
    g.fillStyle = RED;
    g.fill();
  }
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.lineWidth = 4;
  g.strokeStyle = RED;
  g.stroke();

  let link = document.getElementById("favicon");
  if (!link) {
    link = document.createElement("link");
    link.id = "favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = canvas.toDataURL("image/png");
}
