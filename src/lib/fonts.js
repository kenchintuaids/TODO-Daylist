/* Registers the two fonts. Put the font files in public/fonts/ (see public/fonts/README.txt).
   If a file is missing, or the font is not installed on the computer, the browser quietly
   uses the stand-in fonts from index.html instead. */

const css = `
@font-face {
  font-family: "Akira Expanded";
  src: local("Akira Expanded"), local("AkiraExpanded-SuperBold"), local("Akira Expanded Super Bold"),
    url("fonts/AkiraExpanded.woff2") format("woff2"),
    url("fonts/AkiraExpanded.otf") format("opentype"),
    url("fonts/AkiraExpanded.ttf") format("truetype");
  font-display: swap;
}
@font-face {
  font-family: "ITC Benguiat Std Medium Condensed";
  src: local("ITC Benguiat Std Medium Condensed"), local("BenguiatStd-MdCn"), local("ITCBenguiatStd-MediumCondensed"),
    url("fonts/BenguiatMdCn.woff2") format("woff2"),
    url("fonts/BenguiatMdCn.otf") format("opentype"),
    url("fonts/BenguiatMdCn.ttf") format("truetype");
  font-display: swap;
}`;

export function installFonts() {
  if (typeof document === "undefined" || document.getElementById("daybook-fonts")) return;
  const el = document.createElement("style");
  el.id = "daybook-fonts";
  el.textContent = css;
  document.head.appendChild(el);
}
