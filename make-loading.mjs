// Builds loading.html -- a standalone page showing the boot cube on its own,
// for screen-recording it.
//
// It is generated rather than written because the capture page has to be the
// same cube the app ships, not a copy of it that drifts. Everything below is
// lifted verbatim out of CubeTeacher.dc.html: same CSS, same markup, same
// script, no edits. The only additions are a size and a background, which are
// presentation, not behaviour -- so what you record is what users see.
//
//   node make-loading.mjs
//
// Re-run after touching the boot overlay in CubeTeacher.dc.html.

import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'CubeTeacher.dc.html';
const OUT = 'loading.html';
const src = readFileSync(SRC, 'utf8');

// Fail loudly rather than emitting a page built from half a match: a silently
// truncated capture harness is worse than none, because it looks like it works.
function carve(what, open, close, { includeClose = true } = {}) {
  const a = src.indexOf(open);
  if (a < 0) throw new Error(`${SRC}: could not find the start of the ${what} (${open.slice(0, 40)}...)`);
  const b = src.indexOf(close, a);
  if (b < 0) throw new Error(`${SRC}: could not find the end of the ${what}`);
  return src.slice(a, includeClose ? b + close.length : b);
}

const css = carve('boot overlay CSS', '<style>\n/* ---- boot overlay', '</style>');
const markup = carve('boot overlay markup', '<div id="ct-boot"', '</div>');
const script = carve('boot cube script', '<script>\n/* ---- boot cube', '</script>');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CubeTeacher boot cube</title>
<!--
  GENERATED FILE -- do not edit. Run \`node make-loading.mjs\` to rebuild it
  from ${SRC}, which is where the boot overlay actually lives.

  The cube, its motion and its timing are byte-identical to the app's. Two
  things are yours to set, via the query string:

    ?size=520          cube size in px (default 420)
    ?bg=111111         page colour, any hex without the #
    ?bg=transparent    no background at all, for compositing over something else
    ?ink=f4f4f4        line colour, any hex without the # (default 1a1a1a)

  e.g.  loading.html?size=600&bg=transparent
        loading.html?bg=111111&ink=f4f4f4      (dark)
-->
${css}
<style>
/* Capture only. The app sits this overlay on top of a booting page; here it is
   the whole page, held at a size worth recording. */
html,body{margin:0;height:100%;background:#f4f4f4}
#ct-boot{z-index:0}
#ct-boot svg{width:var(--cap,420px);height:var(--cap,420px);animation-delay:0ms}
</style>
</head>
<body>
${markup}
<script>
/* Reads the two capture settings before the cube draws its first frame, so the
   recording never opens on a resize or a colour change. */
(function () {
  var q = new URLSearchParams(location.search);
  var size = parseInt(q.get('size'), 10);
  if (size > 0) document.documentElement.style.setProperty('--cap', size + 'px');

  var hex = function (v) { return '#' + v.replace(/^#/, ''); };
  var cube = document.getElementById('ct-boot-cube');

  var bg = q.get('bg');
  if (bg) {
    var colour = bg === 'transparent' ? 'transparent' : hex(bg);
    document.documentElement.style.background = colour;
    document.body.style.background = colour;
    document.getElementById('ct-boot').style.background = colour;
    // The silhouette's fill has to follow the background, not stay at the
    // app's #f4f4f4: it is there to be the page colour showing through the
    // cube's near faces. Left behind on a dark page it stops reading as an
    // outline and turns into a solid light block.
    //
    // Dropping it entirely is safe when nothing should show through at all --
    // hidden edges are never emitted in the first place rather than painted
    // over, so the fill carries no occlusion.
    cube.setAttribute('fill', bg === 'transparent' ? 'none' : colour);
  }

  var ink = q.get('ink');
  if (ink) cube.setAttribute('stroke', hex(ink));
})();
</script>
${script}
</body>
</html>
`;

writeFileSync(OUT, page);
console.log(`${OUT}: ${page.length} bytes (css ${css.length}, markup ${markup.length}, script ${script.length})`);
